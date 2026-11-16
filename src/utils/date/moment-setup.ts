import moment from 'moment';
// Locale data for every language in `EntryLanguage` (`src/services/setup/types.ts`), plus every Arabic
// regional variant moment ships — they differ in month names (سبتمبر / شتنبر / أيلول) and in
// native digits. `en` is built in; `ua` maps to moment's `uk` (see `locale-map.ts`).
//
// These MUST be evaluated before the `moment-hijri` import below. moment-hijri ends with
// `updateLocale('ar-sa', { iMonths })`; in the browser bundle moment's `loadLocale` cannot
// require anything, so on an unloaded `ar-sa` that call fabricates a stub carrying `iMonths`
// and no weekday data. Loading `moment/locale/ar-sa` afterwards then calls `defineLocale` on a
// name that already exists, which moment reports as:
//
//   Deprecation warning: use moment.updateLocale(localeName, config) to change an existing locale.
//
// With this order the real locale is defined first and moment-hijri merges `iMonths` into it —
// no warning, and `ar-sa` keeps both Arabic weekdays and Arabic Hijri months.
import 'moment/locale/ar';
import 'moment/locale/ar-dz';
import 'moment/locale/ar-kw';
import 'moment/locale/ar-ly';
import 'moment/locale/ar-ma';
import 'moment/locale/ar-ps';
import 'moment/locale/ar-sa';
import 'moment/locale/ar-tn';
import 'moment/locale/de';
import 'moment/locale/el';
import 'moment/locale/fr';
import 'moment/locale/he';
import 'moment/locale/pl';
import 'moment/locale/ru';
import 'moment/locale/uk';

import momentHijri from 'moment-hijri';

/**
 * The single configured moment instance for the whole app. Import `momentHijri` from here —
 * never `'moment-hijri'` directly, and never `'moment/min/moment-with-locales'` (that is a
 * *third copy* of moment with its own locale registry, invisible to this one).
 *
 * **`momentHijri` and a bare `import moment from 'moment'` are NOT the same object in the
 * browser bundle.** `moment-hijri` requires `'moment/moment'` while the bare specifier resolves
 * through the package entry, and the bundler emits two copies. The `moment/locale/*` files
 * require `'../moment'`, so their data lands on moment-hijri's copy — which is why every
 * locale-registry write below goes through `momentHijri`, not `moment`. Writing to `moment`
 * here silently does nothing: the update lands on a copy nothing formats with.
 *
 * **Importing `moment-hijri` sets moment's GLOBAL locale to `ar-sa`**, and each
 * `moment/locale/*` import above sets it to whichever loaded last. The `ar`/`ar-sa`
 * locales carry an Arabic-Indic `postformat`, so an unguarded import silently turns every
 * `format('YYYY-MM-DD')` in the codebase into `٢٠٢٦-٠٨-٢٧` and breaks all 268 API-payload call
 * sites. {@link configureMoment} pins the global locale back to `'en'`.
 *
 * {@link configureMoment} is invoked lazily — from `ir-date.ts` on every format, and once from
 * `src/global/app.ts` at boot — and deliberately NOT from this module's body. The bundler does
 * not guarantee that the body runs after the side-effect locale imports above; when it does not,
 * `updateLocale('ar', …)` would create a stub that the real `moment/locale/ar` then overwrites,
 * silently losing the Arabic Hijri month names. Do not "optimise" it back to a top-level call.
 *
 * Latin digits are enforced by post-processing the formatted string in `ir-date.ts`, not by
 * deriving `parentLocale` variants here. `moment.defineLocale(…, { parentLocale })` returns null
 * when the parent has not been evaluated yet, which is exactly the ordering we cannot rely on.
 */

/**
 * Arabic Hijri month names, attached to every Arabic locale so each renders Arabic weekdays
 * *and* Arabic Hijri months from a single locale.
 *
 * moment-hijri ships these on `ar-sa` alone, and its `ar-sa` definition carries no weekday data
 * — routing Arabic+Hijri there produced Arabic months with English weekdays
 * (`Tue, 19 ربيع 1`). Copying the tables onto each variant avoids that and keeps the dialects
 * interchangeable.
 */
const ARABIC_LOCALES = ['ar', 'ar-dz', 'ar-kw', 'ar-ly', 'ar-ma', 'ar-ps', 'ar-sa', 'ar-tn'];
const ARABIC_HIJRI_MONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
const ARABIC_HIJRI_MONTHS_SHORT = ['محرم', 'صفر', 'ربيع ١', 'ربيع ٢', 'جمادى ١', 'جمادى ٢', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];

/**
 * Best-effort early reset. This may run *before* the locale imports above are evaluated, in
 * which case the last of them wins and the global is left at `uk` — harmless (it still renders
 * Latin digits) and corrected by the first {@link configureMoment} call.
 */
momentHijri.locale('en');
moment.locale('en');

let configured = false;

/**
 * Idempotently applies the Arabic Hijri month tables to every Arabic variant and pins moment's
 * global locale to `'en'`.
 * Safe (and cheap) to call on every format. Runs lazily so that it is guaranteed to execute
 * after the side-effect locale imports above, whatever order the bundler emits them in.
 */
export function configureMoment(): void {
  if (configured) return;
  configured = true;
  // `updateLocale` merges into the already-loaded `ar` and switches the global locale to it,
  // so the reset below must stay last.
  for (const locale of ARABIC_LOCALES) {
    momentHijri.updateLocale(locale, { iMonths: ARABIC_HIJRI_MONTHS, iMonthsShort: ARABIC_HIJRI_MONTHS_SHORT } as moment.LocaleSpecification);
  }
  // Reset both copies: moment-hijri's (used for display) and the bare one the ~268
  // `format('YYYY-MM-DD')` identity call sites across the app import.
  momentHijri.locale('en');
  moment.locale('en');
}

export { momentHijri };
export default momentHijri;
