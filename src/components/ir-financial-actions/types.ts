import { Booking } from '@/models/booking.dto';
import { Payment } from '../ir-booking-details/types';

export type SidebarOpenEvent =
  | {
      type: 'booking';
      payload: {
        bookingNumber: number;
      };
    }
  | {
      type: 'payment';
      payload: {
        payment: Payment;
        bookingNumber: number;
        booking: Booking;
      };
    };
export type DailyFinancialActionsFilter = {
  date: string;
  sourceCode: string;
};
