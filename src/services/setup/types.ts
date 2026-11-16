import { SetupEntrySchema } from '@/models/IBooking';
import type { SetupEntries } from '@/models/IBooking';
import * as z from 'zod';
import { LanguageSchema } from '../commonSchemas';

// ---------------------------------------------------------------------------
// Shared entry shape
// ---------------------------------------------------------------------------

export { SetupEntrySchema };
/** A single labeled setup row (one translated string across all supported languages). */
export type SetupEntry = z.infer<typeof SetupEntrySchema>;

// ---------------------------------------------------------------------------
// Setup table identifiers
// ---------------------------------------------------------------------------

/**
 * Every setup `TBL_NAME` the app reads at runtime, as string literals, plus an
 * open `(string & {})` member so ad-hoc names still type-check while keeping
 * editor autocomplete for the known ones.
 *
 * Canonical definition — `@/services/booking-service/types` and
 * `booking.service.ts` re-export this. Superset of the two historical unions.
 * Keep in sync with `USED_SETUP_TABLES` in
 * `src/components/ir-translations-manager/used-setup-tables.ts`.
 */
export type TableEntries =
  | '_CALENDAR_BLOCKED_TILL'
  | '_DEPARTURE_TIME'
  | '_ARRIVAL_TIME'
  | '_RATE_PRICING_MODE'
  | '_BED_PREFERENCE_TYPE'
  | '_PAY_TYPE'
  | '_PAY_TYPE_GROUP'
  | '_PAY_METHOD'
  | '_AGENT_RATE_TYPE'
  | '_AGENT_TYPE'
  | '_TA_PAYMENT_METHOD'
  | '_VAT_INCLUDED'
  | '_CITY_TAX_INCLUDED'
  | '_SERVICE_CHARGE_INCLUDED'
  | '_TAXATION_STRATEGY'
  | '_SVC_CATEGORY'
  | '_CL_TX_TYPE'
  | '_FD_TYPE'
  | '_FD_STATUS'
  | '_CL_POST_TIMING'
  | '_GAP_RANGE'
  | '_GAP_RULE'
  | '_INVOICE_TARGET'
  | '_ID_TYPE'
  | '_USER_TYPE'
  | '_HK_FREQUENCY'
  | '_MEAL_TYPE'
  | '_HB_PREFERENCE'
  | (string & {});

/**
 * Setup entries grouped by table: the key is the lower-cased `TBL_NAME` with its
 * leading underscore stripped (`_PAY_TYPE` -> `pay_type`).
 */
export type GroupedTableEntries = {
  [K in TableEntries as K extends `_${infer Rest}` ? Lowercase<Rest> : never]: SetupEntries[];
};

/**
 * The `_PAY_TYPE` / `_PAY_TYPE_GROUP` / `_PAY_METHOD` setup tables, grouped for
 * the payment folio. Produced by {@link SetupService.getPaymentEntries}.
 */
export type PaymentEntries = {
  types: SetupEntries[];
  groups: SetupEntries[];
  methods: SetupEntries[];
};

/** Language codes that map to the `CODE_VALUE_*` columns on a setup entry. */
export type EntryLanguage = 'en' | 'ar' | 'de' | 'el' | 'fr' | 'he' | 'pl' | 'ru' | 'ua';

// ---------------------------------------------------------------------------
// Get_Distinct_Setup_Tables
// ---------------------------------------------------------------------------

// The API has been observed to return either plain table-name strings or row
// objects carrying a TBL_NAME field — normalized to string[] in the service.
export const DistinctSetupTableSchema = z.union([z.string(), z.object({ TBL_NAME: z.string() }).passthrough()]);
export const DistinctSetupTablesResponseSchema = z.array(DistinctSetupTableSchema);
export type DistinctSetupTablesResponse = z.infer<typeof DistinctSetupTablesResponseSchema>;

// ---------------------------------------------------------------------------
// Get_SetupEntry_By_Code
// ---------------------------------------------------------------------------

export const GetSetupEntryByCodeParamsSchema = z.object({
  TBL_NAME: z.string().min(1),
  CODE_NAME: z.string().min(1),
});
/** Params for fetching a single entry by its table + code. */
export type GetSetupEntryByCodeParams = z.infer<typeof GetSetupEntryByCodeParamsSchema>;

// ---------------------------------------------------------------------------
// Edit_Setup
// ---------------------------------------------------------------------------

export const EditSetupParamsSchema = z.object({
  // OWNER_ID: z.number(),
  TBL_NAME: z.string().min(1),
  CODE_NAME: z.string().min(1),

  // Administrative flags — default to a normal, fully-editable custom entry so
  // callers only need to override them when round-tripping an existing row's flags.
  ISSYSTEM: z.boolean().default(false),
  ISDELETEABLE: z.boolean().default(true),
  ISUPDATEABLE: z.boolean().default(true),
  ISVISIBLE: z.boolean().default(true),
  ISDELETED: z.boolean().default(false),
  DISPLAY_ORDER: z.number().optional().default(0),

  CODE_VALUE_EN: z.string().default(''),
  CODE_VALUE_FR: z.string().default(''),
  CODE_VALUE_AR: z.string().default(''),
  CODE_VALUE_RU: z.string().default(''),
  CODE_VALUE_EL: z.string().default(''),
  CODE_VALUE_HE: z.string().default(''),
  CODE_VALUE_PL: z.string().default(''),
  CODE_VALUE_DE: z.string().default(''),
  CODE_VALUE_UA: z.string().default(''),

  ENTRY_DATE: z.string(),
  // ENTRY_USER_ID: z.number().optional(),

  NOTES: z.string().default(''),
  INVARIANT_VALUE: z.string().nullable().default(null),
});
/** Payload for creating or updating a setup entry (translation key/value row). */
export type EditSetupParams = z.infer<typeof EditSetupParamsSchema>;

export const EditSetupManyParamsSchema = z.array(EditSetupParamsSchema);
export type EditSetupManyParams = z.infer<typeof EditSetupManyParamsSchema>;

export const ZExposedLanguageSchema = z.object({
  code: z.string(),
  culture: z.string(),
  description: z.string(),
  direction: z.string(),
  entries: z.null(),
  flag: z.string(),
  id: z.number(),
});
export type ExposedLanguage = z.infer<typeof ZExposedLanguageSchema>;

export const ZExposedLanguagesSchema = z.array(ZExposedLanguageSchema);
export type ExposedLanguages = z.infer<typeof ZExposedLanguagesSchema>;

/* -------------------------------------------------------------------------- */
/*                              Move Setup Entry                              */
/* -------------------------------------------------------------------------- */

export const MoveSetupEntryParamsSchema = z.object({
  old_tbl_name: z.string(),
  code_name: z.string(),
  new_tbl_name: z.string(),
});

export type MoveSetupEntryParams = z.infer<typeof MoveSetupEntryParamsSchema>;

/* -------------------------------------------------------------------------- */
/*                              Move Setup Entry                              */
/* -------------------------------------------------------------------------- */

export const MissingSetupEntriesParamsSchema = LanguageSchema;

export type MissingSetupEntriesParams = z.infer<typeof MissingSetupEntriesParamsSchema>;

/* -------------------------------------------------------------------------- */
/*                       Search Setup By Description                          */
/* -------------------------------------------------------------------------- */

export const ZSearchSetupByDescriptionParamsSchema = z.object({
  query: z.string(),
});

export type SearchSetupByDescriptionParams = z.infer<typeof ZSearchSetupByDescriptionParamsSchema>;

export const ZEntrySchema = z.object({
  CODE_NAME: z.string(),
  TBL_NAME: z.string(),
});

export const ZDuplicatedSetupEntriesAcrossTablesSchema = z.object({
  DESCRIPTION: z.string(),
  ENTRIES: z.array(ZEntrySchema),
  OCCURRENCES: z.number(),
});

export type Entry = z.infer<typeof ZEntrySchema>;

export type DuplicatedSetupEntriesAcrossTables = z.infer<typeof ZDuplicatedSetupEntriesAcrossTablesSchema>;
