import { CalendarSystem, NumberingSystemPreference } from './types';

const STORAGE_KEY = 'ir_calendar_system'; // sibling naming convention to the existing 'ir_language' key
const NUMBERING_STORAGE_KEY = 'ir_numbering_system';

const NUMBERING_SYSTEMS: NumberingSystemPreference[] = ['auto', 'latn', 'arab', 'arabext'];

/** Narrows arbitrary input (localStorage, URL param) to a valid preference, or `null`. */
export function parseNumberingSystem(raw: string | null | undefined): NumberingSystemPreference | null {
  return NUMBERING_SYSTEMS.includes(raw as NumberingSystemPreference) ? (raw as NumberingSystemPreference) : null;
}

/** Reads the persisted digit-script preference, or `null` if unset / storage unavailable. */
export function readStoredNumberingSystem(): NumberingSystemPreference | null {
  try {
    return parseNumberingSystem(localStorage.getItem(NUMBERING_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Persists (or clears, on `null`) the digit-script preference. Never throws. */
export function persistNumberingSystem(value: NumberingSystemPreference | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(NUMBERING_STORAGE_KEY);
    } else {
      localStorage.setItem(NUMBERING_STORAGE_KEY, value);
    }
  } catch {
    // localStorage unavailable (private mode, disabled cookies, etc.) — preference won't persist.
  }
}

/**
 * Locales whose users conventionally expect the Hijri calendar by default. This is a curated
 * allowlist, not a query of the device's actual OS calendar setting — there is no standard web
 * API that exposes "OS calendar mode". `Intl.DateTimeFormat(locale).resolvedOptions().calendar`
 * only reflects Hijri when the locale tag itself carries a `-u-ca-islamic*` extension (e.g. the
 * OS set `navigator.language` to `ar-SA-u-ca-islamic-umalqura`), which most browsers/OSes do not
 * do by default even when the OS calendar app is set to Hijri. Extend this list deliberately;
 * do not replace it with a bare `resolvedOptions().calendar` read and assume it is more reliable
 * than it actually is.
 */
const HIJRI_DEFAULT_LOCALES = new Set(['ar-sa']);

/**
 * Detects the calendar system implied by the browser's language/locale settings.
 * Checks for an explicit `-u-ca-islamic*` extension first (the one case where the platform
 * really does tell us), then falls back to the curated locale allowlist above.
 */
export function detectDeviceCalendar(): CalendarSystem {
  try {
    const lang = navigator.language || 'en';
    const resolved = new Intl.DateTimeFormat(lang).resolvedOptions();
    if (resolved.calendar === 'islamic' || resolved.calendar === 'islamic-umalqura') {
      return 'islamic-umalqura';
    }
    if (HIJRI_DEFAULT_LOCALES.has(lang.toLowerCase())) {
      return 'islamic-umalqura';
    }
    return 'gregory';
  } catch {
    return 'gregory';
  }
}

/** Reads the persisted manual override, or `null` if none is set / storage is unavailable. */
export function readStoredOverride(): CalendarSystem | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'gregory' || raw === 'islamic-umalqura' ? raw : null;
  } catch {
    return null;
  }
}

/** Persists (or clears, on `null`) the manual override. Never throws. */
export function persistOverride(value: CalendarSystem | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, value);
    }
  } catch {
    // localStorage unavailable (private mode, disabled cookies, etc.) — override just won't persist.
  }
}

/** Resolution order: manual override wins; else device auto-detect; else Gregorian. */
export function resolveCalendarSystem(): CalendarSystem {
  return readStoredOverride() ?? detectDeviceCalendar();
}

export { STORAGE_KEY as CALENDAR_STORAGE_KEY, NUMBERING_STORAGE_KEY };
