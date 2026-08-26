import type { EditSetupParams, ExposedLanguages, SetupEntry } from '@/services/setup/types';
import moment from 'moment';
import { TranslationEntry, TranslationEntryMeta, TranslationLanguage } from './types';

/**
 * Setup only has a fixed set of CODE_VALUE_* columns, so the manager cannot
 * offer arbitrary languages the way a purely local prototype could — every
 * language shown must map to one of these codes to be persisted.
 */
export const SETUP_LANGUAGE_CODES = ['en', 'fr', 'ar', 'ru', 'el', 'he', 'pl', 'de', 'ua'] as const;
export type SetupLanguageCode = (typeof SETUP_LANGUAGE_CODES)[number];

export function isSetupLanguageCode(code: string): code is SetupLanguageCode {
  return (SETUP_LANGUAGE_CODES as readonly string[]).includes(code);
}

/**
 * Which languages this property actually wants translated, and their display
 * names, come from Get_Exposed_Languages — narrowed to the codes Setup can
 * actually persist, since a property may expose a language with no matching
 * CODE_VALUE_* column.
 */
export function exposedLanguagesToTranslationLanguages(exposed: ExposedLanguages): TranslationLanguage[] {
  return exposed
    .map(language => ({ code: language.code.toLowerCase(), name: language.description }))
    .filter((language): language is { code: SetupLanguageCode; name: string } => isSetupLanguageCode(language.code))
    .map(language => ({ ...language, isSource: language.code === 'en' }));
}

function readSetupValue(entry: SetupEntry, code: SetupLanguageCode): string {
  switch (code) {
    case 'en':
      return entry.CODE_VALUE_EN ?? '';
    case 'fr':
      return entry.CODE_VALUE_FR ?? '';
    case 'ar':
      return entry.CODE_VALUE_AR ?? '';
    case 'ru':
      return entry.CODE_VALUE_RU ?? '';
    case 'el':
      return entry.CODE_VALUE_EL ?? '';
    case 'he':
      return entry.CODE_VALUE_HE ?? '';
    case 'pl':
      return entry.CODE_VALUE_PL ?? '';
    case 'de':
      return entry.CODE_VALUE_DE ?? '';
    case 'ua':
      return entry.CODE_VALUE_UA ?? '';
  }
}

/** CODE_NAME is unique within a table, so it doubles as a stable local id. */
export function setupEntryToTranslationEntry(entry: SetupEntry): TranslationEntry {
  const values: Record<string, string> = {};
  for (const code of SETUP_LANGUAGE_CODES) {
    values[code] = readSetupValue(entry, code);
  }
  return {
    id: entry.CODE_NAME,
    key: entry.CODE_NAME,
    values,
    meta: {
      ownerId: entry.OWNER_ID ?? 0,
      isSystem: entry.ISSYSTEM,
      isDeleteable: entry.ISDELETEABLE,
      isUpdateable: entry.ISUPDATEABLE,
      isVisible: entry.ISVISIBLE,
      isDeleted: entry.ISDELETED,
      displayOrder: entry.DISPLAY_ORDER ?? 0,
      notes: entry.NOTES ?? '',
      invariantValue: entry.INVARIANT_VALUE,
      entryDate: entry.ENTRY_DATE,
    },
  };
}

/**
 * Builds a full Edit_Setup payload for creating or updating one entry.
 * Administrative flags fall back to "normal, fully-editable custom entry"
 * defaults when `meta` is absent (i.e. the entry is being created).
 */
export function buildEditSetupParams(input: {
  ownerId: number;
  entryUserId: number;
  tableName: string;
  key: string;
  values: Record<string, string>;
  meta?: TranslationEntryMeta;
  isDeleted?: boolean;
  /** True for a genuine content edit — stamps a fresh ENTRY_DATE. Omitted (e.g. reorder, bulk delete) preserves the entry's existing date. */
  touch?: boolean;
  /** Overrides DISPLAY_ORDER regardless of `meta` — used to place a brand-new row at the end of the table. */
  displayOrder?: number;
}): EditSetupParams {
  const { meta } = input;
  return {
    // OWNER_ID: meta?.ownerId ?? input.ownerId,
    TBL_NAME: input.tableName,
    CODE_NAME: input.key,
    ISSYSTEM: meta?.isSystem ?? false,
    ISDELETEABLE: meta?.isDeleteable ?? true,
    ISUPDATEABLE: meta?.isUpdateable ?? true,
    ISVISIBLE: meta?.isVisible ?? true,
    ISDELETED: input.isDeleted ?? false,
    DISPLAY_ORDER: input.displayOrder ?? meta?.displayOrder ?? 0,
    CODE_VALUE_EN: input.values.en ?? '',
    CODE_VALUE_FR: input.values.fr ?? '',
    CODE_VALUE_AR: input.values.ar ?? '',
    CODE_VALUE_RU: input.values.ru ?? '',
    CODE_VALUE_EL: input.values.el ?? '',
    CODE_VALUE_HE: input.values.he ?? '',
    CODE_VALUE_PL: input.values.pl ?? '',
    CODE_VALUE_DE: input.values.de ?? '',
    CODE_VALUE_UA: input.values.ua ?? '',
    ENTRY_DATE: input.touch || !meta?.entryDate ? moment().toISOString() : meta.entryDate,
    // ENTRY_USER_ID: input.entryUserId,
    NOTES: meta?.notes ?? '',
    INVARIANT_VALUE: meta?.invariantValue ?? null,
  };
}
