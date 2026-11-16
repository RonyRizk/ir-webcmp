import moment from 'moment';
import { formatDate, formatTime, getFirstDayOfWeek, getMonthLabel, getWeekdayLabels, toApiDate, toApiDateTime } from './ir-date';
import { toMomentLocale } from './locale-map';

const FIXED_DATE = '2026-08-27'; // a Thursday; Hijri 1448
const ARABIC_INDIC_DIGITS = /[٠-٩]/;
const LANGUAGES = ['en', 'ar', 'de', 'el', 'fr', 'he', 'pl', 'ru', 'ua'];

describe('moment-setup', () => {
  it("leaves moment's global locale at 'en' despite the moment-hijri import side effect", () => {
    // Importing moment-hijri sets the global locale to 'ar-sa', and each moment/locale/* import
    // sets it again; both would turn format('YYYY-MM-DD') into non-ASCII digits or the wrong
    // language. formatDate() calls configureMoment() before every format for this reason.
    formatDate(FIXED_DATE, 'YYYY');
    expect(moment.locale()).toBe('en');
    expect(moment(FIXED_DATE).format('YYYY-MM-DD')).toBe('2026-08-27');
  });

  it('writes locale data to the instance it formats with', () => {
    // Regression guard for a browser-only bug: `moment-hijri` and a bare `import moment from
    // 'moment'` are separate copies in the bundle, each with its own locale registry. The
    // Arabic Hijri month tables were being written to the copy nothing formats with, so Arabic
    // silently rendered English Hijri months. Asserting through the public API keeps this
    // honest whether or not the two happen to be the same object under the test runner.
    expect(formatDate(FIXED_DATE, 'MMMM', { calendar: 'islamic-umalqura', locale: 'ar' })).toBe('ربيع الأول');
    expect(formatDate(FIXED_DATE, 'MMM', { calendar: 'islamic-umalqura', locale: 'ar' })).toBe('ربيع 1');
  });

  it('keeps ar-sa carrying both Arabic weekdays and Arabic Hijri months', () => {
    // Order guard for `moment-setup.ts`: the `moment/locale/*` imports must stay ABOVE the
    // `moment-hijri` import. Reversed, moment-hijri's `updateLocale('ar-sa', { iMonths })` runs
    // first and fabricates a weekday-less stub, the real locale file then re-`defineLocale`s the
    // same name — moment logs "use moment.updateLocale(...) to change an existing locale" — and
    // ar-sa renders Arabic Hijri months next to English weekdays (`Tue, 19 ربيع 1`).
    expect(formatDate(FIXED_DATE, 'MMMM', { calendar: 'islamic-umalqura', locale: 'ar-sa' })).toBe('ربيع الأول');
    expect(formatDate(FIXED_DATE, 'ddd', { calendar: 'gregory', locale: 'ar-sa' })).not.toMatch(/^[A-Za-z]+$/);
  });

  it('never falls through to the global locale for a language it supports', () => {
    // Regression guard: `ar` used to resolve to a derived `ir-ar` locale that silently failed to
    // register in the bundle, so `.locale('ir-ar')` was a no-op and Arabic rendered as whatever
    // locale happened to be global (Ukrainian, the last one imported).
    for (const [language, expected] of [
      ['ar', 'أغسطس'],
      ['fr', 'août'],
      ['ru', 'август'],
      ['ua', 'серпень'],
      ['de', 'August'],
    ] as const) {
      expect(formatDate(FIXED_DATE, 'MMMM', { calendar: 'gregory', locale: language })).toBe(expected);
    }
  });
});

describe('formatDate — moment format strings', () => {
  it('returns an empty string for null/undefined/unparseable input', () => {
    expect(formatDate(null, 'MMM DD, YYYY')).toBe('');
    expect(formatDate(undefined, 'MMM DD, YYYY')).toBe('');
    expect(formatDate('not-a-date', 'MMM DD, YYYY')).toBe('');
  });

  it('formats with an arbitrary moment format string', () => {
    expect(formatDate(FIXED_DATE, 'ddd, DD MMM YYYY', { calendar: 'gregory', locale: 'en' })).toBe('Thu, 27 Aug 2026');
    expect(formatDate(FIXED_DATE, 'DD-MMM-YYYY', { calendar: 'gregory', locale: 'en' })).toBe('27-Aug-2026');
    expect(formatDate(FIXED_DATE, 'ddd D', { calendar: 'gregory', locale: 'en' })).toBe('Thu 27');
  });

  it('localizes weekday and month names', () => {
    expect(formatDate(FIXED_DATE, 'MMMM', { calendar: 'gregory', locale: 'fr' })).toBe('août');
    expect(formatDate(FIXED_DATE, 'dddd', { calendar: 'gregory', locale: 'fr' })).toBe('jeudi');
    expect(formatDate(FIXED_DATE, 'MMMM', { calendar: 'gregory', locale: 'ar' })).toBe('أغسطس');
  });

  it('renders Latin digits under Arabic rather than Arabic-Indic ones', () => {
    expect(formatDate(FIXED_DATE, 'ddd, DD MMM YYYY', { calendar: 'gregory', locale: 'ar' })).not.toMatch(ARABIC_INDIC_DIGITS);
    expect(formatDate(FIXED_DATE, 'ddd, DD MMM YYYY', { calendar: 'islamic-umalqura', locale: 'ar' })).not.toMatch(ARABIC_INDIC_DIGITS);
  });

  it('produces a different, plausible Hijri date for the same underlying Gregorian date', () => {
    const gregorian = formatDate(FIXED_DATE, 'DD MMMM YYYY', { calendar: 'gregory', locale: 'en' });
    const hijri = formatDate(FIXED_DATE, 'DD MMMM YYYY', { calendar: 'islamic-umalqura', locale: 'en' });
    expect(hijri).not.toBe(gregorian);
    // 2026-08-27 falls in Hijri year 1448 AH — assert the year component landed in the expected range
    // rather than pinning the exact day/month, so this doesn't churn if the Umm al-Qura tables shift by a day.
    expect(hijri).toMatch(/144[6-9]|1450/);
  });

  it('uses Arabic Hijri month names for ar and transliterated ones elsewhere', () => {
    expect(formatDate(FIXED_DATE, 'MMMM', { calendar: 'islamic-umalqura', locale: 'ar' })).toBe('ربيع الأول');
    expect(formatDate(FIXED_DATE, 'MMMM', { calendar: 'islamic-umalqura', locale: 'fr' })).toBe("Rabi' al-Awwal");
  });

  it("keeps each language's own weekday names under Hijri, not an English fallback", () => {
    expect(formatDate(FIXED_DATE, 'dddd', { calendar: 'islamic-umalqura', locale: 'fr' })).toBe('jeudi');
    expect(formatDate(FIXED_DATE, 'dddd', { calendar: 'islamic-umalqura', locale: 'ru' })).toBe('четверг');
  });

  it('keeps the weekday identical across calendars — day-of-week is calendar-independent', () => {
    const gregorian = formatDate(FIXED_DATE, 'dddd', { calendar: 'gregory', locale: 'en' });
    const hijri = formatDate(FIXED_DATE, 'dddd', { calendar: 'islamic-umalqura', locale: 'en' });
    expect(gregorian).toBe('Thursday');
    expect(hijri).toBe('Thursday');
  });

  it('accepts a native Date and a Moment equally', () => {
    expect(formatDate(new Date(Date.UTC(2026, 7, 27)), 'MMM D, YYYY', { calendar: 'gregory', locale: 'en' })).toBe('Aug 27, 2026');
    expect(formatDate(moment(FIXED_DATE), 'MMM D, YYYY', { calendar: 'gregory', locale: 'en' })).toBe('Aug 27, 2026');
  });
});

describe('formatDate — named styles (unchanged public API)', () => {
  it('formats a Gregorian date with the "medium" style, unchanged from the previous implementation', () => {
    expect(formatDate(FIXED_DATE, { style: 'medium', calendar: 'gregory', locale: 'en' })).toBe('Aug 27, 2026');
  });

  it('formats a Gregorian date with the "long" style', () => {
    expect(formatDate(FIXED_DATE, { style: 'long', calendar: 'gregory', locale: 'en' })).toBe('August 27, 2026');
  });

  it('formats the "short" and "weekday-medium" styles', () => {
    expect(formatDate(FIXED_DATE, { style: 'short', calendar: 'gregory', locale: 'en' })).toBe('8/27/2026');
    expect(formatDate(FIXED_DATE, { style: 'weekday-medium', calendar: 'gregory', locale: 'en' })).toBe('Thu, Aug 27, 2026');
  });

  it('formats the "day-only" style as a bare day-of-month number', () => {
    expect(formatDate(FIXED_DATE, { style: 'day-only', calendar: 'gregory', locale: 'en' })).toBe('27');
  });

  it('appends a time component for withTime', () => {
    expect(formatDate(FIXED_DATE, { style: 'medium', withTime: 'short', calendar: 'gregory', locale: 'en' })).toMatch(/^Aug 27, 2026 \d{1,2}:\d{2}( [AP]M)?$/);
  });

  it('produces a different, plausible Hijri date for the same underlying Gregorian date', () => {
    const gregorian = formatDate(FIXED_DATE, { style: 'long', calendar: 'gregory', locale: 'en' });
    const hijri = formatDate(FIXED_DATE, { style: 'long', calendar: 'islamic-umalqura', locale: 'en' });
    expect(hijri).not.toBe(gregorian);
    expect(hijri).toMatch(/144[6-9]|1450/);
  });

  it('keeps Latin digits by default even under an Arabic locale + Hijri calendar', () => {
    expect(formatDate(FIXED_DATE, { style: 'medium', calendar: 'islamic-umalqura', locale: 'ar' })).not.toMatch(ARABIC_INDIC_DIGITS);
  });
});

describe('numbering system', () => {
  const ALL_SYSTEMS = ['latn', 'arab', 'arabext'] as const;

  it('forces the requested digit script regardless of locale', () => {
    expect(formatDate(FIXED_DATE, 'DD MMM YYYY', { locale: 'en', numberingSystem: 'arab' })).toBe('٢٧ Aug ٢٠٢٦');
    expect(formatDate(FIXED_DATE, 'DD MMM YYYY', { locale: 'ar', numberingSystem: 'latn' })).toBe('27 أغسطس 2026');
    expect(formatDate(FIXED_DATE, 'YYYY', { locale: 'fr', numberingSystem: 'arabext' })).toBe('۲۰۲۶');
  });

  it("'auto' keeps the locale's own digits", () => {
    // `ar` renders Arabic-Indic natively; `ar-ma` renders Latin.
    expect(formatDate(FIXED_DATE, 'YYYY', { locale: 'ar', numberingSystem: 'auto' })).toBe('٢٠٢٦');
    expect(formatDate(FIXED_DATE, 'YYYY', { locale: 'ar-ma', numberingSystem: 'auto' })).toBe('2026');
  });

  it('applies to Hijri output too', () => {
    // 'YYYY' is translated to the Hijri year ApiClient by the calendar layer, then the digits are
    // converted — 1448 AH in Arabic-Indic.
    expect(formatDate(FIXED_DATE, 'YYYY', { locale: 'en', calendar: 'islamic-umalqura', numberingSystem: 'arab' })).toBe('١٤٤٨');
  });

  it('never reaches toApiDate — the boundary stays Latin under every script', () => {
    for (const numberingSystem of ALL_SYSTEMS) {
      formatDate(FIXED_DATE, 'YYYY', { locale: 'ar', numberingSystem });
      expect(toApiDate(FIXED_DATE)).toBe('2026-08-27');
    }
  });
});

describe('Arabic regional variants', () => {
  it("renders each dialect's own Gregorian month name", () => {
    // 2026-08-27 — MSA/Gulf vs Maghrebi vs Levantine naming.
    expect(formatDate(FIXED_DATE, 'MMMM', { locale: 'ar', calendar: 'gregory' })).toBe('أغسطس');
    expect(formatDate(FIXED_DATE, 'MMMM', { locale: 'ar-ma', calendar: 'gregory' })).toBe('غشت');
    expect(formatDate(FIXED_DATE, 'MMMM', { locale: 'ar-ps', calendar: 'gregory' })).toBe('آب');
  });

  it('gives every Arabic variant the Arabic Hijri month table', () => {
    for (const locale of ['ar', 'ar-dz', 'ar-kw', 'ar-ly', 'ar-ma', 'ar-ps', 'ar-sa', 'ar-tn']) {
      expect(formatDate(FIXED_DATE, 'MMMM', { locale, calendar: 'islamic-umalqura' })).toBe('ربيع الأول');
    }
  });

  it('resolves an exact regional tag before falling back to the primary subtag', () => {
    expect(toMomentLocale('ar-MA', 'gregory')).toBe('ar-ma');
    expect(toMomentLocale('ar-EG', 'gregory')).toBe('ar'); // no ar-eg locale — primary subtag
    expect(toMomentLocale('en-GB', 'gregory')).toBe('en');
  });
});

describe('result memoization', () => {
  it('returns identical output on repeat calls, and re-resolves when a preference changes', () => {
    const first = formatDate(FIXED_DATE, 'ddd, DD MMM YYYY', { locale: 'en', calendar: 'gregory' });
    expect(formatDate(FIXED_DATE, 'ddd, DD MMM YYYY', { locale: 'en', calendar: 'gregory' })).toBe(first);
    // Every input that changes the output is part of the cache key, so these must not collide.
    expect(formatDate(FIXED_DATE, 'ddd, DD MMM YYYY', { locale: 'fr', calendar: 'gregory' })).not.toBe(first);
    expect(formatDate(FIXED_DATE, 'ddd, DD MMM YYYY', { locale: 'en', calendar: 'islamic-umalqura' })).not.toBe(first);
    expect(formatDate(FIXED_DATE, 'ddd, DD MMM YYYY', { locale: 'en', calendar: 'gregory', numberingSystem: 'arab' })).not.toBe(first);
    expect(formatDate('2026-08-28', 'ddd, DD MMM YYYY', { locale: 'en', calendar: 'gregory' })).not.toBe(first);
    expect(formatDate(FIXED_DATE, 'MMM D', { locale: 'en', calendar: 'gregory' })).not.toBe(first);
  });

  it('treats equal instants from different input types as the same entry', () => {
    const fromString = formatDate(FIXED_DATE, 'MMM D, YYYY', { locale: 'en', calendar: 'gregory' });
    const fromDate = formatDate(new Date(2026, 7, 27), 'MMM D, YYYY', { locale: 'en', calendar: 'gregory' });
    expect(fromDate).toBe(fromString);
  });
});

describe('toApiDate — the identity/API boundary', () => {
  it('always returns Gregorian Latin-digit YYYY-MM-DD, whatever the language or calendar', () => {
    for (const language of LANGUAGES) {
      for (const calendar of ['gregory', 'islamic-umalqura'] as const) {
        // The preference is deliberately ignored — this is what goes into request payloads.
        formatDate(FIXED_DATE, 'MMMM', { locale: language, calendar });
        expect(toApiDate(FIXED_DATE)).toBe('2026-08-27');
      }
    }
  });

  it('builds the ISO string from the Date fields, matching moment for edge cases', () => {
    // Single-digit month/day must stay zero-padded now that this no longer goes through moment.
    expect(toApiDate('2026-01-05')).toBe('2026-01-05');
    expect(toApiDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toApiDate(new Date(1999, 11, 31))).toBe('1999-12-31');
    expect(toApiDateTime(new Date(2026, 0, 5, 9, 7, 3))).toBe('2026-01-05T09:07:03');
    expect(toApiDateTime(null)).toBe('');
  });

  it('accepts Date and Moment input, and returns an empty string for unparseable input', () => {
    expect(toApiDate(new Date(Date.UTC(2026, 7, 27)))).toBe('2026-08-27');
    expect(toApiDate(moment(FIXED_DATE))).toBe('2026-08-27');
    expect(toApiDate('not-a-date')).toBe('');
  });
});

describe('formatTime', () => {
  it('formats the time portion only and is unaffected by the calendar preference', () => {
    const gregorian = formatTime('2026-08-27T14:30:00', { calendar: 'gregory', locale: 'en' });
    const hijri = formatTime('2026-08-27T14:30:00', { calendar: 'islamic-umalqura', locale: 'en' });
    expect(gregorian).toBe(hijri);
    expect(gregorian).toMatch(/^\d{1,2}:30( [AP]M)?$/);
  });

  it('honours an explicit format override', () => {
    expect(formatTime('2026-08-27T14:30:00', { format: 'HH:mm', locale: 'en' })).toBe('14:30');
  });
});

describe('getWeekdayLabels', () => {
  it('returns 7 Sunday-first abbreviations for English', () => {
    const weekdays = getWeekdayLabels({ calendar: 'gregory', locale: 'en' });
    expect(weekdays).toHaveLength(7);
    expect(weekdays[0]).toBe('Sun');
    expect(weekdays[6]).toBe('Sat');
  });

  it('stays Sunday-first under Arabic — grid column order does not follow the locale week start', () => {
    const weekdays = getWeekdayLabels({ calendar: 'islamic-umalqura', locale: 'ar' });
    expect(weekdays).toHaveLength(7);
    expect(weekdays[0]).toBe(getWeekdayLabels({ calendar: 'gregory', locale: 'ar' })[0]);
  });
});

describe('getFirstDayOfWeek', () => {
  it('reports the locale week start without changing how weekdays are rendered', () => {
    expect(getFirstDayOfWeek('en')).toBe(0);
    expect(getFirstDayOfWeek('ar')).toBe(6);
  });
});

describe('getMonthLabel', () => {
  it('formats a Gregorian month + year label', () => {
    expect(getMonthLabel(FIXED_DATE, { style: 'long', calendar: 'gregory', locale: 'en' })).toBe('August 2026');
    expect(getMonthLabel(FIXED_DATE, { style: 'short', calendar: 'gregory', locale: 'en' })).toBe('Aug 2026');
  });

  it('formats a distinct Hijri month + year label for the same date', () => {
    const gregorian = getMonthLabel(FIXED_DATE, { style: 'long', calendar: 'gregory', locale: 'en' });
    const hijri = getMonthLabel(FIXED_DATE, { style: 'long', calendar: 'islamic-umalqura', locale: 'en' });
    expect(hijri).not.toBe(gregorian);
  });

  it('returns an empty string for unparseable input', () => {
    expect(getMonthLabel('not-a-date')).toBe('');
  });
});

describe('toMomentLocale', () => {
  it('maps app language codes to moment locales per calendar', () => {
    expect(toMomentLocale('ar', 'gregory')).toBe('ar');
    expect(toMomentLocale('ar', 'islamic-umalqura')).toBe('ar');
    expect(toMomentLocale('ua', 'gregory')).toBe('uk');
    expect(toMomentLocale('fr', 'islamic-umalqura')).toBe('fr');
  });

  it('accepts region tags and falls back to en for anything unknown', () => {
    expect(toMomentLocale('ar-EG', 'gregory')).toBe('ar');
    expect(toMomentLocale('xx', 'gregory')).toBe('en');
    expect(toMomentLocale(null)).toBe('en');
  });
});
