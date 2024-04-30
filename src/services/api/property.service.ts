import { TExposedBookingAvailability } from '@/components/ir-booking-engine/ir-booking-page/ir-availibility-header/availability';
import { MissingTokenError, Token } from '@/models/Token';
import { DataStructure } from '@/models/common';
import { TPickupFormData } from '@/models/pickup';
import { ISetupEntries } from '@/models/property';
import app_store from '@/stores/app.store';
import booking_store, { IRatePlanSelection } from '@/stores/booking';
import { checkout_store, updateUserFormData } from '@/stores/checkout.store';
import { getDateDifference } from '@/utils/utils';
import axios from 'axios';
import { addDays, format } from 'date-fns';

export class PropertyService extends Token {
  public async getExposedProperty(params: { id: number; language: string }) {
    const token = this.getToken();
    if (!token) {
      throw new MissingTokenError();
    }
    const { data } = await axios.post(`/Get_Exposed_Property?Ticket=${token}`, params);
    const result = data as DataStructure;
    if (result.ExceptionMsg !== '') {
      throw new Error(result.ExceptionMsg);
    }
    if (!app_store.fetchedBooking) {
      booking_store.roomTypes = [...result.My_Result.roomtypes];
    }
    app_store.property = { ...result.My_Result };
    return result.My_Result;
  }
  public async getExposedBookingAvailability(params: TExposedBookingAvailability) {
    const token = this.getToken();
    if (!token) {
      throw new MissingTokenError();
    }
    const { data } = await axios.post(`/Get_Exposed_Booking_Availability?Ticket=${token}`, params);
    const result = data as DataStructure;
    if (result.ExceptionMsg !== '') {
      throw new Error(result.ExceptionMsg);
    }

    booking_store.roomTypes = [...result.My_Result.roomtypes];

    booking_store.tax_statement = { message: result.My_Result.tax_statement };
    booking_store.enableBooking = true;
    return result;
  }
  public async fetchSetupEntries(): Promise<ISetupEntries> {
    try {
      const token = this.getToken();
      if (token) {
        if (app_store.setup_entries) {
          return app_store.setup_entries;
        }
        const { data } = await axios.post(`/Get_Setup_Entries_By_TBL_NAME_MULTI?Ticket=${token}`, {
          TBL_NAMES: ['_ARRIVAL_TIME', '_RATE_PRICING_MODE', '_BED_PREFERENCE_TYPE'],
        });
        if (data.ExceptionMsg !== '') {
          throw new Error(data.ExceptionMsg);
        }
        const res: any[] = data.My_Result;
        const setupEntries = {
          arrivalTime: res.filter(e => e.TBL_NAME === '_ARRIVAL_TIME'),
          ratePricingMode: res.filter(e => e.TBL_NAME === '_RATE_PRICING_MODE'),
          bedPreferenceType: res.filter(e => e.TBL_NAME === '_BED_PREFERENCE_TYPE'),
        };
        app_store.setup_entries = setupEntries;
        updateUserFormData('arrival_time', setupEntries.arrivalTime[0].CODE_NAME);
        return setupEntries;
      }
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }
  private generateDays(from_date: Date, to_date: Date, amount: number) {
    const endDate = to_date;
    let currentDate = from_date;
    const days: {
      date: string;
      amount: number;
      cost: null;
    }[] = [];

    while (currentDate < endDate) {
      days.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        amount: amount,
        cost: null,
      });
      currentDate = addDays(currentDate, 1);
    }
    return days;
  }

  public filterRooms() {
    let rooms = [];
    Object.values(booking_store.ratePlanSelections).map(rt => {
      Object.values(rt).map((rp: IRatePlanSelection) => {
        if (rp.reserved > 0) {
          [...new Array(rp.reserved)].map((_, index) => {
            rooms.push({
              identifier: null,
              roomtype: rp.roomtype,
              rateplan: rp.ratePlan,
              unit: null,
              smoking_option: rp.checkoutSmokingSelection[index],
              occupancy: {
                adult_nbr: rp.checkoutVariations[index].adult_nbr,
                children_nbr: rp.checkoutVariations[index].child_nbr,
                infant_nbr: null,
              },
              bed_preference: rp.is_bed_configuration_enabled ? rp.checkoutBedSelection[index] : null,
              from_date: format(booking_store.bookingAvailabilityParams.from_date, 'yyyy-MM-dd'),
              to_date: format(booking_store.bookingAvailabilityParams.to_date, 'yyyy-MM-dd'),
              notes: null,
              days: this.generateDays(
                booking_store.bookingAvailabilityParams.from_date,
                booking_store.bookingAvailabilityParams.to_date,
                +rp.checkoutVariations[index].amount / getDateDifference(booking_store.bookingAvailabilityParams.from_date, booking_store.bookingAvailabilityParams.to_date),
              ),
              guest: {
                email: null,
                first_name: checkout_store.userFormData?.bookingForSomeoneElse
                  ? rp.guestName[index]
                  : (checkout_store.userFormData?.firstName || '') + ' ' + (checkout_store.userFormData?.lastName || ''),
                last_name: null,
                country_id: null,
                city: null,
                mobile: null,
                address: null,
                dob: null,
                subscribe_to_news_letter: null,
              },
            });
          });
        }
      });
    });
    return rooms;
  }
  private convertPickup(pickup: TPickupFormData) {
    let res: any = {};
    const [hour, minute] = pickup.arrival_time.split(':');
    res = {
      booking_nbr: null,
      is_remove: false,
      currency: pickup.currency,
      date: pickup.arrival_date,
      details: pickup.flight_details || null,
      hour: Number(hour),
      minute: Number(minute),
      nbr_of_units: pickup.number_of_vehicles,
      selected_option: pickup.selected_option,
      total: Number(pickup.due_upon_booking),
    };
    return res;
  }
  public async bookUser() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new MissingTokenError();
      }
      let guest: any = {
        email: checkout_store.userFormData.email,
        first_name: checkout_store.userFormData.firstName,
        last_name: checkout_store.userFormData.lastName,
        country_id: checkout_store.userFormData.country_id,
        city: null,
        mobile: checkout_store.userFormData.country_code + checkout_store.userFormData.mobile_number,
        address: '',
        dob: null,
        subscribe_to_news_letter: true,
        cci: null,
      };
      const body = {
        assign_units: false,
        check_in: false,
        is_pms: false,
        is_direct: true,
        agent: booking_store.bookingAvailabilityParams.agent ? { id: booking_store.bookingAvailabilityParams.agent } : null,
        is_in_loyalty_mode: booking_store.bookingAvailabilityParams.loyalty,
        promo_key: booking_store.bookingAvailabilityParams.coupon ?? null,
        booking: {
          booking_nbr: '',
          from_date: format(booking_store.bookingAvailabilityParams.from_date, 'yyyy-MM-dd'),
          to_date: format(booking_store.bookingAvailabilityParams.to_date, 'yyyy-MM-dd'),
          remark: checkout_store.userFormData.message || null,
          property: {
            id: app_store.app_data.property_id,
          },
          source: null,
          referrer_site: 'www.igloorooms.com',
          currency: app_store.property.currency,
          arrival: { code: checkout_store.userFormData.arrival_time },
          guest,
          rooms: this.filterRooms(),
        },
        pickup_info: checkout_store.pickup.location ? this.convertPickup(checkout_store.pickup) : null,
      };
      const { data } = await axios.post(`/DoReservation?Ticket=${token}`, body);
      if (data.ExceptionMsg !== '') {
        throw new Error(data.ExceptionMsg);
      }
      return data['My_Result'];
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }
}
