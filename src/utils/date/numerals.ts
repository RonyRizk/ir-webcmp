import { NumberingSystem, NumberingSystemPreference } from './types';

/**
 * Digit-script conversion for formatted date strings.
 *
 * moment renders numerals in whatever script its locale prefers — `ar`, `ar-ps` and `ar-sa`
 * emit Arabic-Indic (`٢٠٢٦`), the Maghrebi variants emit Latin. This module makes that a
 * deliberate choice rather than a side effect of which locale happens to be selected.
 *
 * Conversion is done on the formatted string rather than through a locale `postformat`, because
 * some locales embed digits directly in their month-name tables (`ar-sa`'s abbreviated Hijri
 * month `'ربيع ١'`), which no `postformat` hook can reach.
 */

/** Code point of digit zero in each supported script. All ten digits are contiguous from it. */
const DIGIT_ZERO: Record<NumberingSystem, number> = {
  latn: 0x0030, // 0123456789
  arab: 0x0660, // ٠١٢٣٤٥٦٧٨٩  Arabic-Indic
  arabext: 0x06f0, // ۰۱۲۳۴۵۶۷۸۹  Eastern Arabic-Indic (Persian/Urdu)
};

/**
 * The digit script each locale conventionally uses, for resolving `'auto'`.
 *
 * This table exists so `'auto'` means the same thing for dates and for numbers. The two
 * subsystems disagree on their own: moment's `ar` locale renders Arabic-Indic, while CLDR (and
 * therefore `Intl.NumberFormat`) defaults `ar` to Latin. The values below follow moment/regional
 * convention — Arabic-Indic in the Mashriq, Latin across the Maghreb.
 */
const LOCALE_DEFAULT_SCRIPT: Record<string, NumberingSystem> = {
  'ar': 'arab',
  'ar-ps': 'arab',
  'ar-sa': 'arab',
  'ar-dz': 'latn',
  'ar-kw': 'latn',
  'ar-ly': 'latn',
  'ar-ma': 'latn',
  'ar-tn': 'latn',
};

/**
 * Turns a preference into a concrete script. `'auto'` consults {@link LOCALE_DEFAULT_SCRIPT},
 * matching an exact regional tag before the primary subtag, and falls back to Latin.
 */
const scriptCache = new Map<string, NumberingSystem>();

export function resolveNumberingScript(locale: string, preference: NumberingSystemPreference): NumberingSystem {
  if (preference !== 'auto') return preference;
  let script = scriptCache.get(locale);
  if (script === undefined) {
    const tag = (locale ?? '').toLowerCase().replace('_', '-');
    script = LOCALE_DEFAULT_SCRIPT[tag] ?? LOCALE_DEFAULT_SCRIPT[tag.split('-')[0]] ?? 'latn';
    scriptCache.set(locale, script);
  }
  return script;
}

/** Any digit in a script we know how to convert between. */
const KNOWN_DIGITS = /[0-9٠-٩۰-۹]/g;

/** Non-Latin digits only — lets the common `latn` case skip the rewrite entirely. */
const NON_LATIN_DIGITS = /[٠-٩۰-۹]/;

/** The numeric value 0–9 of a digit character in any of the supported scripts. */
function digitValue(char: string): number {
  const code = char.charCodeAt(0);
  if (code >= 0x0030 && code <= 0x0039) return code - 0x0030;
  return code & 0xf; // both Arabic-Indic ranges end on the digit value
}

/**
 * Rewrites every digit in `value` into `system`. Digits already in the target script are
 * unchanged, so this is safe to apply to mixed input and safe to apply twice.
 */
export function toNumerals(value: string, system: NumberingSystem): string {
  // By far the hottest case: Latin target, Latin output — nothing to rewrite.
  if (system === 'latn' && !NON_LATIN_DIGITS.test(value)) return value;
  const zero = DIGIT_ZERO[system] ?? DIGIT_ZERO.latn;
  return value.replace(KNOWN_DIGITS, d => String.fromCharCode(zero + digitValue(d)));
}

/**
 * Forces Latin digits. Used at the API/identity boundary, where the output must be
 * machine-readable regardless of any display preference.
 */
export function toLatinDigits(value: string): string {
  return toNumerals(value, 'latn');
}
