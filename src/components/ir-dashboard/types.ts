export type DashboardTab = 'arrivals' | 'departures' | 'inHouse' | 'bookings' | 'cancellations';

export interface DashboardCounts {
  /** Bookings with arrivals to check in on the selected date (same set as the arrivals table, across all pages). */
  arrivals: number;
  /** Units (rooms) among those arrivals with no unit assigned yet. */
  unassignedArrivals: number;
  /** Arriving units whose arrival day has passed and that still aren't checked in. */
  overdueArrivals: number;
  /** Units (rooms) departing on the selected date. */
  departures: number;
  /** Units still checked in after their departure day. */
  overdueDepartures: number;
  inHouse: number;
  /** Adults, children and infants across the in-house rooms (the card's Ad-Ch-In line). */
  inHouseGuests: { adults: number; children: number; infants: number };
  bookings: number;
  cancellations: number;
}

/** Emitted by the departures panel when an early check-out must be handled inside booking details. */
export interface CheckoutRedirectEvent {
  bookingNumber: number;
  identifier: string;
}

/** How tightly the desktop rail's cards are drawn: `spacious` on tall rails, `regular`, then `compact` and `tight` as it gets shorter. */
export type RailDensity = 'spacious' | 'regular' | 'compact' | 'tight';
