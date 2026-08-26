import { TranslationEntry, TranslationLanguage } from './types';

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
