import { countRooms, DASHBOARD_PAGE_SIZE, filterInHouse, sumUnits } from '@/components/ir-dashboard/dashboard.helpers';
import type { Booking } from '@/models/booking.dto';
import { BookingService } from '@/services/booking-service/booking.service';
import { BookingListingService } from '@/services/booking-listing';
import { PropertyService } from '@/services/property';
import type { ExposedBookingsParams } from '@/services/booking-listing';
import calendar_data from '@/stores/calendar-data';
import type { DashboardDayParams, DashboardPerformance, DashboardUnits } from './types';

export * from './types';

/**
 * Data source for the dashboard widgets. Each method covers one day (`params.date`).
 */
export class DashboardService {
  private bookingService = new BookingService();
  private bookingListingService = new BookingListingService();
  private propertyService = new PropertyService();

  public async getDayPerformance({ property_id, date }: DashboardDayParams): Promise<DashboardPerformance> {
    const { DailyStats } = await this.propertyService.getMonthlyStats({ property_id, from_date: date, to_date: date });
    const day = DailyStats?.[0];
    return {
      occupancy: day?.Occupancy ?? 0,
      bookedUnits: day?.Units_booked ?? 0,
      roomRevenue: day?.Rooms_Revenue ?? 0,
      adr: day?.ADR ?? 0,
    };
  }

  public async getUnitsSummary({ property_id, date, language }: DashboardDayParams): Promise<DashboardUnits> {
    const days = await this.bookingService.fetchExposedCalendarDays({ propertyid: property_id, from_date: date, to_date: date, language });
    const day = days.find(d => d.value === date) ?? days[0];
    // The property's room types flag the virtual ones and the inactive units too, in case the calendar leaves the flags out.
    const roomTypes = calendar_data.property?.roomtypes ?? [];
    const virtualIds = new Set(roomTypes.filter(rt => rt.is_virtual).map(rt => rt.id));
    const inactiveUnitIds = new Set(
      roomTypes
        .flatMap(rt => rt.physicalrooms ?? [])
        .filter(unit => unit.is_active === false)
        .map(unit => unit.id),
    );
    return sumUnits(day?.room_types ?? [], date, { virtualIds, inactiveUnitIds });
  }

  /** Rooms checked in whose stay covers `date`. */
  public async getInHouse({ property_id, date, language }: DashboardDayParams): Promise<Booking[]> {
    const bookings = await this.getExposedBookings(property_id, date, { filter_type: '5', booking_status: '002', language });
    return filterInHouse(bookings, date);
  }

  /** Bookings arriving on `date`, for properties without the front desk (the PMS uses Get_Rooms_To_Check_In). */
  public async getArrivals({ property_id, date, language }: DashboardDayParams): Promise<Booking[]> {
    return this.getExposedBookings(property_id, date, { filter_type: '2', booking_status: '002', language });
  }

  /** Bookings departing on `date`, for properties without the front desk (the PMS uses Get_Rooms_To_Check_Out). */
  public async getDepartures({ property_id, date, language }: DashboardDayParams): Promise<Booking[]> {
    return this.getExposedBookings(property_id, date, { filter_type: '3', booking_status: '002', language });
  }

  /** Bookings created on `date`. */
  public async getNewBookings({ property_id, date, language }: DashboardDayParams): Promise<Booking[]> {
    return this.getExposedBookings(property_id, date, { filter_type: '1', booking_status: '', language });
  }

  /**
   * Units (rooms) in bookings made on `date` that still await confirmation.
   * Only meaningful when the property's booking criteria list the pending status (001).
   */
  public async getPendingUnits({ property_id, date, language }: DashboardDayParams): Promise<number> {
    const bookings = await this.getExposedBookings(property_id, date, { filter_type: '1', booking_status: '001', language });
    return countRooms(bookings);
  }

  /** Bookings cancelled (deleted) on `date`. */
  public async getCancellations({ property_id, date }: DashboardDayParams): Promise<Booking[]> {
    const bookings = await this.propertyService.getDeletedBookings({ property_id, date });
    return (bookings ?? []).map(b => ({ ...b, rooms: b.rooms ?? [] }));
  }

  private async getExposedBookings(property_id: number, date: string, filters: Pick<ExposedBookingsParams, 'filter_type' | 'booking_status' | 'language'>): Promise<Booking[]> {
    const result: Booking[] = await this.bookingListingService.getExposedBookings(
      {
        property_id,
        from: date,
        to: date,
        balance_filter: '0',
        start_row: 0,
        end_row: DASHBOARD_PAGE_SIZE,
        total_count: 0,
        name: '',
        book_nbr: '',
        affiliate_id: 0,
        is_mpo_managed: false,
        is_mpo_used: false,
        is_for_mobile: false,
        is_combined_view: false,
        is_to_export: false,
        channel: '',
        ...filters,
      },
      { skipStore: true },
    );
    return (result ?? []).map(b => ({ ...b, rooms: b.rooms ?? [] }));
  }
}
