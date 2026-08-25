export interface MonthInfo {
  monthName: string;
  daysCount: number;
}

/** One entry of `calendarData.days` — a single date column in the header timeline. */
export interface DayInfo {
  day: string;
  value: any;
  dayDisplayName: string;
  occupancy: number;
  unassigned_units_nbr: number;
  currentDate: any;
  [key: string]: any;
}

export interface RoomListItem {
  id: number;
  name: string;
}
