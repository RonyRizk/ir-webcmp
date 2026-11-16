import * as z from 'zod';
import type { TLocaleEntries } from '@/stores/locales.store';

/**
 * The setup tables `Get_Exposed_Language` can be asked for.
 *
 * These are exactly the types intersected into {@link TLocaleEntries} in
 * `src/stores/locales.store.ts` — keep the two lists in sync, otherwise a table
 * can be fetched whose keys are not declared on {@link LocaleKey}.
 */
export const LOCALE_TABLES = [
  '_PMS_FRONT',
  '_USER_MGT',
  '_BOOKING_LIST_FRONT',
  '_HK_FRONT',
  '_CHANNEL_FRONT',
  '_PAYMENT_BACK',
  '_COMMON',
  '_FINANCIALS',
  '_BOOKING',
  '_CALENDAR',
  '_FRONTDESK',
  '_HOUSEKEEPING',
  '_AGENTS',
  '_REPORTS',
  '_SETTINGS',
  '_GUESTS',
  '_AUTH',
  '_PMS',
] as const;

export type LocaleTable = (typeof LOCALE_TABLES)[number];

/**
 * The backend tables `Get_Exposed_Language` served before the label catalog
 * (`lcz-labels.json`) existed — the six in `legacy-locale-keys.json`.
 *
 * Most of them were never translated in Setup: `_USER_MGT` answers `fr` and `ar`
 * with its English text. Many of their keys were later re-declared in a catalog
 * table (`Lcz_Email` in `_COMMON`, `Lcz_EditUser` in `_SETTINGS`, …) that *is*
 * translated, so a legacy value must never replace a catalog one — otherwise the
 * last table in the response, or the last screen to load, decides the language.
 */
export const LEGACY_LOCALE_TABLES = ['_PMS_FRONT', '_USER_MGT', '_BOOKING_LIST_FRONT', '_HK_FRONT', '_CHANNEL_FRONT', '_PAYMENT_BACK'] as const satisfies readonly LocaleTable[];

/** Whether a response row's `table_name` is one of {@link LEGACY_LOCALE_TABLES}. Rows without one count as catalog rows. */
export function isLegacyTable(table: string | null | undefined): boolean {
  return !!table && (LEGACY_LOCALE_TABLES as readonly string[]).includes(table);
}

/**
 * The `sections` payload. `LocaleController` builds it by merging its base set
 * with whatever the screen asked for, so it is never empty — but it is often a
 * single table (`['_PMS_FRONT']`), which the endpoint has always accepted.
 */
export type LocaleSections = readonly LocaleTable[];

/** Every `Lcz_*` key the store declares. Gives `t()` autocomplete and typo errors. */
export type LocaleKey = keyof NonNullable<TLocaleEntries>;

export type TranslateOptions = {
  /** Positional values for the API's `%1`, `%2`, … placeholders. */
  params?: ReadonlyArray<string | number>;
  /** Rendered when the key is missing. Defaults to the key itself. */
  fallback?: string;
  /**
   * Read from this language's scope instead of the one resolved from the rendering component.
   * Only needed outside `render()` (toasts, validators) inside a `lang` subtree — pass
   * `LocaleController.languageFor(this.el)`.
   */
  language?: string;
};

export type LoadLocaleParams = {
  /** Falls back to the loaded language, then `<html lang>`, then `'en'`. */
  language?: string;
  /** Extra tables on top of `LocaleController.BASE_TABLES` — use a `SCREEN_TABLES` entry. */
  tables?: readonly LocaleTable[];
  /** Refetch even when every requested table is already loaded. */
  force?: boolean;
};

/** One row of `My_Result.entries` — the key/value pair for a single string. */
export const LocaleEntryRowSchema = z.object({
  code: z.string(),
  description: z.string().nullable().default(''),
  table_name: z.string().nullable().optional(),
});
export type LocaleEntryRow = z.infer<typeof LocaleEntryRowSchema>;

/** `My_Result` of `Get_Exposed_Language`. */
export const ExposedLanguageResultSchema = z.object({
  entries: z.array(LocaleEntryRowSchema).nullable().default([]),
  direction: z.string().nullable().default('LTR'),
});
export type ExposedLanguageResult = z.infer<typeof ExposedLanguageResultSchema>;

/** What {@link LocaleService.getExposedLanguage} hands back, normalized. */
export type LocaleBundle = {
  entries: Record<string, string>;
  direction: 'ltr' | 'rtl';
  /** Keys whose value came only from a {@link LEGACY_LOCALE_TABLES} row — see {@link isLegacyTable}. */
  fallbackKeys: string[];
};
