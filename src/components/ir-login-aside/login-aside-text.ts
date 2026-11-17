import { tRaw } from '@/services/locale/t';
import type { TLocaleEntries } from '@/stores/locales.store';

/** Looks an aside label up by `Lcz_*` key; `params` fill the `%1`, `%2`, … placeholders. */
export type LoginAsideTranslate = (key: string, fallback: string, params?: ReadonlyArray<string | number>) => string;

/**
 * The lookup every login aside view uses. A label comes from the first of:
 *
 * 1. the `locales` store, when the screen has loaded the login strings into it;
 * 2. the entries the host passes down through `localeEntries`;
 * 3. the built-in English text.
 *
 * The store read goes through its proxy, so a view that calls this in `render()` re-renders
 * when the store's strings change.
 */
export function createLoginAsideTranslate(getEntries: () => TLocaleEntries | null | undefined): LoginAsideTranslate {
  return (key, fallback, params) => tRaw(key, { fallback: getEntries()?.[key] || fallback, params });
}
