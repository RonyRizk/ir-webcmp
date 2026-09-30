import { z } from 'zod';
import { Occupancy } from '@/models/booking.dto';
import { RoomDetail } from '@/models/IBooking';
import { IFormattedLegendData } from '@/models/calendarData';
import { DateSchema, PropertyIdSchema, BookingNumberSchema } from '../commonSchemas';

export const AssignUnitParamsSchema = z.object({
  booking_nbr: BookingNumberSchema,
  identifier: z.string(),
  pr_id: z.number().int(),
  check_in: z.boolean(),
});
export type AssignUnitParams = z.infer<typeof AssignUnitParamsSchema>;

export const GetAggregatedUnAssignedRoomsByDateRangeParamsSchema = z.object({
  propertyid: PropertyIdSchema,
  from_date: DateSchema,
  to_date: DateSchema,
  language: z.string().optional().default('en'),
});
export type GetAggregatedUnAssignedRoomsByDateRangeParams = z.infer<typeof GetAggregatedUnAssignedRoomsByDateRangeParamsSchema>;

export interface UnassignedAssignableUnit {
  pr_id: number;
  name: string;
}

export interface UnassignedRoomEntry {
  room_identifier: string;
  booking_nbr: string;
  first_name: string | null;
  last_name: string | null;
  occupancy: Occupancy;
  from_date: string;
  to_date: string;
  assignable_units: UnassignedAssignableUnit[];
}

export interface UnassignedRoomTypeGroup {
  id: number;
  unassigned_rooms: UnassignedRoomEntry[];
}

export interface UnassignedDateEntry {
  date: string;
  room_types: UnassignedRoomTypeGroup[];
}

export type GetAggregatedUnAssignedRoomsByDateRangeResult = UnassignedDateEntry[];

/** One room type's unassigned rooms for a date, with the name resolved from `calendar_data.property.roomtypes`. */
export interface UnassignedCategory {
  roomTypeId: number;
  roomTypeName: string;
  rooms: UnassignedRoomEntry[];
}

/** What the calendar needs alongside a room entry to draw it on the grid. */
export interface CalendarEventContext {
  roomsInfo: RoomDetail[];
  legendData: IFormattedLegendData;
  roomTypeId: number;
  roomTypeName: string;
}

export interface IDefaultDateRange {
  /** `YYYY-MM-DD` */
  fromDate: string;
  /** `YYYY-MM-DD` */
  toDate: string;
  dateDifference: number;
}

/** Legacy grid shape — the fields `igl-cal-body` reads to draw a booking event. Only ever produced at the emit boundary. */
interface CalendarEventBase {
  ID: string;
  identifier: string;
  PR_ID: number;
  RT_ID: number;
  FROM_DATE: string;
  TO_DATE: string;
  NO_OF_DAYS: number;
  STATUS: string;
  NAME: string;
  legendData: IFormattedLegendData;
  roomsInfo: RoomDetail[];
  /** The true stay; `FROM_DATE`/`TO_DATE` are clamped to the loaded range and the grid skews the edges that were cut. */
  defaultDates: { from_date: string; to_date: string };
  defaultDateRange: IDefaultDateRange;
}

/** A unit the room could go to, shown as a ghost on the calendar while the room's card is highlighted. */
export interface CalendarUnitPreviewEvent extends CalendarEventBase {
  roomName: string;
  NOTES: string;
  BALANCE: string;
  INTERNAL_NOTE: string;
  hideBubble: boolean;
}

/** The room once a unit has been assigned, in the shape the calendar draws real bookings with. */
export interface CalendarAssignedEvent extends CalendarEventBase {
  BOOKING_NUMBER: string;
  occupancy: Occupancy;
  roomTypeName: string;
}
