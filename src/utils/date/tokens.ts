/**
 * Translates a Gregorian moment format string into its moment-hijri equivalent, so that call
 * sites can keep passing one plain format string (`'ddd, DD MMM YYYY'`) and get Hijri output
 * when the Hijri calendar is active — without knowing moment-hijri's `i`-prefixed ApiClient set.
 *
 * Only the tokens that actually name a *calendar* field are rewritten. Day-of-week and
 * clock-time are calendar-independent — Thursday is Thursday in both systems — so `dddd`, `ddd`,
 * `HH`, `mm`, `A`, `Z` and friends pass through untouched and still localize via the moment
 * locale.
 *
 * Deliberately NOT handled: moment's *localized* tokens (`L`, `LL`, `ll`, `LT`, `LLLL`) have no
 * `i`-prefixed counterpart in moment-hijri. Nothing in this codebase uses them, and
 * `STYLE_FORMATS` in `ir-date.ts` is written with plain tokens precisely so they never reach
 * here. The same applies to week/week-year tokens (`w`, `ww`, `gggg`), which are unused in this
 * codebase. Anything unmapped is passed through, yielding a Gregorian field under a Hijri
 * preference — extend `HIJRI_TOKENS` rather than working around it at the call site.
 */

/** Gregorian ApiClient → moment-hijri ApiClient. Order in the regex below is longest-match-first. */
const HIJRI_TOKENS: Record<string, string> = {
  // Year
  YYYY: 'iYYYY',
  YY: 'iYY',
  Y: 'iYYYY',
  // Month
  MMMM: 'iMMMM',
  MMM: 'iMMM',
  MM: 'iMM',
  Mo: 'iMo',
  M: 'iM',
  // Day of month / day of year
  DDDD: 'iDDDD',
  DDD: 'iDDD',
  DD: 'iDD',
  Do: 'iDo',
  D: 'iD',
};

/**
 * Matches, in priority order: a `[bracketed literal]`, then any translatable ApiClient
 * longest-first, then any single remaining character (separators, weekday/time tokens, stray
 * letters). Bracketed literals are matched first so `'[MMM]'` stays the text `MMM`.
 */
const TOKEN_PATTERN = /\[[^\]]*\]|YYYY|YY|Y|MMMM|MMM|MM|Mo|M|DDDD|DDD|DD|Do|D|./g;

/**
 * Translations are cached: format strings come from a small fixed vocabulary (~20 distinct
 * strings across the codebase) but are translated on every formatted cell, so the regex pass is
 * pure repeated work.
 */
const translationCache = new Map<string, string>();

/**
 * @param format A moment format string using ordinary Gregorian tokens.
 * @returns The same string with calendar-field tokens rewritten for moment-hijri.
 */
export function toHijriFormat(format: string): string {
  if (!format) return format;
  let translated = translationCache.get(format);
  if (translated === undefined) {
    translated = format.replace(TOKEN_PATTERN, match => (match.startsWith('[') ? match : (HIJRI_TOKENS[match] ?? match)));
    translationCache.set(format, translated);
  }
  return translated;
}
