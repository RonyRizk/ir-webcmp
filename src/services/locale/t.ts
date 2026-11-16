import { locales } from '@/stores/locales.store';
import { getLocaleScope, getRenderingLanguage } from './locale-scope';
import type { LocaleKey, TranslateOptions } from './types';

/**
 * Reads a localized string out of the `locales` store.
 *
 * Call it inside `render()` — the read goes through the `@stencil/store` proxy,
 * which subscribes the calling component, so text re-renders on a language
 * switch with no `@Watch('language')` of its own.
 *
 *   {t('Lcz_Balance')}
 *   {t('Lcz_BookingsNbr', { params: [guest.nbr_confirmed_bookings] })}
 *
 * @param key A declared `Lcz_*` key. Unknown keys are a compile error — use
 * {@link tRaw} when the key is only known at runtime.
 * @returns The translation, or `options.fallback` (defaulting to `key` itself,
 * so gaps are visible) when the key has not been loaded. `params` fill both.
 */
export function t<K extends LocaleKey>(key: K, options?: TranslateOptions): string {
  return tRaw(key as string, options);
}

/**
 * {@link t} for keys that aren't in the declared union — keys built at runtime,
 * or sections not yet added to `src/stores/locales.store.ts`.
 */
export function tRaw(key: string, options?: TranslateOptions): string {
  const value = lookup(key, options?.language ?? getRenderingLanguage());
  if (value === undefined || value === null || value === '') {
    // Fallbacks carry the same `%1` placeholders as the translation, so they need the same fill.
    return options?.fallback !== undefined ? interpolate(options.fallback, options.params) : key;
  }
  return interpolate(value, options?.params);
}

/**
 * A `lang` subtree reads its own scope first. A key that scope hasn't loaded falls back to the
 * document's entries — a string in the page language beats showing the raw key.
 */
function lookup(key: string, language: string | undefined): string | undefined {
  const global = locales.entries as Record<string, string> | null;
  if (language && language.toLowerCase() !== locales.language) {
    const scoped = getLocaleScope(language).entries?.[key];
    if (scoped !== undefined && scoped !== null && scoped !== '') return scoped;
  }
  return global?.[key];
}

/**
 * Fills the API's positional placeholders. Translations carry `%1`, `%2`, … —
 * e.g. `Lcz_EmailBookingto` is "Email booking to %1".
 */
export function interpolate(value: string, params?: ReadonlyArray<string | number>): string {
  if (!params?.length) {
    return value;
  }
  return params.reduce<string>((acc, param, index) => acc.split(`%${index + 1}`).join(String(param)), value);
}
