import { dateDifference, dateToFormattedString } from '@/utils/utils';
import { formatName } from '@/utils/booking';
import { getRoomTypeName } from '@/stores/calendar-data';
import calendar_dates from '@/stores/calendar-dates.store';
import {
  CalendarAssignedEvent,
  CalendarEventContext,
  CalendarUnitPreviewEvent,
  IDefaultDateRange,
  UnassignedCategory,
  UnassignedRoomEntry,
  UnassignedRoomTypeGroup,
} from './types';

/** The API identifies room types by id only; the name comes from the property's cached room-type map. */
export function groupIntoCategories(roomTypes: UnassignedRoomTypeGroup[]): UnassignedCategory[] {
  return roomTypes.map(group => ({
    roomTypeId: group.id,
    roomTypeName: getRoomTypeName(group.id),
    rooms: group.unassigned_rooms,
  }));
}

export function guestName(room: UnassignedRoomEntry): string {
  return formatName(room.first_name, room.last_name);
}

function toDateRange(from: string, to: string, nights: number): IDefaultDateRange {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  return {
    fromDate,
    toDate,
    fromDateStr: dateToFormattedString(fromDate),
    toDateStr: dateToFormattedString(toDate),
    fromDateTimeStamp: fromDate.getTime(),
    toDateTimeStamp: toDate.getTime(),
    dateDifference: nights,
  };
}

/** Trims a stay to the calendar's loaded days — the grid has no cells outside `calendar_dates.fromDate..toDate`. */
export function clampToLoadedRange(from: string, to: string): { from: string; to: string; nights: number } {
  const { fromDate, toDate } = calendar_dates;
  // ISO date strings compare correctly as plain strings.
  const start = fromDate && fromDate > from ? fromDate : from;
  const end = toDate && toDate < to ? toDate : to;
  return { from: start, to: end, nights: dateDifference(start, end) };
}

/** One ghost event per unit the room can be assigned to. Every unit is assumed valid for the room's whole `from`→`to` span — the API carries no per-unit window. */
export function toCalendarPreviewEvents(room: UnassignedRoomEntry, ctx: CalendarEventContext): CalendarUnitPreviewEvent[] {
  const { from, to, nights } = clampToLoadedRange(room.from_date, room.to_date);
  return (room.assignable_units ?? []).map(unit => ({
    ID: 'NEW_TEMP_EVENT',
    identifier: room.room_identifier,
    PR_ID: unit.pr_id,
    RT_ID: ctx.roomTypeId,
    roomName: unit.name,
    FROM_DATE: from,
    TO_DATE: to,
    NO_OF_DAYS: nights,
    STATUS: 'PENDING-CONFIRMATION',
    NAME: '',
    NOTES: '',
    BALANCE: '',
    INTERNAL_NOTE: '',
    hideBubble: true,
    legendData: ctx.legendData,
    roomsInfo: ctx.roomsInfo,
    defaultDates: { from_date: room.from_date, to_date: room.to_date },
    defaultDateRange: toDateRange(from, to, nights),
  }));
}

export function toCalendarAssignedEvent(room: UnassignedRoomEntry, prId: number, ctx: CalendarEventContext): CalendarAssignedEvent {
  const { from, to, nights } = clampToLoadedRange(room.from_date, room.to_date);
  return {
    ID: room.room_identifier,
    identifier: room.room_identifier,
    PR_ID: prId,
    RT_ID: ctx.roomTypeId,
    roomTypeName: ctx.roomTypeName,
    BOOKING_NUMBER: room.booking_nbr,
    NAME: guestName(room),
    occupancy: room.occupancy,
    FROM_DATE: from,
    TO_DATE: to,
    NO_OF_DAYS: nights,
    STATUS: 'IN-HOUSE',
    legendData: ctx.legendData,
    roomsInfo: ctx.roomsInfo,
    defaultDates: { from_date: room.from_date, to_date: room.to_date },
    defaultDateRange: toDateRange(from, to, nights),
  };
}
