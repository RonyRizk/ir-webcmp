import { CalendarSystem } from './types';

/**
 * Maps an app language code (the `EntryLanguage` union in `src/services/setup/types.ts`) to the moment
 * locale to format with, per calendar system.
 *
 * Under Hijri, each language keeps its **own** locale rather than falling back to English: a
 * non-Arabic moment locale carries no `iMonths` table, so moment-hijri supplies its
 * transliterated Hijri month names (`Rabi' al-Awwal`) while the locale still renders its own
 * weekday names (`jeudi`, `четверг`). Falling back to `en` wholesale would have anglicised the
 * weekdays too.
 *
 * Arabic uses the same `ar` locale for both calendars: `moment-setup.ts` attaches the Arabic
 * Hijri month tables to it, so Arabic weekdays and Arabic Hijri months come from one locale.
 * `ar` emits Arabic-Indic digits, which `ir-date.ts` converts back to Latin after formatting.
 *
 * `ua` is not a moment locale — Ukrainian is `uk`.
 */
const LOCALE_MAP: Record<string, { gregory: string; hijri: string }> = {
  'en': { gregory: 'en', hijri: 'en' },
  'ar': { gregory: 'ar', hijri: 'ar' },
  // Arabic regional variants — different Gregorian month names and native digits, same Hijri
  // month table (attached to all of them in `moment-setup.ts`).
  'ar-dz': { gregory: 'ar-dz', hijri: 'ar-dz' },
  'ar-kw': { gregory: 'ar-kw', hijri: 'ar-kw' },
  'ar-ly': { gregory: 'ar-ly', hijri: 'ar-ly' },
  'ar-ma': { gregory: 'ar-ma', hijri: 'ar-ma' },
  'ar-ps': { gregory: 'ar-ps', hijri: 'ar-ps' },
  'ar-sa': { gregory: 'ar-sa', hijri: 'ar-sa' },
  'ar-tn': { gregory: 'ar-tn', hijri: 'ar-tn' },
  'de': { gregory: 'de', hijri: 'de' },
  'el': { gregory: 'el', hijri: 'el' },
  'fr': { gregory: 'fr', hijri: 'fr' },
  'he': { gregory: 'he', hijri: 'he' },
  'pl': { gregory: 'pl', hijri: 'pl' },
  'ru': { gregory: 'ru', hijri: 'ru' },
  'ua': { gregory: 'uk', hijri: 'uk' },
  'uk': { gregory: 'uk', hijri: 'uk' },
};

/**
 * Resolves the moment locale for a language + calendar pair, falling back to `en` for anything
 * unrecognised. Region-tagged input resolves to an exact match when one exists (`ar-MA` →
 * `ar-ma`) and otherwise falls back to the primary subtag (`en-GB` → `en`).
 */
// Deliberately not memoized: benchmarking showed the cache key cost more to build than the
// lookup it replaced (0.11µs vs 0.03µs), and this now runs only on a result-cache miss anyway.
export function toMomentLocale(language: string | null | undefined, calendar: CalendarSystem = 'gregory'): string {
  const tag = (language ?? '').toLowerCase().replace('_', '-');
  // Exact regional match first (`ar-ma`), then the primary subtag (`ar-EG` → `ar`), then English.
  const entry = LOCALE_MAP[tag] ?? LOCALE_MAP[tag.split('-')[0]] ?? LOCALE_MAP.en;
  return calendar === 'islamic-umalqura' ? entry.hijri : entry.gregory;
}
