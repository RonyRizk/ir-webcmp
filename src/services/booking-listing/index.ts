import { Booking } from '@/models/booking.dto';
import booking_listing, { initializeUserSelection } from '@/stores/booking_listing.store';
import { extras, isPrivilegedUser } from '@/utils/utils';
import axios from 'axios';
import {
  ExposedBookingsHeader,
  ExposedBookingsParams,
  ExposedBookingsParamsSchema,
  GetExposedBookingsCriteriaParams,
  GetExposedBookingsCriteriaParamsSchema,
  GetExposedBookingsOptions,
  IExposedBookingsCriteria,
  RemoveExposedBookingParams,
  RemoveExposedBookingParamsSchema,
} from './types';

export * from './types';

export class BookingListingService {
  /**
   * Fetches the bookings criteria without touching the booking listing store.
   */
  public async fetchExposedBookingsCriteria(params: GetExposedBookingsCriteriaParams): Promise<IExposedBookingsCriteria> {
    const payload = GetExposedBookingsCriteriaParamsSchema.parse(params);
    const { data } = await axios.post(`/Get_Exposed_Bookings_Criteria`, payload);
    return data.My_Result;
  }

  public async getExposedBookingsCriteria(params: GetExposedBookingsCriteriaParams): Promise<IExposedBookingsCriteria> {
    const result = await this.fetchExposedBookingsCriteria(params);
    booking_listing.channels = result.channels;
    booking_listing.settlement_methods = result.settlement_methods;
    booking_listing.statuses = result.statuses;
    booking_listing.types = result.types;
    booking_listing.balance_filter = result.balance_filter;
    initializeUserSelection();
    return result;
  }

  /** Returns the fetched bookings only when `options.skipStore` is set; otherwise writes them to the booking listing store. */
  public async getExposedBookings(params: ExposedBookingsParams, options?: GetExposedBookingsOptions): Promise<Booking[] | undefined> {
    const { property_id, userTypeCode, channel, property_ids, ...rest } = ExposedBookingsParamsSchema.parse(params);
    const havePrivilege = isPrivilegedUser(userTypeCode);
    const { data } = await axios.post(`/Get_Exposed_Bookings`, {
      ...rest,
      extras,
      property_id: havePrivilege ? undefined : property_id,
      property_ids: havePrivilege ? property_ids : null,
      channel: havePrivilege ? '' : channel,
    });
    const result: Booking[] = data.My_Result;
    const header: ExposedBookingsHeader = data.My_Params_Get_Exposed_Bookings;
    if (options?.skipStore) {
      return result;
    }
    if (options?.append) {
      booking_listing.bookings = [...booking_listing.bookings, ...result].map(b => ({ ...b, rooms: b.rooms ?? [] }));
    } else {
      booking_listing.bookings = [...result].map(b => ({ ...b, rooms: b.rooms ?? [] }));
    }
    booking_listing.userSelection = {
      ...booking_listing.userSelection,
      total_count: header.total_count,
    };
    booking_listing.download_url = header.exported_data_url;
  }

  public async removeExposedBooking(params: RemoveExposedBookingParams): Promise<void> {
    const payload = RemoveExposedBookingParamsSchema.parse(params);
    await axios.post(`/Remove_Exposed_Booking`, payload);
  }
}
