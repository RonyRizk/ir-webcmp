import type { Booking } from '@/models/booking.dto';
import { BookingService } from '@/services/booking-service/booking.service';
import { DashboardService } from '@/services/dashboard';
import { arrivalsStore, initializeArrivalsStore, setArrivalsReferenceDate, setArrivalsTotal } from '@/stores/arrivals.store';
import calendar_data from '@/stores/calendar-data';
import { departuresStore, initializeDeparturesStore, setDepartureTotal, setDeparturesPage, setDeparturesReferenceDate } from '@/stores/departures.store';
import type { ISODate } from '@/utils/calendar-dates';

export { DASHBOARD_PAGE_SIZE } from './dashboard.helpers';

/*
 * Loaders for the dashboard panels backed by existing endpoints. They write into the same global
 * stores `ir-arrivals-table` / `ir-departures-table` render from, so the root (date change, refresh)
 * and the departures panel (after a check-out) share one code path.
 *
 * Properties with the front desk read the PMS endpoints (Get_Rooms_To_Check_In / Out); those without
 * read Get_Exposed_Bookings filtered by arrival / departure date.
 *
 * `ready` lets the request go out before `calendar_data.property` has loaded: the store initialisers
 * (canCheckIn / canCheckout) read it, so the response is only stored once `ready` settles.
 */

const bookingService = new BookingService();
const dashboardService = new DashboardService();

/**
 * Whether the property uses the front desk. Known only once the property has loaded, so the first load
 * of a property waits on `ready` before choosing an endpoint; later loads decide straight away.
 */
async function isFrontDesk(ready?: Promise<unknown>): Promise<boolean> {
  if (!calendar_data.property) {
    await ready;
  }
  return calendar_data.property ? !!calendar_data.property.is_frontdesk_enabled : true;
}

async function fetchArrivals(propertyId: number, date: ISODate, ready?: Promise<unknown>): Promise<{ bookings: Booking[]; total_count: number }> {
  if (await isFrontDesk(ready)) {
    return bookingService.getRoomsToCheckIn({
      property_id: propertyId?.toString(),
      check_in_date: date,
      page_index: arrivalsStore.pagination.currentPage,
      page_size: arrivalsStore.pagination.pageSize,
    });
  }
  // The dashboard hides pagination, so the loaded page is the total.
  const bookings = await dashboardService.getArrivals({ property_id: propertyId, date });
  return { bookings, total_count: bookings.length };
}

async function fetchDepartures(propertyId: number, date: ISODate, ready?: Promise<unknown>): Promise<{ bookings: Booking[]; total_count: number }> {
  if (await isFrontDesk(ready)) {
    return bookingService.getRoomsToCheckout({
      property_id: propertyId?.toString(),
      check_out_date: date,
      page_index: departuresStore.pagination.currentPage,
      page_size: departuresStore.pagination.pageSize,
    });
  }
  const bookings = await dashboardService.getDepartures({ property_id: propertyId, date });
  return { bookings, total_count: bookings.length };
}

export async function loadArrivals(propertyId: number, date: ISODate, ready?: Promise<unknown>): Promise<void> {
  if (arrivalsStore.today !== date) {
    setArrivalsReferenceDate(date);
  }
  const { bookings, total_count } = await fetchArrivals(propertyId, date, ready);
  await ready;
  // A newer day was requested while this one was in flight.
  if (arrivalsStore.today !== date) {
    return;
  }
  setArrivalsTotal(total_count ?? 0);
  initializeArrivalsStore(bookings);
}

export async function loadDepartures(propertyId: number, date: ISODate, ready?: Promise<unknown>): Promise<void> {
  if (departuresStore.today !== date) {
    // Unlike the arrivals setter, the departures one keeps the current page.
    setDeparturesReferenceDate(date);
    setDeparturesPage(1);
  }
  const { bookings, total_count } = await fetchDepartures(propertyId, date, ready);
  await ready;
  if (departuresStore.today !== date) {
    return;
  }
  setDepartureTotal(total_count ?? 0);
  initializeDeparturesStore(bookings);
}
