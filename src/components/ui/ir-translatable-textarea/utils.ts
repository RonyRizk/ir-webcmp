import type { TextDirection, TranslatableLanguage, TranslatableTextareaLabels, TranslationMap } from './types';

export const DEFAULT_LABELS: TranslatableTextareaLabels = {
  translate: 'Translate',
  editorTitle: 'Translate {field}',
  language: 'Language',
  reference: 'Reference',
  required: '{language} text is required.',
  emptyReference: 'No text in the default language yet.',
  save: 'Save',
  cancel: 'Cancel',
  discard: 'Discard changes',
};

/** Fallback for engines without `Intl.Locale#getTextInfo` / `textInfo` (Firefox). Matched on the primary subtag. */
const RTL_LANGUAGES = new Set(['ar', 'arc', 'ckb', 'dv', 'fa', 'he', 'ks', 'ps', 'sd', 'ug', 'ur', 'yi']);

/** Replaces `{key}` placeholders. Unknown keys are left as-is. */
export function format(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

export function isFilled(text: string | null | undefined): boolean {
  return typeof text === 'string' && text.trim() !== '';
}

export function resolveLanguageName(code: string, label?: string, displayLocale?: string): string {
  if (label) return label;
  try {
    const name = new Intl.DisplayNames(displayLocale ? [displayLocale] : undefined, { type: 'language' }).of(code);
    if (name && name !== code) return name.charAt(0).toLocaleUpperCase(displayLocale) + name.slice(1);
  } catch {
    // Invalid code or no Intl.DisplayNames support — fall through.
  }
  return code.toUpperCase();
}

export function resolveDir(code: string, dir?: TextDirection): TextDirection {
  if (dir) return dir;
  try {
    const locale = new Intl.Locale(code) as Intl.Locale & { getTextInfo?: () => { direction?: string }; textInfo?: { direction?: string } };
    const direction = locale.getTextInfo?.().direction ?? locale.textInfo?.direction;
    if (direction === 'rtl' || direction === 'ltr') return direction;
  } catch {
    // Invalid code — fall through.
  }
  const normalized = code.toLowerCase();
  return RTL_LANGUAGES.has(normalized) || RTL_LANGUAGES.has(normalized.split('-')[0]) ? 'rtl' : 'ltr';
}

/** The translation targets: every available language except the default one, in the given order, without duplicates. */
export function targetLanguages(available: TranslatableLanguage[], defaultLanguage: string): TranslatableLanguage[] {
  const seen = new Set<string>([defaultLanguage]);
  return available.filter(language => !seen.has(language.code) && seen.add(language.code));
}

export function findLanguage(languages: TranslatableLanguage[] | null | undefined, code: string): TranslatableLanguage {
  return languages?.find(language => language.code === code) ?? { code };
}

/**
 * Web Awesome redeclares `lang`/`dir` as non-reflecting properties, so binding them in JSX never reaches the
 * attributes — and WA reads direction and locale from the attributes on the component itself. Set them directly.
 */
export function applyLanguageAttributes(el: Element | null | undefined, code: string, dir: TextDirection) {
  if (!el) return;
  if (el.getAttribute('lang') !== code) el.setAttribute('lang', code);
  if (el.getAttribute('dir') !== dir) el.setAttribute('dir', dir);
}

/**
 * Merges edited translations into the saved value. Blank translations are dropped so the map only holds real text;
 * the default language is never touched here.
 */
export function applyDraft(value: TranslationMap, draft: TranslationMap, defaultLanguage: string): { next: TranslationMap; changed: string[] } {
  const next: TranslationMap = { ...value };
  const changed: string[] = [];
  for (const [code, text] of Object.entries(draft)) {
    if (code === defaultLanguage) continue;
    const before = value[code] ?? '';
    const after = isFilled(text) ? text : '';
    if (before === after) continue;
    changed.push(code);
    if (after) next[code] = after;
    else delete next[code];
  }
  return { next, changed };
}
