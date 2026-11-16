export interface MonthInfo {
  monthName: string;
  daysCount: number;
  /** ISO (`YYYY-MM-DD`) date of this month's first day, used to derive a Hijri month label without reformatting the backend's Gregorian `monthName`. */
  firstDayValue?: string;
}

/** One entry of `calendarData.days` — a single date column in the header timeline. */
export interface DayInfo {
  /** `YYYY-MM-DD` — the column's only identity. */
  value: string;
  dayDisplayName: string;
  occupancy: number;
  unassigned_units_nbr: number;
  [key: string]: any;
}

export interface RoomListItem {
  id: number;
  name: string;
}
