import { calendarPreference } from '@/stores/calendar-preference.store';
import { CalendarSystem, NumberingSystemPreference } from './types';
import {
  CALENDAR_STORAGE_KEY,
  NUMBERING_STORAGE_KEY,
  parseNumberingSystem,
  persistNumberingSystem,
  persistOverride,
  readStoredNumberingSystem,
  resolveCalendarSystem,
} from './calendar-resolution';

export type CalendarChangeListener = (system: CalendarSystem) => void;

/**
 * Owns the calendar-preference store's lifecycle: resolves the initial value, reacts to
 * cross-tab storage changes, and exposes `setOverride` as the integration point for a future
 * settings UI. Deliberately parallel to `LanguageObserver` (not folded into it) — its trigger
 * is storage events + explicit calls, not a `<html lang>` `MutationObserver`.
 *
 * Call `init()` once, from `src/global/app.ts`.
 */
export class CalendarPreferenceController {
  private static listeners = new Set<CalendarChangeListener>();
  private static initialized = false;

  static init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.applyUrlOverrideIfPresent();
    calendarPreference.override = this.readOverrideFromStore();
    calendarPreference.numberingSystem = readStoredNumberingSystem() ?? calendarPreference.numberingSystem;
    this.refresh();

    window.addEventListener('storage', e => {
      if (e.key === CALENDAR_STORAGE_KEY) this.refresh();
      if (e.key === NUMBERING_STORAGE_KEY) {
        calendarPreference.numberingSystem = readStoredNumberingSystem() ?? 'auto';
      }
    });
  }

  /** Sets (or clears, on `null`) the persisted manual override and re-resolves immediately. */
  static setOverride(value: CalendarSystem | null): void {
    persistOverride(value);
    calendarPreference.override = value;
    this.refresh();
  }

  /**
   * Sets the digit script dates and numbers render in. `'auto'` resolves per locale through
   * `LOCALE_DEFAULT_SCRIPT` in `numerals.ts` (Arabic-Indic under `ar`); anything else forces that
   * script. Persisted, so it outlives the page that set it. Never affects `toApiDate` — the API
   * boundary is Latin by construction.
   */
  static setNumberingSystem(value: NumberingSystemPreference): void {
    persistNumberingSystem(value);
    calendarPreference.numberingSystem = value;
  }

  /** Secondary escape hatch for non-component `.ts` code that needs push notification rather than a store read. */
  static subscribe(listener: CalendarChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static refresh(): void {
    const next = resolveCalendarSystem();
    if (next !== calendarPreference.resolved) {
      calendarPreference.resolved = next;
      this.listeners.forEach(listener => listener(next));
    }
  }

  private static readOverrideFromStore(): CalendarSystem | null {
    try {
      const raw = localStorage.getItem(CALENDAR_STORAGE_KEY);
      return raw === 'gregory' || raw === 'islamic-umalqura' ? raw : null;
    } catch {
      return null;
    }
  }

  /**
   * QA/manual-verification hook: `?calendar=islamic-umalqura|gregory` and `?numbers=arab|latn|
   * arabext|auto` in the URL set the persisted preferences once, on load. `<ir-locale-switcher>`
   * is the interactive equivalent.
   */
  private static applyUrlOverrideIfPresent(): void {
    try {
      const params = new URLSearchParams(window.location.search);
      const param = params.get('calendar');
      if (param === 'gregory' || param === 'islamic-umalqura') {
        persistOverride(param);
      }
      const numbers = parseNumberingSystem(params.get('numbers'));
      if (numbers) {
        persistNumberingSystem(numbers);
      }
    } catch {
      // URLSearchParams/window.location unavailable in this environment — skip.
    }
  }
}
