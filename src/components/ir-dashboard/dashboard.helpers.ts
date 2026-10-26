import { ROOM_IN_OUT, type Booking, type Room } from '@/models/booking.dto';
import type { CalendarCellType, CellType } from '@/models/IBooking';
import type { RoomType } from '@/models/property';
import type { DashboardOccupancy, DashboardUnits, OccupancyFigure } from '@/services/dashboard/types';
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

/** A calendar day's unit: its id, active flag and half-day cells. */
export type CalendarDayUnit = { id?: number; is_active?: boolean; calendar_cell?: CalendarCellType | null };

/** A calendar day's room type: its active flag, exposed inventory and each unit's half-day cells. */
export type CalendarDayRoomType = Pick<RoomType, 'exposed_inventory' | 'is_active'> & Partial<Pick<RoomType, 'id' | 'is_virtual'>> & { physicalrooms?: CalendarDayUnit[] | null };

/**
 * What the property's own room types say about the calendar's, for a calendar that leaves the flags out:
 * the virtual room types' ids and the inactive units' ids.
 */
export type PropertyFlags = { virtualIds?: ReadonlySet<number>; inactiveUnitIds?: ReadonlySet<number> };

/** The room types the dashboard counts: only active ones (`is_active` true). */
const activeRoomTypes = <T extends Pick<RoomType, 'is_active'>>(roomTypes: T[]): T[] => (roomTypes ?? []).filter(rt => rt.is_active);

/** The units the dashboard counts: only active ones — not flagged `is_active` false by the calendar or the property. */
const activeUnits = (roomType: CalendarDayRoomType, { inactiveUnitIds }: PropertyFlags = {}): CalendarDayUnit[] =>
  (roomType.physicalrooms ?? []).filter(unit => unit.is_active !== false && !(unit.id != null && inactiveUnitIds?.has(unit.id)));

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
 * Counts the units blocked on `date` across every active unit of every active room type, each unit once: out of service
 * (status 004) and blocked (the other block statuses, 002 and 003).
 */
export function countBlockedUnits(roomTypes: CalendarDayRoomType[], date: ISODate, flags?: PropertyFlags): Pick<DashboardUnits, 'outOfService' | 'blocked'> {
  let outOfService = 0;
  let blocked = 0;
  for (const unit of activeRoomTypes(roomTypes).flatMap(rt => activeUnits(rt, flags))) {
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
 * Whether a unit is booked for the night of `date`: an unavailable half-day cell that isn't a block and whose room's stay
 * covers that night (the departure day doesn't count).
 */
function isBookedOn(cell: CalendarCellType | null | undefined, date: ISODate): boolean {
  return [cell?.right_cell, cell?.left_cell].some(half => {
    if (half?.Is_Available !== false || isBlockUnit(half.STAY_STATUS_CODE)) {
      return false;
    }
    const from_date = half.room?.from_date;
    const to_date = half.room?.to_date;
    return !!from_date && !!to_date && from_date <= date && date < to_date;
  });
}

/**
 * A room type's booked and total units. The total is its active units — never `exposed_inventory.total`, which counts
 * inactive ones too. Booked is the inventory's count, else counted from the active units' cells.
 */
function roomTypeOccupancy(roomType: CalendarDayRoomType, date: ISODate, flags?: PropertyFlags): Pick<OccupancyFigure, 'booked' | 'total'> {
  const inventory = roomType.exposed_inventory ?? {};
  const units = activeUnits(roomType, flags);
  return {
    booked: typeof inventory.booked === 'number' ? inventory.booked : units.filter(unit => isBookedOn(unit.calendar_cell, date)).length,
    total: units.length,
  };
}

function occupancyOf(roomTypes: CalendarDayRoomType[], date: ISODate, flags?: PropertyFlags): OccupancyFigure {
  let booked = 0;
  let total = 0;
  for (const roomType of roomTypes) {
    const figure = roomTypeOccupancy(roomType, date, flags);
    booked += figure.booked;
    total += figure.total;
  }
  return { booked, total, percent: total > 0 ? (booked / total) * 100 : 0 };
}

/**
 * The day's occupancy across the active units of active room types, real and virtual apart. A room type is virtual when the
 * calendar flags it (`is_virtual`) or its id is in `flags.virtualIds`. `virtual` is `undefined` when no room type is virtual.
 */
export function computeOccupancy(roomTypes: CalendarDayRoomType[], date: ISODate, flags: PropertyFlags = {}): DashboardOccupancy {
  const active = activeRoomTypes(roomTypes);
  const isVirtual = (rt: CalendarDayRoomType) => rt.is_virtual ?? (rt.id != null && !!flags.virtualIds?.has(rt.id));
  const virtual = active.filter(isVirtual);
  return {
    real: occupancyOf(
      active.filter(rt => !isVirtual(rt)),
      date,
      flags,
    ),
    virtual: virtual.length ? occupancyOf(virtual, date, flags) : undefined,
  };
}

/**
 * The day's unit breakdown across active room types: available and total units summed from the calendar's per-room-type `exposed_inventory`
 * (a count no room type returns stays `undefined` rather than reading as 0), out of service and blocked counted from the active units' cells,
 * and the occupancy of real and virtual room types (see `computeOccupancy`).
 */
export function sumUnits(roomTypes: CalendarDayRoomType[], date: ISODate, flags?: PropertyFlags): DashboardUnits {
  const active = activeRoomTypes(roomTypes);
  const inventories = active.map(rt => rt.exposed_inventory).filter(Boolean);
  const sum = (field: string) => (inventories.some(inv => typeof inv[field] === 'number') ? inventories.reduce((total, inv) => total + (inv[field] ?? 0), 0) : undefined);
  return {
    available: sum('rts') ?? 0,
    ...countBlockedUnits(active, date, flags),
    total: sum('total'),
    occupancy: computeOccupancy(active, date, flags),
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
