import * as z from 'zod';

export const ParamsGetMealReportSchema = z.object({
  property_id: z.number(),
  report_type: z.enum(['GUEST_LIST', 'MEAL_COUNT']),
  from: z.string(),
  to: z.string(),
  meal_type_code: z.string().optional().nullable(),
  is_export_to_excel: z.boolean().optional().default(false),
});

export type ParamsGetMealReport = z.infer<typeof ParamsGetMealReportSchema>;

export const ParamsSetHBPreferenceSchema = z.object({
  property_id: z.number(),
  room_identifier: z.string(),
  code: z.string(),
});

export type ParamsSetHBPreference = z.infer<typeof ParamsSetHBPreferenceSchema>;

export interface MealGuestEntry {
  date: string;
  unit: { id: number; name: string };
  guest: { first_name: string; last_name: string };
  occupancy: { adult_nbr: number; children_nbr: number; infant_nbr: number };
  rate_plan: { name: string; short_name: string };
  source: { Label: string; Code: string }; // Based on Exposed_Source structure
  is_arriving_today: boolean;
  room_identifier: string;
  hb_preference_code: string;
  booking_nbr: string;
}

export interface MealCountDaySummary {
  Date: string;
  Breakfast_Ad: number;
  Breakfast_Ch: number;
  Lunch_Ad: number;
  Lunch_Ch: number;
  Dinner_Ad: number;
  Dinner_Ch: number;
}

export interface GetMealReportResult {
  Guest_List: MealGuestEntry[];
  Meal_Count_Summary: MealCountDaySummary[];
}
