import { resolveLocale, resolveNumberingScript, resolveNumberingSystem, toLatinDigits, toNumerals } from '@/utils/date';
import { NumberingSystem, NumberingSystemPreference } from '@/utils/date/types';

/**
 * Locale- and digit-script-aware number display, sharing one setting with the date layer: a user
 * who picks Arabic-Indic digits gets them on dates, prices and counts alike.
 *
 * Unlike the date layer — which substitutes digits in an already-formatted string — numbers go
 * through `Intl.NumberFormat`, so grouping and decimal separators localize too
 * (`١٬٢٣٤٬٥٦٧٫٥٠`, or `1.234.567,50` under `ar-MA`). Substituting digits alone would leave
 * Latin separators in Arabic text, which reads wrong.
 *
 * **Display only.** Never use these for values that are posted to an API, written to an input,
 * used as a key, or parsed back with `Number()` — a grouped, non-Latin string will not round
 * trip. Keep those paths on the raw number.
 */

export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  /** Overrides the active display language for this call only. */
  locale?: string;
  /** Overrides the resolved digit script for this call only. */
  numberingSystem?: NumberingSystemPreference;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

/**
 * Builds the BCP-47 tag with the `-u-nu-` extension. The script is always concrete by this point
 * — `'auto'` is resolved by `resolveNumberingScript` so that numbers and dates agree, rather
 * than each falling back to its own library's idea of the locale default.
 */
function buildFormatter(locale: string, numbering: NumberingSystem, intlOptions: Intl.NumberFormatOptions): Intl.NumberFormat {
  const tag = `${locale}-u-nu-${numbering}`;
  const cacheKey = `${tag}|${JSON.stringify(intlOptions)}`;
  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(tag, intlOptions);
    } catch {
      // Unknown locale/extension — fall back rather than throwing out of a render.
      formatter = new Intl.NumberFormat('en', intlOptions);
    }
    formatterCache.set(cacheKey, formatter);
  }
  return formatter;
}

function split({ locale, numberingSystem, ...intlOptions }: FormatNumberOptions = {}): [string, NumberingSystem, Intl.NumberFormatOptions] {
  const resolvedLocale = resolveLocale({ locale });
  return [resolvedLocale, resolveNumberingScript(resolvedLocale, resolveNumberingSystem({ numberingSystem })), intlOptions];
}
/**
 * Formats a booking number — and any other digit string that is an *identifier* rather than a
 * quantity (channel booking references, invoice numbers, confirmation codes).
 *
 * These must not go through `Intl.NumberFormat`, which would treat them as quantities:
 *
 *   formatNumber(Number('0042'))  →  '42'      leading zeros lost
 *   formatNumber(Number('100234')) → '100,234'  grouping separator invented
 *
 * Both corrupt the identifier. This converts digit-by-digit instead, so the string keeps its
 * exact length, its leading zeros, and any separators it already carries (`BK-0042/7` stays
 * `BK-٠٠٤٢/٧`). Non-digit characters pass through untouched.
 *
 * @example formatBookingNumber('0042')  // '0042' · '٠٠٤٢' under Arabic-Indic
 *
 * Display only — never feed the result back to an API, an input, or a lookup key; keep those on
 * the original string.
 */
export function formatBookingNumber(value: string | null | undefined, options?: Pick<FormatNumberOptions, 'locale' | 'numberingSystem'>): string {
  if (value === null || value === undefined) return '';
  // `String(...)` is defensive only. A booking number that arrived as a JSON *number* has
  // already lost its leading zeros upstream — this cannot recover them, it just avoids throwing.
  const [, numbering] = split(options);
  return toNumerals(String(value), numbering);
}

/**
 * Formats a number for display in the active language and digit script.
 *
 * @example formatNumber(3)        // '3'  ·  '٣' under Arabic-Indic
 * @example formatNumber(1234.5, { minimumFractionDigits: 2 })  // '1,234.50' · '١٬٢٣٤٫٥٠'
 */
export function formatNumber(value: number | null | undefined, options?: FormatNumberOptions): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  const [locale, numbering, intlOptions] = split(options);
  return buildFormatter(locale, numbering, intlOptions).format(value);
}

/**
 * Formats a whole-number count — occupancy badges, night counts, row totals. Fraction digits are
 * pinned to zero so a stray float never renders as `3.0000001`.
 */
export function formatCount(value: number | null | undefined, options?: FormatNumberOptions): string {
  return formatNumber(value, { maximumFractionDigits: 0, ...options });
}

/**
 * Formats a percentage from a whole number, i.e. `formatPercent(87)` → `'87%'`. Takes 0–100
 * rather than 0–1 because that is how occupancy and similar values are already held in this
 * codebase.
 */
export function formatPercent(value: number | null | undefined, options?: FormatNumberOptions): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  const [locale, numbering, intlOptions] = split(options);
  return buildFormatter(locale, numbering, { style: 'percent', maximumFractionDigits: 0, ...intlOptions }).format(value / 100);
}

/**
 * The money format used across the app: an optional leading minus, the currency symbol, then the
 * amount at two decimal places. Kept as symbol-plus-number rather than `style: 'currency'`
 * because callers pass an already-resolved symbol (`$`, `€`, `ر.س`), not an ISO code.
 */
export function formatAmount(currency: string, amount: number = 0, options?: FormatNumberOptions): string {
  const formatted = formatNumber(Math.abs(amount ?? 0), { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options });
  return `${amount < 0 ? '- ' : ''}${currency} ${formatted}`;
}

/**
 * The input-side counterpart of the formatters above: rewrites whatever the user typed into the
 * machine-readable form. Arabic-Indic / Persian digits become Latin (`١٢` → `12`), and the Arabic
 * decimal and thousands separators become `.` and `,` (`١٬٢٣٤٫٥٠` → `1,234.50`), so a price typed on
 * an Arabic keyboard reaches the mask and the API the same way a Latin one does.
 *
 * Use this on the way *in* — input handlers and mask `prepare` hooks — never for display.
 */
export function normalizeNumericInput(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  return toLatinDigits(String(value))
    .replace(/\u066B/g, '.')
    .replace(/\u066C/g, ',');
}
