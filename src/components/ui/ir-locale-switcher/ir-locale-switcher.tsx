import { Component, Element, Host, Prop, State, h } from '@stencil/core';
import WaSelect from '@awesome.me/webawesome/dist/components/select/select';

import locales from '@/stores/locales.store';
import { calendarPreference } from '@/stores/calendar-preference.store';

import { CalendarPreferenceController, CalendarSystem, formatDate, getFirstDayOfWeek, getWeekdayLabels, NumberingSystemPreference, toApiDate } from '@/utils/date';

import { formatAmount, formatCount, formatPercent } from '@/utils/number';
import { isRtlLanguage } from '@/utils/direction';
import { LocaleController } from '@/services/locale/locale.controller';

type DirectionMode = 'auto' | 'ltr' | 'rtl';

type StoredCalendarSystem = CalendarSystem | 'auto';

interface LocaleSwitcherStorage {
  language: string;
  calendar: StoredCalendarSystem;
  numberingSystem: NumberingSystemPreference;
  direction: DirectionMode;
  open: boolean;
}

const STORAGE_KEY = 'ir-locale-switcher';

/**
 * The page's own `<html lang>`, captured before the switcher or
 * `LocaleController` overwrite it. Used as the fallback when nothing is saved.
 */
const INITIAL_HTML_LANG = typeof document !== 'undefined' ? document.documentElement.lang : '';

/**
 * The languages the app ships locale strings and moment locale data for,
 * plus every Arabic regional variant.
 */
const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية — Arabic (MSA)' },
  { code: 'ar-sa', label: 'العربية — Saudi Arabia' },
  { code: 'ar-ps', label: 'العربية — Palestine' },
  { code: 'ar-kw', label: 'العربية — Kuwait' },
  { code: 'ar-ly', label: 'العربية — Libya' },
  { code: 'ar-ma', label: 'العربية — Morocco' },
  { code: 'ar-dz', label: 'العربية — Algeria' },
  { code: 'ar-tn', label: 'العربية — Tunisia' },
  { code: 'de', label: 'Deutsch — German' },
  { code: 'el', label: 'Ελληνικά — Greek' },
  { code: 'fr', label: 'Français — French' },
  { code: 'he', label: 'עברית — Hebrew' },
  { code: 'pl', label: 'Polski — Polish' },
  { code: 'ru', label: 'Русский — Russian' },
  { code: 'ua', label: 'Українська — Ukrainian' },
];

/**
 * Digit scripts, with a sample so the effect is visible before selecting.
 */
const NUMBERING_SYSTEMS: {
  value: NumberingSystemPreference;
  label: string;
}[] = [
  { value: 'latn', label: 'Latin — 0123456789' },
  { value: 'arab', label: 'Arabic-Indic — ٠١٢٣٤٥٦٧٨٩' },
  {
    value: 'arabext',
    label: 'Eastern Arabic-Indic — ۰۱۲۳۴۵۶۷۸۹',
  },
  {
    value: 'auto',
    label: "Auto — the locale's own digits",
  },
];

/**
 * Formats shown in the live preview.
 */
const PREVIEW_FORMATS = ['ddd, DD MMM YYYY', 'MMM DD, YYYY', 'MMMM YYYY', 'ddd D', 'DD/MM ddd', 'DD-MMM-YYYY'];

/**
 * A floating dev/QA panel for switching language, calendar system,
 * numbering system and text direction at runtime.
 *
 * All user-selected settings are persisted in localStorage and restored
 * automatically the next time the page is opened.
 */
@Component({
  tag: 'ir-locale-switcher',
  styleUrl: 'ir-locale-switcher.css',
  scoped: true,
})
export class IrLocaleSwitcher {
  @Element() el: HTMLElement;

  /**
   * Corner to pin the panel to.
   */
  @Prop()
  placement: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' = 'bottom-end';

  /**
   * Start collapsed to a single button when no saved state exists.
   */
  @Prop()
  collapsed: boolean = true;

  /**
   * Sample date for the preview, YYYY-MM-DD.
   * Defaults to today.
   */
  @Prop()
  sampleDate: string;

  @State()
  open: boolean;

  @State()
  direction: DirectionMode = 'auto';

  /**
   * Read persisted switcher state.
   */
  private loadSettings(): Partial<LocaleSwitcherStorage> | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<LocaleSwitcherStorage>;

      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn(`[ir-locale-switcher] Failed to read "${STORAGE_KEY}" from localStorage.`, error);

      return null;
    }
  }

  /**
   * Save the current switcher state.
   */
  private saveSettings(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const state: LocaleSwitcherStorage = {
        language: locales.language ?? 'en',
        calendar: calendarPreference.override ?? 'auto',
        numberingSystem: calendarPreference.numberingSystem,
        direction: this.direction,
        open: this.open,
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn(`[ir-locale-switcher] Failed to save "${STORAGE_KEY}" to localStorage.`, error);
    }
  }

  /**
   * Make sure a stored language is one that this switcher supports.
   */
  private isValidLanguage(value: unknown): value is string {
    return typeof value === 'string' && LANGUAGES.some(language => language.code === value);
  }

  /**
   * Map a raw language value onto a supported code: case-insensitive, falling
   * back to the base subtag (`en-US` → `en`). Returns null when unsupported.
   */
  private normalizeLanguage(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase();

    /*
     * Derived before the check: `isValidLanguage` is a type guard, so its false
     * branch narrows `normalized` to `never`.
     */
    const base = normalized.split('-')[0];

    if (this.isValidLanguage(normalized)) {
      return normalized;
    }

    return this.isValidLanguage(base) ? base : null;
  }

  /**
   * Validate persisted calendar values before applying them.
   */
  private isValidCalendar(value: unknown): value is StoredCalendarSystem {
    return value === 'auto' || value === 'gregory' || value === 'islamic-umalqura';
  }

  /**
   * Validate persisted numbering-system values.
   */
  private isValidNumberingSystem(value: unknown): value is NumberingSystemPreference {
    return NUMBERING_SYSTEMS.some(system => system.value === value);
  }

  /**
   * Validate persisted direction values.
   */
  private isValidDirection(value: unknown): value is DirectionMode {
    return value === 'auto' || value === 'ltr' || value === 'rtl';
  }

  componentWillLoad() {
    const stored = this.loadSettings();

    /*
     * Panel state.
     *
     * Saved state wins. If there is no saved state, fall back to the
     * component's `collapsed` prop.
     */
    if (typeof stored?.open === 'boolean') {
      this.open = stored.open;
    } else {
      this.open = !this.collapsed;
    }

    /*
     * Language.
     *
     * Priority:
     * 1. localStorage
     * 2. <html lang="...">
     * 3. English
     */
    const language =
      this.normalizeLanguage(stored?.language) ??
      this.normalizeLanguage(INITIAL_HTML_LANG) ??
      this.normalizeLanguage(document.documentElement.lang) ??
      'en';

    /*
     * The switcher mounts inside a screen root that has already started
     * `LocaleController.load` with its host `language` prop. Only telling the
     * controller makes our choice stick — otherwise that fetch's publish
     * overwrites the store and <html lang> with the host language.
     */
    if (language !== LocaleController.language) {
      LocaleController.setLanguage(language).catch(error => console.error('Failed to restore language', error));
    } else {
      locales.language = language;
      document.documentElement.lang = language;
    }

    this.broadcastLanguage(language);

    /*
     * Direction.
     *
     * Saved direction wins. Without saved state, adopt an explicit
     * <html dir>, otherwise use "auto".
     */
    if (this.isValidDirection(stored?.direction)) {
      this.direction = stored.direction;
    } else {
      const htmlDirection = document.documentElement.getAttribute('dir');

      this.direction = htmlDirection === 'rtl' || htmlDirection === 'ltr' ? htmlDirection : 'auto';
    }

    /*
     * Calendar.
     */
    if (this.isValidCalendar(stored?.calendar)) {
      CalendarPreferenceController.setOverride(stored.calendar === 'auto' ? null : stored.calendar);
    }

    /*
     * Numbering system.
     */
    if (this.isValidNumberingSystem(stored?.numberingSystem)) {
      CalendarPreferenceController.setNumberingSystem(stored.numberingSystem);
    }

    /*
     * Apply direction only after language has been restored because
     * "auto" depends on the selected language.
     */
    this.applyDirection(this.direction, language, false);

    /*
     * Save once so older/incomplete localStorage data gets normalized.
     */
    this.saveSettings();
  }

  /**
   * Switches the app's language, then pushes it onto every mounted component
   * exposing a `language` prop so date pickers and `ir-hk-staff-tasks` — which
   * resolve their own locale rather than reading the store — follow along.
   *
   * `persist` doubles as "this was a user action": on the initial restore we
   * only publish the value, because page roots load their own tables on mount
   * and no ticket is set yet.
   */
  private applyLanguage(language: string, persist = true) {
    if (!this.isValidLanguage(language)) {
      return;
    }

    if (persist) {
      /*
       * Re-fetches every table loaded so far, which is what actually swaps the
       * Lcz_* strings. Fire-and-forget: a failure here must not break the panel.
       */
      LocaleController.setLanguage(language).catch(error => console.error('Failed to switch language', error));
    } else {
      locales.language = language;
      document.documentElement.lang = language;
    }

    /*
     * Re-resolve direction because "auto" depends on language.
     */
    this.applyDirection(this.direction, language, false);

    this.broadcastLanguage(language);

    if (persist) {
      this.saveSettings();
    }
  }

  /**
   * Pushes `language` onto every mounted component exposing a `language` prop.
   */
  private broadcastLanguage(language: string) {
    document.querySelectorAll<HTMLElement & { language?: string }>('*').forEach(node => {
      if (node.tagName.includes('-') && node !== this.el && 'language' in node && node.language !== language) {
        node.language = language;
      }
    });
  }

  /**
   * Apply calendar preference and persist it.
   */
  private applyCalendar(value: StoredCalendarSystem, persist = true) {
    if (!this.isValidCalendar(value)) {
      return;
    }

    /*
     * null clears the explicit override and returns to device auto-detect.
     */
    CalendarPreferenceController.setOverride(value === 'auto' ? null : value);

    if (persist) {
      this.saveSettings();
    }
  }

  /**
   * Apply numbering-system preference and persist it.
   */
  private applyNumberingSystem(value: NumberingSystemPreference, persist = true) {
    if (!this.isValidNumberingSystem(value)) {
      return;
    }

    CalendarPreferenceController.setNumberingSystem(value);

    if (persist) {
      this.saveSettings();
    }
  }

  /**
   * Apply text direction.
   *
   * `auto` resolves according to the current language.
   */
  private applyDirection(mode: DirectionMode, language = locales.language ?? 'en', persist = true) {
    if (!this.isValidDirection(mode)) {
      return;
    }

    this.direction = mode;

    const resolved = mode === 'auto' ? (isRtlLanguage(language) ? 'rtl' : 'ltr') : mode;

    document.documentElement.setAttribute('dir', resolved);

    locales.direction = resolved;

    if (persist) {
      this.saveSettings();
    }
  }

  /**
   * Open/collapse panel and persist that UI state too.
   */
  private setOpen(open: boolean) {
    this.open = open;
    this.saveSettings();
  }

  /**
   * Remove every locale-switcher preference and restore defaults.
   */
  private resetSettings() {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn(`[ir-locale-switcher] Failed to clear "${STORAGE_KEY}".`, error);
      }
    }

    const language = this.normalizeLanguage(INITIAL_HTML_LANG) ?? 'en';

    LocaleController.setLanguage(language).catch(error => console.error('Failed to reset language', error));
    this.broadcastLanguage(language);

    CalendarPreferenceController.setOverride(null);
    CalendarPreferenceController.setNumberingSystem('auto');

    this.direction = 'auto';

    const resolvedDirection = isRtlLanguage(language) ? 'rtl' : 'ltr';

    document.documentElement.setAttribute('dir', resolvedDirection);

    locales.direction = resolvedDirection;

    /*
     * Keep the component's original prop behavior after reset.
     */
    this.open = !this.collapsed;
  }

  private get sample(): string {
    return this.sampleDate ?? toApiDate(new Date());
  }

  private renderPreview() {
    return (
      <div class="ls-preview">
        <div class="ls-preview__title">Preview — {this.sample}</div>

        {PREVIEW_FORMATS.map(format => (
          <div class="ls-preview__row" key={format}>
            <code class="ls-preview__format">{format}</code>

            <span class="ls-preview__value">{formatDate(this.sample, format)}</span>
          </div>
        ))}

        <div class="ls-preview__row">
          <code class="ls-preview__format">price</code>

          <span class="ls-preview__value">{formatAmount('$', 1234.5)}</span>
        </div>

        <div class="ls-preview__row">
          <code class="ls-preview__format">count · percent</code>

          <span class="ls-preview__value">
            {formatCount(3)} · {formatPercent(87)}
          </span>
        </div>

        <div class="ls-preview__row ls-preview__row--muted">
          <code class="ls-preview__format">weekdays</code>

          <span class="ls-preview__value">{getWeekdayLabels().join(' ')}</span>
        </div>

        <div class="ls-preview__row ls-preview__row--muted">
          <code class="ls-preview__format">toApiDate</code>

          <span class="ls-preview__value">
            {toApiDate(this.sample)} <em>· always Gregorian</em>
          </span>
        </div>

        <div class="ls-preview__row ls-preview__row--muted">
          <code class="ls-preview__format">week starts</code>

          <span class="ls-preview__value">{getWeekdayLabels()[getFirstDayOfWeek()]} · grid stays Sunday-first</span>
        </div>
      </div>
    );
  }

  render() {
    const language = locales.language ?? 'en';

    const calendar: StoredCalendarSystem = calendarPreference.override ?? 'auto';

    return (
      <Host class={`ls-host ls-host--${this.placement}`}>
        {!this.open && (
          <button class="ls-fab" title="Locale switcher" onClick={() => this.setOpen(true)}>
            <wa-icon name="globe"></wa-icon>

            <span class="ls-fab__label">{language.toUpperCase()}</span>
          </button>
        )}

        {this.open && (
          <div class="ls-panel">
            <header class="ls-panel__header">
              <span class="ls-panel__title">Locale switcher</span>

              <button class="ls-panel__close" title="Collapse" onClick={() => this.setOpen(false)}>
                <wa-icon name="xmark"></wa-icon>
              </button>
            </header>

            <wa-select
              label="Language"
              size="s"
              value={language}
              onchange={(event: Event) => {
                const value = (event.target as WaSelect).value?.toString();

                if (value) {
                  this.applyLanguage(value);
                }
              }}
            >
              {LANGUAGES.map(({ code, label }) => (
                <wa-option key={code} value={code}>
                  {label}
                </wa-option>
              ))}
            </wa-select>

            <wa-select
              label="Calendar"
              size="s"
              value={calendar}
              onchange={(event: Event) => {
                const value = (event.target as WaSelect).value?.toString() as StoredCalendarSystem;

                this.applyCalendar(value);
              }}
            >
              <wa-option value="auto">Auto — detect from device</wa-option>

              <wa-option value="gregory">Gregorian</wa-option>

              <wa-option value="islamic-umalqura">Hijri — Umm al-Qura</wa-option>
            </wa-select>

            <wa-select
              label="Numbers"
              size="s"
              value={calendarPreference.numberingSystem}
              onchange={(event: Event) => {
                const value = (event.target as WaSelect).value?.toString() as NumberingSystemPreference;

                this.applyNumberingSystem(value);
              }}
            >
              {NUMBERING_SYSTEMS.map(({ value, label }) => (
                <wa-option key={value} value={value}>
                  {label}
                </wa-option>
              ))}
            </wa-select>

            <wa-select
              label="Direction"
              size="s"
              value={this.direction}
              onchange={(event: Event) => {
                const value = (event.target as WaSelect).value?.toString() as DirectionMode;

                this.applyDirection(value);
              }}
            >
              <wa-option value="auto">Auto — from language</wa-option>

              <wa-option value="ltr">LTR</wa-option>

              <wa-option value="rtl">RTL</wa-option>
            </wa-select>

            {this.renderPreview()}

            <footer class="ls-panel__footer">
              <span class="ls-panel__resolved">
                resolved: {language} · {calendarPreference.resolved} · {calendarPreference.numberingSystem} · {document.documentElement.getAttribute('dir') ?? 'ltr'}
              </span>

              <button class="ls-panel__reset" onClick={() => this.resetSettings()}>
                Reset all
              </button>
            </footer>
          </div>
        )}
      </Host>
    );
  }
}
