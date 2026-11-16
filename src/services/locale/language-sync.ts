import { LocaleController } from './locale.controller';
import type { LocaleTable } from './types';

/**
 * Keeps one screen's *data* in step with the selected language.
 *
 * `t()` and the `locales` store already re-render `Lcz_*` chrome on a switch, but
 * a large part of what a screen shows is localized by the server, not by us: room
 * type and rate plan names, taxes and sources from `Get_Exposed_Property`, the
 * country list, booking payloads, applicable policies. Those were fetched with a
 * `language:` parameter at mount and stay in that language forever unless someone
 * asks again — which is what this does.
 *
 * Wire it into a screen root as three small members:
 *
 *   private languageSync = new LanguageSync(SCREEN_TABLES.channel, () => this.initializeApp());
 *
 *   componentDidLoad() { this.languageSync.connect(); }
 *   disconnectedCallback() { this.languageSync.disconnect(); }
 *
 *   @Watch('language')
 *   languageChanged(next: string, previous: string) {
 *     this.languageSync.propChanged(next, previous);
 *   }
 *
 * Both entry points funnel through `LocaleController`, so a switch costs one
 * refetch however it was triggered — the switcher calling `setLanguage`, or the
 * host PMS assigning the `language` prop, or both at once, which is what
 * `ir-locale-switcher` actually does.
 */
export class LanguageSync {
  private unsubscribe?: () => void;

  /**
   * @param tables The screen's `SCREEN_TABLES` entry, re-sent when the host
   * changes the `language` prop.
   * @param reload Re-runs the screen's own init. Called *after* the new strings
   * are in the store, so it is safe for it to await `LocaleController.load`
   * again — the tables are already there and that call returns immediately.
   */
  constructor(
    private readonly tables: readonly LocaleTable[],
    private readonly reload: () => unknown,
  ) {}

  /**
   * Subscribes to language changes. Call from `componentDidLoad`, not
   * `connectedCallback`: the latter runs before `componentWillLoad`, so a switch
   * landing in that window would re-enter init while the first one is still in
   * flight.
   */
  connect(): void {
    this.unsubscribe ??= LocaleController.subscribe(() => {
      /*
       * Fire-and-forget, and swallow: this runs inside LocaleController's
       * listener loop, so a rejection here would abort the remaining screens'
       * refetches. Each screen already reports its own load failures.
       */
      void Promise.resolve(this.reload()).catch(error => console.error('Language refetch failed', error));
    });
  }

  disconnect(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  /**
   * For `@Watch('language')`. Pushes a host-driven prop change into the
   * controller, which then decides whether the language actually changed and
   * notifies {@link connect}'s listener. Does not refetch data itself — that
   * would double up when the switcher also calls `setLanguage`.
   */
  propChanged(next: string, previous?: string): void {
    if (!next || next === previous || next.toLowerCase() === LocaleController.language) {
      return;
    }
    /*
     * `force`, because this is a deliberate switch: an ordinary load treats its
     * `language` as a request and keeps the selected one. The equality guard
     * above is what stops `ir-locale-switcher` paying for it twice — it calls
     * `setLanguage` and then assigns this prop on every mounted element, and by
     * then the language already matches.
     */
    void LocaleController.load({ language: next, tables: this.tables, force: true }).catch(error => console.error('Failed to switch language', error));
  }
}
