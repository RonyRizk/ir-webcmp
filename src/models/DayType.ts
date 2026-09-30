import { RoomType } from './property';

export interface DayData {
  dayDisplayName: string;
  tobeAssignedCount?: number | undefined;
  rate: RoomType[];
  unassigned_units_nbr: number;
  occupancy: number;
  /** The day's only identity: `YYYY-MM-DD`, as returned by the API. */
  value: string;
}
