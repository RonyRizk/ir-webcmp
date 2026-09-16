import type { DuplicatedSetupEntriesAcrossTables } from '@/services/setup';
import { DuplicateInfo, TranslationEntry, TranslationLanguage } from './types';
import { USED_SETUP_TABLE_SET } from './used-setup-tables';

/** A translation counts as present only when it holds non-whitespace text. */
export function hasValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/** How many of `languages` are still untranslated for a single entry. */
export function countMissing(entry: TranslationEntry, languages: TranslationLanguage[]): number {
  return languages.reduce((total, language) => (hasValue(entry.values[language.code]) ? total : total + 1), 0);
}

/** Percentage (0-100) of `entries` that carry a value for `code`. Empty sets read as complete. */
export function completionFor(entries: TranslationEntry[], code: string): number {
  if (entries.length === 0) {
    return 100;
  }
  const translated = entries.filter(entry => hasValue(entry.values[code])).length;
  return Math.round((translated / entries.length) * 100);
}

/** The language authors write against — flagged source, or the first language as a fallback. */
export function getSourceLanguage(languages: TranslationLanguage[]): TranslationLanguage | undefined {
  return languages.find(language => language.isSource) ?? languages[0];
}

/** Source language first, then the rest in their configured order. */
export function orderLanguages(languages: TranslationLanguage[]): TranslationLanguage[] {
  const source = getSourceLanguage(languages);
  if (!source) {
    return languages;
  }
  return [source, ...languages.filter(language => language.code !== source.code)];
}

/** True once at least one entry carries a real (non-default) display order. */
export function hasExplicitOrder(entries: TranslationEntry[]): boolean {
  return entries.some(entry => (entry.meta?.displayOrder ?? 0) !== 0);
}

/** Leaves fetch order alone until a display order has actually been set. */
export function sortByDisplayOrder(entries: TranslationEntry[]): TranslationEntry[] {
  if (!hasExplicitOrder(entries)) {
    return entries;
  }
  return [...entries].sort((a, b) => (a.meta?.displayOrder ?? 0) - (b.meta?.displayOrder ?? 0));
}

/** The language codes whose value differs between two versions of a row, with the new values. */
export function diffValues(before: Record<string, string> | undefined, after: Record<string, string>): Record<string, string> {
  const changed: Record<string, string> = {};
  for (const code of Object.keys(after)) {
    if ((before?.[code] ?? '') !== (after[code] ?? '')) {
      changed[code] = after[code] ?? '';
    }
  }
  return changed;
}

/**
 * Flattens the API's per-description groups into a per-row lookup keyed by the same
 * `TBL_NAME::CODE_NAME` id the entries carry. Only tables the codebase actually reads
 * count, and a row's own table never does — so a description that also lives in one
 * unused table gets no badge and no propagation, while one repeated twice inside a
 * single other table yields two siblings in one table.
 */
export function buildDuplicateMap(groups: DuplicatedSetupEntriesAcrossTables[] | null | undefined): Map<string, DuplicateInfo> {
  const byEntry = new Map<string, DuplicateInfo>();
  for (const group of groups ?? []) {
    const used = group.ENTRIES.filter(entry => USED_SETUP_TABLE_SET.has(entry.TBL_NAME));
    for (const entry of used) {
      const siblings = used.filter(other => other.TBL_NAME !== entry.TBL_NAME).map(other => ({ tableName: other.TBL_NAME, key: other.CODE_NAME }));
      if (siblings.length === 0) {
        continue;
      }
      const tables = [...new Set(siblings.map(sibling => sibling.tableName))].sort();
      byEntry.set(`${entry.TBL_NAME}::${entry.CODE_NAME}`, { siblings, tables });
    }
  }
  return byEntry;
}
