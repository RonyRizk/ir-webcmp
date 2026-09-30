export interface MonthInfo {
  monthName: string;
  daysCount: number;
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
