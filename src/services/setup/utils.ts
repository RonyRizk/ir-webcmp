import type { SetupEntries, ISetupEntries } from '@/models/IBooking';
import type { EntryLanguage, GroupedTableEntries } from './types';
import locales from '@/stores/locales.store';

/** Maps a supported language code to its `CODE_VALUE_*` column on {@link SetupEntries}. */
const LANGUAGE_KEY_MAP: Record<EntryLanguage, keyof SetupEntries> = {
  en: 'CODE_VALUE_EN',
  ar: 'CODE_VALUE_AR',
  de: 'CODE_VALUE_DE',
  el: 'CODE_VALUE_EL',
  fr: 'CODE_VALUE_FR',
  he: 'CODE_VALUE_HE',
  pl: 'CODE_VALUE_PL',
  ru: 'CODE_VALUE_RU',
  ua: 'CODE_VALUE_UA',
};

/**
 * Normalises any raw language string — a `@Prop() language`, `<html lang>`, the
 * `locales.language` store value — to a supported {@link EntryLanguage}. Case is
 * ignored; anything unrecognised falls back to `'en'`.
 */
export function toEntryLanguage(language?: string | null): EntryLanguage {
  const normalized = (language ?? '').toLowerCase();
  return normalized in LANGUAGE_KEY_MAP ? (normalized as EntryLanguage) : 'en';
}

/**
 * Returns the localised display string for a setup entry.
 *
 * Resolution order:
 * 1. `CODE_VALUE_<language>` — if present and non-empty.
 * 2. `CODE_VALUE_EN` — English fallback.
 * 3. `CODE_NAME` — last-resort fallback when both are absent.
 *
 * @param entry - The `SetupEntries` object to translate.
 * @param language - Language code, any case (e.g. `"fr"`, `"AR"`). Defaults to `"en"`.
 *
 * @example
 * const label = getEntryValue({ entry: someEntry, language: 'fr' });
 * // → "Petit-déjeuner" (falls back to "Breakfast" if French is null)
 */
export function getEntryValue({ entry, language = 'en' }: { entry: SetupEntries; language?: string }): string {
  const key = LANGUAGE_KEY_MAP[toEntryLanguage(language)];
  const localised = entry[key] as string | null;

  if (localised) return localised;

  const english = entry['CODE_VALUE_EN'] as string | null;
  if (english) return english;

  return entry.CODE_NAME;
}

/**
 * The localised label for a setup entry in the **currently selected UI language**.
 *
 * When `language` is omitted it reads `locales.language` (the `@stencil/store`
 * value kept in sync with `<html lang>` by `ir-locale-switcher`). Because it
 * reads a store-proxied value, calling this in a component `render()` makes the
 * component re-render automatically when the user switches language.
 */
export function getSetupEntryLabel(entry: SetupEntries, language?: string): string {
  return getEntryValue({ entry, language: language ?? locales.language });
}

/**
 * Groups a flat setup-entry list by table. The key is the lower-cased `TBL_NAME`
 * with its leading underscore stripped (`_PAY_TYPE` -> `pay_type`). Null-safe:
 * entries without a `TBL_NAME` are skipped, and names without a leading `_` are
 * tolerated.
 */
export function groupEntryTablesResult(entries: SetupEntries[]): GroupedTableEntries {
  const result: Record<string, SetupEntries[]> = {};
  for (const entry of entries) {
    if (!entry.TBL_NAME) {
      continue;
    }
    const key = entry.TBL_NAME.startsWith('_') ? entry.TBL_NAME.substring(1).toLowerCase() : entry.TBL_NAME.toLowerCase();
    if (!result[key]) {
      result[key] = [];
    }
    result[key] = [...result[key], entry];
  }
  return result as GroupedTableEntries;
}

/**
 * Maps the arrival-time / rate-pricing-mode / bed-preference groups of a
 * {@link groupEntryTablesResult} output to the {@link ISetupEntries} shape the
 * booking editors consume.
 */
export function toSetupEntries(grouped: GroupedTableEntries): ISetupEntries {
  return {
    arrivalTime: grouped.arrival_time,
    ratePricingMode: grouped.rate_pricing_mode,
    bedPreferenceType: grouped.bed_preference_type,
  };
}
