/** Text per language, keyed by BCP-47 code, e.g. `{ en: 'Sea view room', fr: 'Chambre vue mer' }`. */
export type TranslationMap = Record<string, string>;

export type TextDirection = 'ltr' | 'rtl';

/** A language the field can be translated into. */
export interface TranslatableLanguage {
  /** BCP-47 code, e.g. `fr`, `ar`, `pt-BR`. */
  code: string;
  /** Display name. Falls back to `Intl.DisplayNames`, then the uppercased code. */
  label?: string;
  /** Writing direction. Falls back to `Intl.Locale` text info, then a known RTL list. */
  dir?: TextDirection;
}

/** UI strings. Every key has an English default so the component works without a host i18n store. */
export interface TranslatableTextareaLabels {
  /** Inline action that opens the translation editor. */
  translate: string;
  /** Translation editor title. `{field}` is replaced with the field label. */
  editorTitle: string;
  /** Language selector label in the editor. */
  language: string;
  /** Heading of the read-only source column. */
  reference: string;
  /** Validation message when the default language is empty. `{language}` is replaced. */
  required: string;
  /** Shown in the reference column when the source text is empty. */
  emptyReference: string;
  save: string;
  cancel: string;
  /** Replaces `cancel` while the editor has unsaved changes. */
  discard: string;
}

export interface TranslatableValueChangeDetail {
  value: TranslationMap;
  /** The languages whose text changed. */
  languages: string[];
}
