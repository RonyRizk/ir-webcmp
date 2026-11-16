import { BookingNumberSchema, DateSchema, LanguageSchema, PropertyIdSchema } from '@/services/commonSchemas';
import * as z from 'zod';

// ---------------------------------------------------------------------------
// Exposed bookings criteria (Get_Exposed_Bookings_Criteria)
// ---------------------------------------------------------------------------

export const GetExposedBookingsCriteriaParamsSchema = LanguageSchema.extend({
  // null for privileged users (criteria across all properties)
  property_id: PropertyIdSchema.nullable(),
});
/** Request params for `Get_Exposed_Bookings_Criteria`. */
export type GetExposedBookingsCriteriaParams = z.infer<typeof GetExposedBookingsCriteriaParamsSchema>;

export const CriteriaChannelSchema = z.object({
  is_direct: z.boolean(),
  name: z.string(),
  value: z.string(),
});
/** Booking channel available as a listing filter. */
export type ICriteriaChannel = z.infer<typeof CriteriaChannelSchema>;

const CriteriaIdentifierSchema = z.object({
  code: z.string(),
  name: z.string(),
});

export const SettlementMethodSchema = CriteriaIdentifierSchema;
/** Settlement method available as a listing filter. */
export type ISettlementMethods = z.infer<typeof SettlementMethodSchema>;

export const CriteriaStatusSchema = CriteriaIdentifierSchema;
/** Booking status available as a listing filter. */
export type ICriteriaStatuses = z.infer<typeof CriteriaStatusSchema>;

export const CriteriaTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
});
/** Date filter type (e.g. booking date, arrival date). */
export type ICriteriaTypes = z.infer<typeof CriteriaTypeSchema>;

export const BalanceFilterSchema = z.object({
  name: z.string(),
  value: z.string(),
});
/** Balance filter option. */
export type BalanceFilter = z.infer<typeof BalanceFilterSchema>;

export const ExposedBookingsCriteriaSchema = z.object({
  channels: z.array(CriteriaChannelSchema),
  settlement_methods: z.array(SettlementMethodSchema),
  statuses: z.array(CriteriaStatusSchema),
  types: z.array(CriteriaTypeSchema),
  balance_filter: z.array(BalanceFilterSchema),
});
/** Filter criteria returned by `Get_Exposed_Bookings_Criteria`. */
export type IExposedBookingsCriteria = z.infer<typeof ExposedBookingsCriteriaSchema>;

// ---------------------------------------------------------------------------
// Exposed bookings (Get_Exposed_Bookings)
// ---------------------------------------------------------------------------

export const ExposedBookingsParamsSchema = LanguageSchema.extend({
  channel: z.string(),

  // These are null in your initialState, so allow nulls
  property_id: PropertyIdSchema.nullable(),
  balance_filter: z.string().nullable(),
  filter_type: z.union([z.number(), z.string()]).nullable(),

  // null when searching by name / booking number regardless of dates (ir-pms-search)
  from: DateSchema.nullable(),
  to: DateSchema.nullable(),

  name: z.string().nullable(),
  book_nbr: BookingNumberSchema.nullable(),
  booking_status: z.string(),
  userTypeCode: z.number().optional(),

  // In the interface these were literal 0/false, but you treat them like values.
  affiliate_id: z.number().int().default(0),
  is_mpo_managed: z.boolean().default(false),
  is_mpo_used: z.boolean().default(false),
  is_for_mobile: z.boolean().default(false),
  is_combined_view: z.boolean().default(false),

  start_row: z.number().int(),
  end_row: z.number().int(),
  total_count: z.number().int(),

  is_to_export: z.boolean(),

  property_ids: z.array(PropertyIdSchema).nullable().optional(),
});
/** Request params / user selection for `Get_Exposed_Bookings`. */
export type ExposedBookingsParams = z.infer<typeof ExposedBookingsParamsSchema>;

export const GetExposedBookingsOptionsSchema = z.object({
  /** Append results to the stored bookings instead of replacing them (infinite scroll). */
  append: z.boolean().optional(),
  /** Return the results without touching the booking listing store. */
  skipStore: z.boolean().optional(),
});
/** Client-side options controlling how fetched bookings are stored. */
export type GetExposedBookingsOptions = z.infer<typeof GetExposedBookingsOptionsSchema>;

export const ExposedBookingsHeaderSchema = z.object({
  total_count: z.number(),
  exported_data_url: z.string().nullable(),
});
/** `My_Params_Get_Exposed_Bookings` response header. */
export type ExposedBookingsHeader = z.infer<typeof ExposedBookingsHeaderSchema>;

// ---------------------------------------------------------------------------
// Remove exposed booking (Remove_Exposed_Booking)
// ---------------------------------------------------------------------------

export const RemoveExposedBookingParamsSchema = z.object({
  booking_nbr: BookingNumberSchema,
  is_to_revover: z.boolean(),
});
/** Request params for `Remove_Exposed_Booking`. */
export type RemoveExposedBookingParams = z.infer<typeof RemoveExposedBookingParamsSchema>;
