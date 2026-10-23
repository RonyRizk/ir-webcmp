const mockBookingService = { getRoomsToCheckIn: jest.fn(), getRoomsToCheckout: jest.fn() };
const mockDashboardService = { getArrivals: jest.fn(), getDepartures: jest.fn() };

// The real services pull in axios (ESM), which this jest setup can't parse.
jest.mock('../../../services/booking-service/booking.service', () => ({ BookingService: jest.fn(() => mockBookingService) }));
jest.mock('../../../services/dashboard', () => ({ DashboardService: jest.fn(() => mockDashboardService) }));

import { arrivalsStore } from '../../../stores/arrivals.store';
import calendar_data from '../../../stores/calendar-data';
import { departuresStore } from '../../../stores/departures.store';
import { loadArrivals, loadDepartures } from '../dashboard.data';

const DATE = '2026-10-19';
const booking = (from_date: string, to_date: string) => ({ booking_nbr: '1', rooms: [{ identifier: 'r1', from_date, to_date, in_out: { code: '000' } }] }) as any;

describe('dashboard.data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBookingService.getRoomsToCheckIn.mockResolvedValue({ bookings: [], total_count: 0 });
    mockBookingService.getRoomsToCheckout.mockResolvedValue({ bookings: [], total_count: 0 });
    mockDashboardService.getArrivals.mockResolvedValue([booking(DATE, '2026-10-21')]);
    mockDashboardService.getDepartures.mockResolvedValue([booking('2026-10-17', DATE)]);
  });

  describe('without the front desk', () => {
    beforeEach(() => {
      calendar_data.property = { id: 42, is_frontdesk_enabled: false } as any;
    });

    it('loads arrivals from Get_Exposed_Bookings', async () => {
      await loadArrivals(42, DATE);
      expect(mockDashboardService.getArrivals).toHaveBeenCalledWith({ property_id: 42, date: DATE });
      expect(mockBookingService.getRoomsToCheckIn).not.toHaveBeenCalled();
      expect(arrivalsStore.bookings).toHaveLength(1);
      expect(arrivalsStore.pagination.total).toBe(1);
    });

    it('loads departures from Get_Exposed_Bookings', async () => {
      await loadDepartures(42, DATE);
      expect(mockDashboardService.getDepartures).toHaveBeenCalledWith({ property_id: 42, date: DATE });
      expect(mockBookingService.getRoomsToCheckout).not.toHaveBeenCalled();
      expect(departuresStore.bookings).toHaveLength(1);
    });
  });

  describe('with the front desk', () => {
    beforeEach(() => {
      calendar_data.property = { id: 42, is_frontdesk_enabled: true } as any;
    });

    it('loads arrivals and departures from the PMS endpoints', async () => {
      await loadArrivals(42, DATE);
      await loadDepartures(42, DATE);
      expect(mockBookingService.getRoomsToCheckIn).toHaveBeenCalledWith(expect.objectContaining({ property_id: '42', check_in_date: DATE }));
      expect(mockBookingService.getRoomsToCheckout).toHaveBeenCalledWith(expect.objectContaining({ property_id: '42', check_out_date: DATE }));
      expect(mockDashboardService.getArrivals).not.toHaveBeenCalled();
      expect(mockDashboardService.getDepartures).not.toHaveBeenCalled();
    });
  });

  it('waits for the property before choosing an endpoint', async () => {
    calendar_data.property = null;
    const ready = Promise.resolve().then(() => (calendar_data.property = { id: 42, is_frontdesk_enabled: false } as any));
    await loadArrivals(42, DATE, ready);
    expect(mockDashboardService.getArrivals).toHaveBeenCalled();
    expect(mockBookingService.getRoomsToCheckIn).not.toHaveBeenCalled();
  });
});
