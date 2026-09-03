import { ZIEntrySchema } from '@/models/IBooking';
import * as z from 'zod';

// ---------------------------------------------------------------------------
// Shared entry shape
// ---------------------------------------------------------------------------

export { ZIEntrySchema };
/** A single labeled setup row (one translated string across all supported languages). */
export type SetupEntry = z.infer<typeof ZIEntrySchema>;

// ---------------------------------------------------------------------------
// Get_Setup_Entries_By_TBL_NAME
// ---------------------------------------------------------------------------

export const GetSetupEntriesByTblNameParamsSchema = z.object({
  TBL_NAME: z.string().min(1),
});
/** Params for fetching every entry belonging to one setup table. */
export type GetSetupEntriesByTblNameParams = z.infer<typeof GetSetupEntriesByTblNameParamsSchema>;

// ---------------------------------------------------------------------------
// Get_Setup_Entries_By_TBL_NAME_Multi
// ---------------------------------------------------------------------------

export const GetSetupEntriesByTblNameMultiParamsSchema = z.object({
  TBL_NAMES: z.array(z.string().min(1)),
});
/** Params for fetching entries across several setup tables in one call. */
export type GetSetupEntriesByTblNameMultiParams = z.infer<typeof GetSetupEntriesByTblNameMultiParamsSchema>;

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

export const MissingSetupEntriesParamsSchema = z.object({
  language: z.string(),
});

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
