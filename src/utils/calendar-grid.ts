import { DayData } from '@/models/DayType';

/**
 * Fixed calendar grid dimensions, in pixels.
 * Must stay in sync with the literal values in igl-cal-body.css (.cellData, .roomHeaderCell)
 * and igl-cal-header.css (.headerCell, .topLeftCell).
 */
export const CELL_WIDTH = 58;
export const CELL_HEIGHT = 30;
export const ROOM_HEADER_WIDTH = 170;
export const CATEGORY_HEADER_HEIGHT = 40;
export const EVENT_SPACE = 8;

/** Height of a booking bar. Must stay in sync with the `height` igl-booking-event renders. */
export const EVENT_HEIGHT = 20;

/**
 * Re-exported so the calendar's existing call sites keep working. The canonical
 * implementation is app-wide and lives in `src/utils/direction.ts`.
 */
export { isRtlDirection } from './direction';

/**
 * Date → column index, built once per `days` array. Every booking bar looks its start column up on
 * each render, so a linear scan made a full calendar render O(bars × days).
 *
 * Keyed on array identity: the calendar always replaces `calendar_dates.days` with a new array rather
 * than reordering it in place, which is what keeps a cached index valid.
 */
const dayIndexCache = new WeakMap<DayData[], Map<string, number>>();

export function getDayIndex(days: DayData[], dateValue: string): number {
  let index = dayIndexCache.get(days);
  if (!index) {
    index = new Map(days.map((day, i) => [day.value, i]));
    dayIndexCache.set(days, index);
  }
  return index.get(dateValue) ?? -1;
}

export function getTotalGridWidth(dayCount: number): number {
  return ROOM_HEADER_WIDTH + dayCount * CELL_WIDTH;
}

/**
 * Converts a chronological (day-0-first) left offset into a physical `left` value.
 * In RTL locales the day timeline visually mirrors (day 0 renders at the right edge),
 * so the physical position is the reflection of the logical one across the grid width.
 */
export function toPhysicalLeft(logicalLeft: number, width: number, isRtl: boolean, totalGridWidth: number): number {
  return isRtl ? totalGridWidth - logicalLeft - width : logicalLeft;
}

/**
 * Inverse of `toPhysicalLeft`. A reflection is its own inverse, so this is the same computation -
 * it exists so call sites converting the other way read as what they actually mean.
 */
export function toLogicalLeft(physicalLeft: number, width: number, isRtl: boolean, totalGridWidth: number): number {
  return toPhysicalLeft(physicalLeft, width, isRtl, totalGridWidth);
}

/**
 * Vertical offset of a booking bar inside its room row, centring the bar in the row.
 *
 * Pass the row's measured height where it is known; rows are `CELL_HEIGHT` tall, but a measured
 * value keeps the bar centred rather than merely 5px down if that ever stops being true.
 */
export function getEventTopWithinRow(rowHeight: number = CELL_HEIGHT): number {
  return (rowHeight - EVENT_HEIGHT) / 2;
}

/**
 * Distance from a day column's start edge to where a bar beginning on that day rests.
 *
 * Check-in is midday, so a booking bar starts half a cell into its first day rather than on the
 * column boundary - which is why a bar reads as centred on the cell it starts in.
 */
export function getEventLeftWithinDay(startsAfterWindowOpen: boolean, eventSpace: number = EVENT_SPACE): number {
  return (startsAfterWindowOpen ? 0 : CELL_WIDTH / 2) + eventSpace / 2;
}

/**
 * Snaps a freely dragged bar's physical `left` onto the day grid, so it always sits exactly where
 * a booking starting on that day would render.
 *
 * The snap happens in chronological space and is mirrored back, so the bar lands on the same day
 * in RTL as it would in LTR rather than on the reflection of it.
 */
export function snapEventLeft({
  physicalLeft,
  width,
  isRtl,
  totalGridWidth,
  startsAfterWindowOpen,
  eventSpace = EVENT_SPACE,
}: {
  physicalLeft: number;
  width: number;
  isRtl: boolean;
  totalGridWidth: number;
  startsAfterWindowOpen: boolean;
  eventSpace?: number;
}): number {
  const withinDay = getEventLeftWithinDay(startsAfterWindowOpen, eventSpace);
  const logicalLeft = toLogicalLeft(physicalLeft, width, isRtl, totalGridWidth);
  const dayIndex = Math.round((logicalLeft - ROOM_HEADER_WIDTH - withinDay) / CELL_WIDTH);
  const snappedLogicalLeft = ROOM_HEADER_WIDTH + dayIndex * CELL_WIDTH + withinDay;
  return toPhysicalLeft(snappedLogicalLeft, width, isRtl, totalGridWidth);
}

export interface EventHorizontalGeometry {
  left: number;
  width: number;
}

/**
 * Computes a booking bar's chronological (LTR-oriented) left offset and width, purely from
 * data - no DOM measurement. Mirrors the pixel math the previous DOM-measurement-based
 * implementation produced, including the half-cell adjustment applied when a booking's
 * FROM_DATE lands on or before the loaded window's nominal start date.
 */
export function computeEventHorizontalGeometry({
  days,
  fromDate,
  stayDays,
  startsAfterWindowOpen,
  eventSpace = EVENT_SPACE,
}: {
  days: DayData[];
  fromDate: string;
  stayDays: number;
  startsAfterWindowOpen: boolean;
  eventSpace?: number;
}): EventHorizontalGeometry {
  const dayIndex = Math.max(getDayIndex(days, fromDate), 0);
  const left = ROOM_HEADER_WIDTH + dayIndex * CELL_WIDTH + getEventLeftWithinDay(startsAfterWindowOpen, eventSpace);
  const width = (stayDays + (startsAfterWindowOpen ? 0.5 : 0)) * CELL_WIDTH - eventSpace;
  return { left, width };
}
