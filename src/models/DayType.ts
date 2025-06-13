import { RoomType } from './property';

export interface DayData {
  day: string;
  dayDisplayName: string;
  currentDate: number;
  tobeAssignedCount?: number | undefined;
  rate: RoomType[];
  unassigned_units_nbr: number;
  occupancy: number;
  value: string;
}
