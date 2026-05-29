import { z } from 'zod';

export const GHS_Candidate_Property_Schema = z.object({
  AC_ID: z.number(),
  NAME: z.string(),
  aname: z.string(),
  level2: z.string().nullable().optional(),
  COUNTRY_ID: z.number(),
});

export type GHS_Candidate_Property = z.infer<typeof GHS_Candidate_Property_Schema>;

export const Params_Get_GHS_Candidate_Properties_Schema = z.object({
  COUNTRY_ID: z.number().nullable().optional(),
});

export type Params_Get_GHS_Candidate_Properties = z.infer<typeof Params_Get_GHS_Candidate_Properties_Schema>;

export const Params_Generate_GHS_Listing_For_Selection_Schema = z.object({
  Selected_AC_IDs: z.array(z.number()),
});

export type Params_Generate_GHS_Listing_For_Selection = z.infer<typeof Params_Generate_GHS_Listing_For_Selection_Schema>;
