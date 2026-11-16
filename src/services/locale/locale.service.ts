import axios from 'axios';
import { ExposedLanguageResultSchema, isLegacyTable, type ExposedLanguageResult, type LocaleBundle, type LocaleSections } from './types';

/**
 * The `Get_Exposed_Language` endpoint, and nothing else.
 *
 * Deliberately stateless and free of store writes — `LocaleController` owns the
 * caching and the `locales` store. Keep it that way so the service stays
 * trivially testable.
 */
export class LocaleService {
  /**
   * Fetches the localized strings for `code` across `sections`.
   *
   * Posts an absolute URL: this endpoint lives on the IRBE gateway, not the `/IR`
   * base URL `ApiClient` installs. It still passes through the shared axios
   * interceptors, so a ticket must have been set via `ApiClient.setApiClient`
   * first or the request throws `MissingApiClientError`.
   *
   * @param code Language code, e.g. `'en'` or `'ar'`.
   * @param sections At least two setup tables — see {@link LocaleSections}.
   */
  public async getExposedLanguage(code: string, sections: LocaleSections): Promise<LocaleBundle> {
    const { data } = await axios.post(`https://gateway.igloorooms.com/IRBE/Get_Exposed_Language`, { code, sections });
    if (data.ExceptionMsg) {
      throw new Error(data.ExceptionMsg);
    }
    const result = ExposedLanguageResultSchema.parse(data.My_Result ?? {});
    return {
      ...this.toEntryRecord(result),
      direction: String(result.direction).toLowerCase() === 'rtl' ? 'rtl' : 'ltr',
    };
  }

  /**
   * Flattens the `{ code, description }[]` response into a lookup keyed by code.
   *
   * Many keys are declared in more than one table (`Lcz_Cancel` in seven), so a
   * multi-table request carries the same code several times. Which one wins must
   * not depend on response order:
   *
   * - a non-empty catalog row beats a {@link LEGACY_LOCALE_TABLES} row — legacy
   *   tables are largely untranslated and answer every language in English;
   * - an empty description never replaces a non-empty one (`t()` reads `''` as missing);
   * - otherwise the last one wins, with a warning when two catalog tables disagree.
   *
   * `fallbackKeys` lists the codes only a legacy table supplied, so the controller
   * can apply the same rule across requests.
   */
  private toEntryRecord(result: ExposedLanguageResult): Pick<LocaleBundle, 'entries' | 'fallbackKeys'> {
    const entries: Record<string, string> = {};
    const fallback = new Set<string>();
    for (const entry of result.entries ?? []) {
      if (!entry?.code) {
        continue;
      }
      const description = entry.description ?? '';
      const legacy = isLegacyTable(entry.table_name);
      const existing = entries[entry.code];
      if (existing !== undefined) {
        const existingIsLegacy = fallback.has(entry.code);
        if (description === '' ? existing !== '' : legacy && !existingIsLegacy && existing !== '') {
          continue;
        }
        if (!legacy && !existingIsLegacy && existing !== description) {
          console.warn(`[locale] "${entry.code}" differs between tables: "${existing}" vs "${description}" — using the latter.`);
        }
      }
      entries[entry.code] = description;
      if (legacy) {
        fallback.add(entry.code);
      } else {
        fallback.delete(entry.code);
      }
    }
    return { entries, fallbackKeys: [...fallback] };
  }
}
