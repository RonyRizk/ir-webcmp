import moment from 'moment';
import { z } from 'zod';

export type FetchedProperty = {
  A_NAME: string;
  COUNTRY_CODE: string;
  COUNTRY_NAME: string;
  PROPERTY_ID: number;
  PROPERTY_NAME: string;
};
export type LinkedProperty = { name: string; property_id: number; token: string };
export type CountrySalesParams = {
  AC_ID: number;
  WINDOW: number;
  FROM_DATE: string;
  TO_DATE: string;
  BOOK_CASE: string;
  is_export_to_excel: boolean;
};
export type DailyRevenueReportParams = {
  from_date: string;
  to_date: string;
  property_id: string;
  is_export_to_excel: boolean;
};
export type MonthlyStatsParams = {
  property_id: number;
  from_date: string;
  to_date: string;
  is_export_to_excel?: boolean;
};
export interface MonthlyStatsResults {
  AverageOccupancy: number;
  DailyStats: DailyStat[];
  ExcelLink: null;
  PeakDays: PeakDay[];
  Occupancy_Difference_From_Previous_Month: number;
  TotalUnitsBooked: number;
  Total_Guests: number;
}
export const SetPropertyCalendarExtraParamsSchema = z.object({
  property_id: z.number(),
  value: z.string(),
});
export type SetPropertyCalendarExtraParams = z.infer<typeof SetPropertyCalendarExtraParamsSchema>;

export interface PeakDay {
  Date: string;
  OccupancyPercent: number;
}

export interface DailyStat {
  Date: string;
  Occupancy: number;
  Units_booked: number;
  Rooms_Revenue: number;
  ADR: number;
  Total_Guests: number | undefined;
}
export const AllowedPropertiesSchema = z.array(z.object({ id: z.number(), name: z.string() })).nullable();

export type AllowedProperties = z.infer<typeof AllowedPropertiesSchema>;

export const SetRoomCalendarExtraParamsSchema = z.object({
  property_id: z.number(),
  room_identifier: z.string(),
  value: z.string(),
});
export type SetRoomCalendarExtraParams = z.infer<typeof SetRoomCalendarExtraParamsSchema>;
export const FetchNotificationsParamsSchema = z.object({
  property_id: z.coerce.number(),
});
export const FetchNotificationsResultSchema = z.array(z.object({ message: z.string(), type: z.enum(['financial', 'availability_alert']) }));
export type FetchNotificationsResult = z.infer<typeof FetchNotificationsResultSchema>;

export const ExposedRectifierParamsSchema = z.object({
  property_id: z.coerce.number(),
  room_type_ids: z.array(z.number()).min(1),
  from: z.string().refine(date => {
    const _date = moment(date, 'YYYY-MM-DD');
    if (!moment.isMoment(_date)) {
      return false;
    }
    return true;
  }),
  to: z.string().refine(date => {
    const _date = moment(date, 'YYYY-MM-DD');
    if (!moment.isMoment(_date)) {
      return false;
    }
    return true;
  }),
});
export type ExposedRectifierParams = z.infer<typeof ExposedRectifierParamsSchema>;

export const FetchUnBookableRoomsSchema = z.object({
  property_ids: z.array(z.number()),
  period_to_check: z.coerce.number(),
  consecutive_period: z.coerce.number(),
});
export type FetchUnBookableRooms = z.infer<typeof FetchUnBookableRoomsSchema>;

export type FetchUnBookableRoomsResult = {
  first_night_not_bookable: string;
  property_id: number;
  room_type_id: number;
  room_type_name: string;
  total_room_types_nbr: number;
  aname: string;
  country: {
    cities: null;
    code: null;
    currency: null;
    flag: null;
    gmt_offset: number;
    id: number;
    market_places: null;
    name: string;
    phone_prefix: null;
  };
}[];

export const CategorySchema = z.object({
  code: z.string(),
  description: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;

export const taxationModes = {
  INCLUSIVE: '001',
  EXCLUSIVE: '000',
  NOT_APPLICABLE: '002',
};

export const TaxCategorySchema = z.object({
  category: CategorySchema,
  taxation_mode: CategorySchema,
  pct: z.number(),
  property_id: z.number().optional(),
});
export type TaxCategory = z.infer<typeof TaxCategorySchema>;

export const HandleExposedPropertyTaxCategoriesParamsSchema = z.object({
  property_id: z.number(),
  VAT_INCLUDED_CODE: z.string(),
  VAT_PC: z.number(),
  CITY_TAX_INCLUDED_CODE: z.string(),
  CITY_TAX_PCT: z.number(),
  SERVICE_CHARGE_INCLUDED_CODE: z.string(),
  SERVICE_CHARGE_PCT: z.number(),
  tax_categories: z.array(TaxCategorySchema),
  TAXATION_STRATEGY: z.string(),
});
export type HandleExposedPropertyTaxCategoriesParams = z.infer<typeof HandleExposedPropertyTaxCategoriesParamsSchema>;
export const SetPropertyGapConfigParamsSchema = z.object({
  property_id: z.number(),
  gap_rule_code: z.string(),
  gap_lookahead_days: z.number(),
});

export type SetPropertyGapConfigParams = z.infer<typeof SetPropertyGapConfigParamsSchema>;
export const GetUnifiedFolioParamsSchema = z.object({
  property_id: z.number().int(),

  from_date: z.string().date().nullable(),

  to_date: z.string().date().nullable(),

  target_type: z.string().nullable(),

  doc_type: z.string().nullable(),

  fd_type_code: z.string().nullable(),

  doc_number: z.string().nullable(),

  agent_id: z.string().optional().nullable().default(null),

  guest_id: z.string().optional().nullable().default(null),

  booking_number: z.string().nullable(),

  page_index: z.number().int().nonnegative(),

  page_size: z.number().int().positive(),

  o_Total_Rows: z.number().int().nullable(),

  is_export_to_excel: z.boolean(),

  Link_excel: z.string(),
});
export type GetUnifiedFolioParams = z.infer<typeof GetUnifiedFolioParamsSchema>;

// A unified folio row can be tied either to an agent account or to a guest.
export const UnifiedFolioTargetTypeSchema = z.enum(['AGENT', 'GUEST']);
export type UnifiedFolioTargetType = z.infer<typeof UnifiedFolioTargetTypeSchema>;

export const UnifiedFolioRecordSchema = z.object({
  TARGET_TYPE: UnifiedFolioTargetTypeSchema,

  AGENT_ID: z.number().nullable().optional(),
  AGENT_NAME: z.string().nullable().optional(),

  GUEST_ID: z.number().nullable().optional(),
  GUEST_NAME: z.string().nullable().optional(),
  GUEST_EMAIL: z.string().nullable().optional(),

  BOOKING_ID: z.number().nullable().optional(),
  BOOKING_NUMBER: z.string().nullable().optional(),

  DOC_ID: z.number().nullable().optional(),
  DOC_NUMBER: z.string().nullable().optional(),
  DOC_DATE: z.string().nullable().optional(),
  DOC_TYPE: z.string().nullable().optional(),

  FD_TYPE_CODE: z.string().nullable().optional(),

  CURRENCY_ID: z.number().nullable().optional(),

  TOTAL_AMOUNT: z.number().nullable().optional(),
  CREDIT: z.number().nullable().optional(),
  DEBIT: z.number().nullable().optional(),
  NET_AMOUNT: z.number().nullable().optional(),
  TAX_AMOUNT: z.number().nullable().optional(),
});
export type UnifiedFolioRecord = z.infer<typeof UnifiedFolioRecordSchema>;

export const GetUnifiedFolioResultSchema = z.array(UnifiedFolioRecordSchema);
export type GetUnifiedFolioResult = z.infer<typeof GetUnifiedFolioResultSchema>;

/** Paginated unified-folio response: the current page of rows plus the total count. */
export interface GetUnifiedFolioResponse {
  rows: GetUnifiedFolioResult;
  total: number;
}

export const PrintGuestFolioDocParamsSchema = z.object({
  property_id: z.number(),
  booking_nbr: z.string(),
  mode: z.string(),
  reference: z.string(),
  extras: z.string().optional(),
});
export type PrintGuestFolioDocParams = z.infer<typeof PrintGuestFolioDocParamsSchema>;
