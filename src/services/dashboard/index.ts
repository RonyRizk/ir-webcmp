import { countRooms, DASHBOARD_PAGE_SIZE, filterInHouse, sumUnits } from '@/components/ir-dashboard/dashboard.helpers';
import type { Booking } from '@/models/booking.dto';
import { BookingService } from '@/services/booking-service/booking.service';
import { BookingListingService } from '@/services/booking_listing.service';
import { PropertyService } from '@/services/property';
import type { ExposedBookingsParams } from '@/stores/booking_listing.store';
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

  public async getUnitsSummary({ property_id, date }: DashboardDayParams): Promise<DashboardUnits> {
    const days = await this.bookingService.fetchExposedCalendarDays(property_id, date, date);
    const day = days.find(d => d.value === date) ?? days[0];
    return sumUnits(day?.room_types ?? [], date);
  }

  /** Rooms checked in whose stay covers `date`. */
  public async getInHouse({ property_id, date }: DashboardDayParams): Promise<Booking[]> {
    const bookings = await this.getExposedBookings(property_id, date, { filter_type: '5', booking_status: '002' });
    return filterInHouse(bookings, date);
  }

  /** Bookings arriving on `date`, for properties without the front desk (the PMS uses Get_Rooms_To_Check_In). */
  public async getArrivals({ property_id, date }: DashboardDayParams): Promise<Booking[]> {
    return this.getExposedBookings(property_id, date, { filter_type: '2', booking_status: '002' });
  }

  /** Bookings departing on `date`, for properties without the front desk (the PMS uses Get_Rooms_To_Check_Out). */
  public async getDepartures({ property_id, date }: DashboardDayParams): Promise<Booking[]> {
    return this.getExposedBookings(property_id, date, { filter_type: '3', booking_status: '002' });
  }

  /** Bookings created on `date`. */
  public async getNewBookings({ property_id, date }: DashboardDayParams): Promise<Booking[]> {
    return this.getExposedBookings(property_id, date, { filter_type: '1', booking_status: '' });
  }

  /**
   * Units (rooms) in bookings made on `date` that still await confirmation.
   * Only meaningful when the property's booking criteria list the pending status (001).
   */
  public async getPendingUnits({ property_id, date }: DashboardDayParams): Promise<number> {
    const bookings = await this.getExposedBookings(property_id, date, { filter_type: '1', booking_status: '001' });
    return countRooms(bookings);
  }

  /** Bookings cancelled (deleted) on `date`. */
  public async getCancellations({ property_id, date }: DashboardDayParams): Promise<Booking[]> {
    const bookings = await this.propertyService.getDeletedBookings({ property_id, date });
    return (bookings ?? []).map(b => ({ ...b, rooms: b.rooms ?? [] }));
  }

  private async getExposedBookings(property_id: number, date: string, filters: Pick<ExposedBookingsParams, 'filter_type' | 'booking_status'>): Promise<Booking[]> {
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
