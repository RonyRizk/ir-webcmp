import { z } from 'zod';
import { DateSchema, PropertyIdSchema } from '../commonSchemas';

export const GetDPBookingsReportParamsSchema = z.object({
  from_date: DateSchema,
  to_date: DateSchema,
  property_id: PropertyIdSchema,
});

export type GetDPBookingsReportParams = z.infer<typeof GetDPBookingsReportParamsSchema>;

export interface DpReport {
  bookings: DpReportBooking[];
  summary: DpReportSummary;
}

export type DpReportSummary = {
  avg_gain: number;
  avg_loss: number;
  bookings_above_base: number;
  bookings_below_base: number;
  total_bookings: number;
  total_profit: number;
};

export interface DpReportBooking {
  booked_on: BookedOn;
  booking_nbr: string;
  currency: Currency;
  extras: Extra[];
  from_date: string;
  guest: Guest;
  origin: Origin;
  profit: number;
  rooms_length: number;
  to_date: string;
}

export interface Origin {
  Icon: string;
  Label: string;
}

export interface Guest {
  email: string;
  first_name: string;
  id: number;
  last_name: string;
}

export interface Extra {
  key: string;
  value: string;
}

export interface Currency {
  id: number;
  ref: string;
  symbol: string;
}

export interface BookedOn {
  date: string;
  hour: number;
  minute: number;
}
