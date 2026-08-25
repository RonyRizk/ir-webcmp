import { Occupancy } from '@/models/booking.dto';
import { BookingInvoiceInfo } from '../ir-invoice/types';
import { ExposedBookingByInvoicedStatus } from '@/services/property/types';

export interface UninvoicedBookingRow {
  booking_nbr: string;
  bookedAt: number;
  currencySymbol: string;
  totalGuestAmount: number;
  uninvoicedGuestAmount: number;
  totalGuests: number;
  raw: ExposedBookingByInvoicedStatus;
}

function calculateTotalPersons(booking: ExposedBookingByInvoicedStatus) {
  const sumOfOccupancy = ({ adult_nbr, children_nbr, infant_nbr }: Occupancy) => {
    return (adult_nbr ?? 0) + (children_nbr ?? 0) + (infant_nbr ?? 0);
  };
  return booking.rooms.reduce((prev, cur) => {
    return sumOfOccupancy(cur.occupancy) + prev;
  }, 0);
}

function getBookedAt(booking: ExposedBookingByInvoicedStatus) {
  const bookedOn = booking.booked_on;
  const date = bookedOn?.date ? new Date(`${bookedOn.date}T${String(bookedOn.hour ?? 0).padStart(2, '0')}:${String(bookedOn.minute ?? 0).padStart(2, '0')}:00`) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

function getGuestTotal(booking: ExposedBookingByInvoicedStatus) {
  return Number(booking.guest_financial?.gross_total ?? 0);
}

function calculateUnvoicedGuestAmount(invoiceInfo: BookingInvoiceInfo) {
  return invoiceInfo?.invoiceable_items.filter(item => item.is_invoiceable).reduce((sum, item) => sum + item.amount, 0) ?? 0;
}

export function mapBookingToUninvoicedRow(booking: ExposedBookingByInvoicedStatus): UninvoicedBookingRow {
  const totalGuestAmount = getGuestTotal(booking);

  return {
    booking_nbr: booking.booking_nbr,
    bookedAt: getBookedAt(booking),
    currencySymbol: booking.currency?.symbol ?? '$',
    totalGuestAmount,
    uninvoicedGuestAmount: calculateUnvoicedGuestAmount(booking.invoice_info),
    totalGuests: calculateTotalPersons(booking),
    raw: booking,
  };
}
