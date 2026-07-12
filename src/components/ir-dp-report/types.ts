import { DpReportBooking } from '@/services/dp-report/types';

export interface DpReportRow {
  booking_nbr: string;
  date: string;
  currencySymbol: string;
  /** DP_INITIAL_ACCOMODATION_GROSS — the actual gross accommodation amount charged (dynamic price). */
  accommodationGross: number;
  /** DP_OPTIM_BASE_GROSS — what the accommodation would have grossed at the optimal base rate. */
  optimBaseGross: number;
  /** DP_INVENTORY_BASE_GROSS — the inventory (direct booking) base gross reference. */
  inventoryBaseGross: number;
  /** Server-computed profit (see BOOKING_PROPERTIES.md for the formula). */
  profit: number;
  raw: DpReportBooking;
}

function getExtraValue(booking: DpReportBooking, key: string): number {
  const found = booking.extras?.find(e => e.key === key);
  const num = Number(found?.value);
  return Number.isFinite(num) ? num : 0;
}

export function mapBookingToDpRow(booking: DpReportBooking): DpReportRow {
  return {
    booking_nbr: booking.booking_nbr,
    date: booking.booked_on?.date ?? booking.from_date,
    currencySymbol: booking.currency?.symbol ?? '$',
    accommodationGross: getExtraValue(booking, 'DP_INITIAL_ACCOMODATION_GROSS'),
    optimBaseGross: getExtraValue(booking, 'DP_OPTIM_BASE_GROSS'),
    inventoryBaseGross: getExtraValue(booking, 'DP_INVENTORY_BASE_GROSS'),
    profit: booking.profit,
    raw: booking,
  };
}
