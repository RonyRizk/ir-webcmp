import { ROOM_IN_OUT, type Booking, type Room } from '@/models/booking.dto';
import type { CalendarCellType, CellType } from '@/models/IBooking';
import type { RoomType } from '@/models/property';
import type { DashboardUnits } from '@/services/dashboard/types';
import type { RealtimeEventMap } from '@/services/realtime/types';
import type { ISODate } from '@/utils/calendar-dates';
import { isBlockUnit } from '@/utils/utils';

/** How many days either side of today the dashboard's day picker reaches. */
export const MAX_DAY_OFFSET = 2;

/**
 * Page size the dashboard requests. Card counts are computed from the loaded page,
 * so it's large enough to hold a normal property's arrivals / departures for one day.
 */
export const DASHBOARD_PAGE_SIZE = 100;

/** Quiet time after the last day change before the day is fetched, so stepping through several days only loads the last. */
export const DATE_CHANGE_DEBOUNCE_MS = 300;

/** Booking status of a cancelled booking. */
const CANCELLED_STATUS_CODE = '003';

/** Block status the calendar flags as out of service (`OUT_OF_SERVICE` in utils/booking). */
const OUT_OF_SERVICE_CODE = '004';

const roomsOf = (bookings: Booking[]): Room[] => (bookings ?? []).flatMap(b => b.rooms ?? []);

/**
 * Rooms still waiting to check in by `date` (arriving that day or overdue, as Get_Rooms_To_Check_In returns them)
 * that have no unit assigned yet — counted per room, not per booking.
 */
export function countUnassignedArrivals(bookings: Booking[], date: ISODate): number {
  return roomsOf(bookings).filter(room => !room.unit && room.from_date <= date && (room.in_out?.code ?? ROOM_IN_OUT.IDLE) === ROOM_IN_OUT.IDLE).length;
}

/**
 * Rooms whose arrival day is before `date` and that still aren't checked in — the rows the arrivals table marks overdue.
 * `date` is the dashboard's selected day, which the table also measures overdue against (the store's day), so the card agrees with it.
 */
export function countOverdueArrivals(bookings: Booking[], date: ISODate): number {
  return roomsOf(bookings).filter(room => room.from_date < date && (room.in_out?.code ?? ROOM_IN_OUT.IDLE) === ROOM_IN_OUT.IDLE).length;
}

/** Rooms whose departure day is before `date` (the selected day) and that are still checked in — the rows the departures table marks overdue. */
export function countOverdueDepartures(bookings: Booking[], date: ISODate): number {
  return roomsOf(bookings).filter(room => room.to_date < date && room.in_out?.code === ROOM_IN_OUT.CHECKIN).length;
}

/** Units arriving on `date` — counted per room, not per booking. Non-PMS properties count these instead of the rooms to check in. */
export function countArrivingUnits(bookings: Booking[], date: ISODate): number {
  return roomsOf(bookings).filter(room => room.from_date === date).length;
}

/** Units departing on `date` — counted per room, not per booking. */
export function countDepartingUnits(bookings: Booking[], date: ISODate): number {
  return roomsOf(bookings).filter(room => room.to_date === date).length;
}

/** Whether a booking status change cancels a booking whose stay covers `date`, arrival and departure days included. */
export function isCancellationOn({ status_code, from_date, to_date }: RealtimeEventMap['CHANGE_IN_BOOK_STATUS'], date: ISODate): boolean {
  return status_code === CANCELLED_STATUS_CODE && !!from_date && !!to_date && from_date <= date && date <= to_date;
}

/** Rooms across all bookings — the in-house card counts rooms, not bookings. */
export function countRooms(bookings: Booking[]): number {
  return roomsOf(bookings).length;
}

/** Adults, children and infants across all rooms — the in-house card's Ad-Ch-In line. */
export function sumOccupancy(bookings: Booking[]): { adults: number; children: number; infants: number } {
  return roomsOf(bookings).reduce(
    (total, room) => ({
      adults: total.adults + (room.occupancy?.adult_nbr ?? 0),
      children: total.children + (room.occupancy?.children_nbr ?? 0),
      infants: total.infants + (room.occupancy?.infant_nbr ?? 0),
    }),
    { adults: 0, children: 0, infants: 0 },
  );
}

/**
 * Keeps only the rooms that are checked in (`in_out` 001) and whose stay covers `date`, departure day included
 * (a departing guest stays in-house until checked out). Bookings left with no such room are dropped.
 */
export function filterInHouse(bookings: Booking[], date: ISODate): Booking[] {
  return (bookings ?? []).flatMap(booking => {
    const rooms = (booking.rooms ?? []).filter(room => room.in_out?.code === ROOM_IN_OUT.CHECKIN && room.from_date <= date && date <= room.to_date);
    return rooms.length ? [{ ...booking, rooms }] : [];
  });
}

/** A calendar day's room type: its active flag, exposed inventory and each unit's half-day cells. */
export type CalendarDayRoomType = Pick<RoomType, 'exposed_inventory' | 'is_active'> & { physicalrooms?: { calendar_cell?: CalendarCellType | null }[] | null };

/** The room types the dashboard counts: only active ones (`is_active` true). */
const activeRoomTypes = <T extends Pick<RoomType, 'is_active'>>(roomTypes: T[]): T[] => (roomTypes ?? []).filter(rt => rt.is_active);

/**
 * The block holding a unit on `date`, detected like the calendar does (`getMyBookings` in utils/booking): an unavailable
 * half-day cell whose stay status is a block code. Only a block covering the night of `date` counts, so one that ended
 * this morning doesn't (a same-day block, from = to, does).
 */
function blockOn(cell: CalendarCellType | null | undefined, date: ISODate): CellType | undefined {
  return [cell?.right_cell, cell?.left_cell].find(half => {
    if (half?.Is_Available !== false || !isBlockUnit(half.STAY_STATUS_CODE)) {
      return false;
    }
    const { from_date, to_date } = half.My_Block_Info ?? {};
    return from_date <= date && (date < to_date || from_date === to_date);
  });
}

/**
 * Counts the units blocked on `date` across every active room type, each unit once: out of service (status 004) and blocked
 * (the other block statuses, 002 and 003).
 */
export function countBlockedUnits(roomTypes: CalendarDayRoomType[], date: ISODate): Pick<DashboardUnits, 'outOfService' | 'blocked'> {
  let outOfService = 0;
  let blocked = 0;
  for (const unit of activeRoomTypes(roomTypes).flatMap(rt => rt.physicalrooms ?? [])) {
    const block = blockOn(unit.calendar_cell, date);
    if (!block) {
      continue;
    }
    if (block.STAY_STATUS_CODE === OUT_OF_SERVICE_CODE) {
      outOfService++;
    } else {
      blocked++;
    }
  }
  return { outOfService, blocked };
}

/**
 * The day's unit breakdown across active room types: available and total units summed from the calendar's per-room-type `exposed_inventory`
 * (a count no room type returns stays `undefined` rather than reading as 0), out of service and blocked counted from the units' cells.
 */
export function sumUnits(roomTypes: CalendarDayRoomType[], date: ISODate): DashboardUnits {
  const active = activeRoomTypes(roomTypes);
  const inventories = active.map(rt => rt.exposed_inventory).filter(Boolean);
  const sum = (field: string) => (inventories.some(inv => typeof inv[field] === 'number') ? inventories.reduce((total, inv) => total + (inv[field] ?? 0), 0) : undefined);
  return {
    available: sum('rts') ?? 0,
    ...countBlockedUnits(active, date),
    total: sum('total'),
  };
}

/** Revenue per available room = ADR × occupancy. */
export function computeRevPar(adr: number, occupancyPercent: number): number {
  return (adr * occupancyPercent) / 100;
}

/** Whole-number count for the cards and tabs; empty for a missing value. */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

/** `value` is a percentage (0–100), not a ratio; empty for a missing value. */
export function formatPercent(value: number | null | undefined, options?: Intl.NumberFormatOptions): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 0, ...options }).format(value / 100);
}
