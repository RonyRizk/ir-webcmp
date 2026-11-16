import { locales } from '@/stores/locales.store';
import { installLanguageInjector } from '@/models/language-injector';
import { LanguageObserver } from '@/utils/language-observer';
import { getLocalLanguage, getLocaleScope } from './locale-scope';
import { LocaleService } from './locale.service';
import { BASE_TABLES } from './screen-tables';
import type { LoadLocaleParams, LocaleBundle, LocaleSections, LocaleTable } from './types';

/**
 * Owns language loading for the whole app: resolves which tables still need
 * fetching, collapses concurrent requests, writes the result into the `locales`
 * store, and re-fetches everything on a language switch.
 *
 * Static by design — the cache is only useful if it is process-wide, and page
 * roots mount and unmount constantly. Deliberately parallel to
 * `CalendarPreferenceController`, which owns the calendar-preference store the
 * same way.
 *
 * Components should not call this directly for plain rendering — read strings
 * with `t()`, which subscribes the component to the store automatically.
 *
 * Screens load their own tables and nothing more; the lists live in
 * `screen-tables.ts`, which is checked against real key usage by its spec.
 *
 *   await LocaleController.load({ language: this.language, tables: SCREEN_TABLES.housekeeping });
 */
export class LocaleController {
  /** @see {@link BASE_TABLES} — kept as a static so call sites read one name. */
  static readonly BASE_TABLES = BASE_TABLES;

  private static service = new LocaleService();
  private static loadedTables = new Set<LocaleTable>();
  /** Per `lang`-subtree counterpart of {@link loadedTables}, keyed by language. */
  private static scopeTables = new Map<string, Set<LocaleTable>>();
  /**
   * Keys whose value in `locales.entries` came from a catalog table, not a legacy one.
   * A later request can then never put a legacy (untranslated) value back over them —
   * see {@link merge}.
   */
  private static catalogKeys = new Set<string>();
  /** Per `lang`-subtree counterpart of {@link catalogKeys}, keyed by language. */
  private static scopeCatalogKeys = new Map<string, Set<string>>();
  private static inFlight = new Map<string, Promise<void>>();
  /** What is in `locales.entries` right now — null until the first fetch lands. */
  private static loadedLanguage: string | null = null;
  /**
   * What the app has chosen, set synchronously by {@link load} before its fetch
   * goes out. Distinct from {@link loadedLanguage} so a screen can read the right
   * value while the strings are still on the wire.
   */
  private static selectedLanguage: string | null = null;
  private static listeners = new Set<(language: string) => void>();

  /**
   * The currently selected language — the value every `language:` API parameter
   * should use, rather than a `@Prop() language` captured at mount (which is
   * `''` or `undefined` on 32 components until the host sets it).
   *
   * Correct as soon as a screen has *called* `load` with the host's prop — it does
   * not wait for the fetch — so sibling requests built in the same `Promise.all`
   * get the right language on first mount, provided `load` is started first.
   *
   * Reads `locales.language` FIRST, not the private `selectedLanguage` field:
   * going through the `@stencil/store` proxy means a call inside `render()`
   * subscribes the component, so labels resolved through it re-render on a
   * language switch.
   */
  static get language(): string {
    return String(locales.language || this.selectedLanguage || LanguageObserver.getLang() || 'en').toLowerCase();
  }

  /**
   * Notifies when the selected language actually changes — the signal to refetch
   * anything fetched with a `language` parameter (countries, property, booking,
   * setup entries), since those responses are localized server-side.
   *
   *   componentDidLoad() { this.unsub = LocaleController.subscribe(() => this.refetch()); }
   *   disconnectedCallback() { this.unsub?.(); }
   *
   * @returns An unsubscribe function.
   */
  static subscribe(listener: (language: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * The language `el` renders in: its `lang` subtree's (see `locale-scope.ts`), else the app's.
   * Use it for `language:` API parameters in any component that can sit inside such a subtree.
   */
  static languageFor(el: Element): string {
    return getLocalLanguage(el) ?? this.language;
  }

  /**
   * {@link load} for a screen root that may be mounted inside a `lang` subtree. There it fills
   * that subtree's scope and leaves the app's language alone; anywhere else it is plain `load`.
   */
  static loadFor(el: Element, params: LoadLocaleParams = {}): Promise<void> {
    const local = getLocalLanguage(el);
    if (local && local !== this.language) {
      return this.loadScope({ language: local, tables: params.tables });
    }
    return this.load(params);
  }

  /**
   * Fetches `tables` (plus {@link BASE_TABLES}) into the scope store for `language`, without
   * touching the app's selected language, `<html lang>` or the language-change listeners.
   */
  static async loadScope({ language, tables = [] }: { language: string; tables?: readonly LocaleTable[] }): Promise<void> {
    const lang = language.toLowerCase();
    const loaded = this.scopeTables.get(lang) ?? new Set<LocaleTable>();
    this.scopeTables.set(lang, loaded);

    const missing = this.buildSections(tables).filter(table => !loaded.has(table));
    if (!missing.length) {
      return;
    }

    // Same re-enter-after-settle dedupe as `load`, on a key that can't collide with a global language.
    const key = `scope:${lang}`;
    const pending = this.inFlight.get(key);
    if (pending) {
      return pending.then(() => this.loadScope({ language: lang, tables }));
    }

    const scope = getLocaleScope(lang);
    const request = (async () => {
      scope.status = 'loading';
      try {
        const bundle = await this.service.getExposedLanguage(lang, missing);
        missing.forEach(table => loaded.add(table));
        const catalogKeys = this.scopeCatalogKeys.get(lang) ?? new Set<string>();
        this.scopeCatalogKeys.set(lang, catalogKeys);
        scope.entries = this.merge(scope.entries, bundle, catalogKeys);
        scope.direction = bundle.direction;
        scope.status = 'ready';
      } catch (error) {
        scope.status = 'error';
        throw error;
      }
    })().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, request);
    return request;
  }

  /** Whether `table`'s strings are already in the store for the current language. */
  static isLoaded(table: LocaleTable): boolean {
    return this.loadedTables.has(table);
  }

  /**
   * Ensures `tables` (plus {@link BASE_TABLES}) are loaded for `language`.
   *
   * Resolves immediately when there is nothing to fetch, so screens can call it
   * unconditionally in `componentWillLoad` without re-requesting on every mount.
   *
   *   await LocaleController.load({ language: this.language, tables: SCREEN_TABLES.channel });
   */
  static async load({ language, tables = [], force = false }: LoadLocaleParams = {}): Promise<void> {
    const nextLanguage = this.resolveLanguage(language, force);
    const languageChanged = this.loadedLanguage !== null && this.loadedLanguage !== nextLanguage;

    /*
     * Seed the selection now, before anything is awaited: callers read
     * `LocaleController.language` for the requests they fire alongside this one,
     * and those must not go out with the store's stale or default value.
     */
    this.selectedLanguage = nextLanguage;
    if (locales.language !== nextLanguage) {
      locales.language = nextLanguage;
    }

    /*
     * A language switch invalidates everything already in the store, but the
     * caller only knows about its own tables. Carry the previously loaded ones
     * into this request so other mounted screens don't lose their strings.
     */
    const carried = languageChanged || force ? [...this.loadedTables] : [];
    if (languageChanged) {
      this.clear();
    }

    const requested = this.buildSections([...tables, ...carried]);
    const missing = requested.filter(table => !this.loadedTables.has(table));
    if (!missing.length && !force && this.loadedLanguage === nextLanguage) {
      return;
    }

    /*
     * Keyed by language alone, not by language + tables. Two screens mounting
     * together ask for different sets, and a language switch fires `setLanguage`
     * and every root's `@Watch('language')` at once — keying on the table list
     * would let those race into duplicate requests for the same language.
     *
     * Re-entering after the pending one settles is what makes a narrower request
     * safe to drop: by then its tables are either loaded or still missing, and the
     * second pass fetches only what is genuinely left.
     */
    const pending = this.inFlight.get(nextLanguage);
    if (pending) {
      return pending.then(() => this.load({ language: nextLanguage, tables }));
    }

    const request = this.fetch(nextLanguage, requested).finally(() => this.inFlight.delete(nextLanguage));
    this.inFlight.set(nextLanguage, request);
    return request;
  }

  /**
   * Switches the app to `language` and re-fetches every table loaded so far.
   * This is the entry point for a language switcher.
   */
  static setLanguage(language: string): Promise<void> {
    return this.load({ language, force: true });
  }

  /** Drops the cache. Only for tests and teardown — does not clear the store. */
  static reset(): void {
    this.clear();
    this.scopeTables.clear();
    this.scopeCatalogKeys.clear();
    this.inFlight.clear();
    this.listeners.clear();
    this.loadedLanguage = null;
    this.selectedLanguage = null;
  }

  private static async fetch(language: string, sections: LocaleSections): Promise<void> {
    locales.status = 'loading';
    try {
      const bundle = await this.service.getExposedLanguage(language, sections);
      this.publish({ language, bundle, sections });
    } catch (error) {
      locales.status = 'error';
      throw error;
    }
  }

  /**
   * The write path for fetched data into the `locales` store (`language` alone
   * is also seeded early by {@link load}). Assigns top-level keys whole —
   * `@stencil/store` only reacts to top-level assignment.
   */
  private static publish({ language, bundle, sections }: { language: string; bundle: LocaleBundle; sections: LocaleSections }): void {
    const changed = this.loadedLanguage !== null && this.loadedLanguage !== language;
    sections.forEach(table => this.loadedTables.add(table));
    this.loadedLanguage = language;

    locales.entries = this.merge(locales.entries, bundle, this.catalogKeys) as typeof locales.entries;
    locales.direction = bundle.direction;
    locales.language = language;
    locales.loadedTables = [...this.loadedTables];
    locales.status = 'ready';

    /*
     * The date layer resolves its language from `<html lang>` as well as from the
     * store — see `resolveLocale` in `src/utils/date/ir-date.ts`. Without this,
     * strings translate but dates stay English.
     */
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }

    if (changed) {
      this.listeners.forEach(listener => listener(language));
    }
  }

  /**
   * Merges a fetched bundle over what a store already holds, with the same precedence
   * `LocaleService` applies inside one response: a legacy-only value never replaces
   * a catalog one, and an empty value never replaces a non-empty one. Without this,
   * a screen loading `_USER_MGT` (the OTP modal, reset password) after another screen
   * loaded `_COMMON` would put English "Cancel"/"Save"/"Email" back app-wide.
   *
   * Records the catalog-sourced keys it writes into `catalogKeys`.
   */
  private static merge(current: Record<string, string> | null, bundle: LocaleBundle, catalogKeys: Set<string>): Record<string, string> {
    const next = { ...(current ?? {}) };
    const fallback = new Set(bundle.fallbackKeys);
    for (const [key, value] of Object.entries(bundle.entries)) {
      const hasValue = !!next[key];
      if ((value === '' && hasValue) || (fallback.has(key) && catalogKeys.has(key) && hasValue)) {
        continue;
      }
      if (fallback.has(key)) {
        catalogKeys.delete(key);
      } else {
        catalogKeys.add(key);
      }
      next[key] = value;
    }
    return next;
  }

  /** Base tables first, then the caller's, deduped and sorted for a stable cache key. */
  private static buildSections(tables: readonly LocaleTable[]): LocaleSections {
    const merged = new Set<LocaleTable>([...this.BASE_TABLES, ...tables]);
    return [...merged].sort();
  }

  /**
   * A `language` argument is a *request*, not an override.
   *
   * It wins on the first selection — that is how a host's `language` prop seeds
   * the app — and whenever `force` is set, which is what an actual switch uses
   * (`setLanguage`, or a root's `@Watch('language')`). Once a language is
   * selected, an ordinary `load` cannot move it: screens pass their own
   * `@Prop() language` there, and that prop is stale on any screen the switcher
   * has not re-broadcast to yet (or still `''` on a screen mounting while the
   * first load is in flight). Honouring it would let a screen re-running its
   * init after a switch drag the whole app back to the previous language.
   */
  private static resolveLanguage(language?: string, force = false): string {
    const authoritative = force || this.selectedLanguage === null;
    const candidate = (authoritative && language) || this.selectedLanguage || locales.language || LanguageObserver.getLang() || 'en';
    return String(candidate).toLowerCase();
  }

  private static clear(): void {
    this.loadedTables.clear();
    this.catalogKeys.clear();
    locales.entries = null;
    locales.loadedTables = [];
  }
}

/* Every API payload carries the selected language; see `language-injector.ts` for why it is installed here. */
installLanguageInjector(() => LocaleController.language);
