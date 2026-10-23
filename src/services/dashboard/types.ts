import type { Booking } from '@/models/booking.dto';
import type { ISODate } from '@/utils/calendar-dates';

/** The day's occupancy, booked units and room-revenue KPIs, from `Get_Monthly_Stats` for a one-day range. */
export interface DashboardPerformance {
  /** Occupancy percentage (0–100). */
  occupancy: number;
  bookedUnits: number;
  roomRevenue: number;
  adr: number;
}

/**
 * The day's unit breakdown from `Get_Exposed_Calendar`, across every room type. Booked units come from
 * `DashboardPerformance` instead. Available and total are summed from `exposed_inventory`; the V4 calendar
 * only returns `rts`, so `total` is `undefined` when no room type carries it (the stats panel shows it as 0).
 */
export interface DashboardUnits {
  /** Units still sellable (`rts`). */
  available: number;
  /** Units blocked with status 004, counted from their calendar cells. */
  outOfService?: number;
  /** Units blocked with status 002 or 003, counted from their calendar cells. */
  blocked?: number;
  total?: number;
}

export interface DashboardDayParams {
  property_id: number;
  date: ISODate;
}

export type DashboardBookingList = Booking[];
