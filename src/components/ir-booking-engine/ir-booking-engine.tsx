import { CommonService } from '@/services/api/common.service';
import { PropertyService } from '@/services/api/property.service';
import { Component, Listen, Prop, State, Watch, h } from '@stencil/core';
import { format, Locale } from 'date-fns';
import { ICurrency, IExposedLanguages } from '@/models/common';
import axios from 'axios';
import { Variation } from '@/models/property';
import booking_store, { updateRoomParams } from '@/stores/booking';
import app_store from '@/stores/app.store';
import { generateColorShades, getUserPrefernce, setDefaultLocale } from '@/utils/utils';
import Stack from '@/models/stack';
// import { roomtypes } from '@/data';
@Component({
  tag: 'ir-booking-engine',
  styleUrl: 'ir-booking-engine.css',
  shadow: true,
})
export class IrBookingEngine {
  @Prop({ mutable: true }) token: string =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3MTQ1NTQ5OTIsIkNMQUlNLTAxIjoiOGJpaUdjK21FQVE9IiwiQ0xBSU0tMDIiOiI5UStMQm93VTl6az0iLCJDTEFJTS0wMyI6Ilp3Tys5azJoTzUwPSIsIkNMQUlNLTA0IjoicUxHWllZcVA3SzB5aENrRTFaY0tENm5TeFowNkEvQ2lPc1JrWUpYTHFhTEF5M3N0akltbU9CWkdDb080dDRyNVRiWjkxYnZQelFIQ2c1YlBGU2J3cm5HdjNsNjVVcjVLT3RnMmZQVWFnNHNEYmE3WTJkMDF4RGpDWUs2SFlGREhkcTFYTzBLdTVtd0NKeU5rWDFSeWZmSnhJdWdtZFBUeTZPWjk0RUVjYTJleWVSVzZFa0pYMnhCZzFNdnJ3aFRKRHF1cUxzaUxvZ3I0UFU5Y2x0MjdnQ2tJZlJzZ2lZbnpOK2szclZnTUdsQTUvWjRHekJWcHl3a0dqcWlpa0M5T0owWFUrdWJJM1dzNmNvSWEwSks4SWRqVjVaQ1VaZjZ1OGhBMytCUlpsUWlyWmFZVWZlVmpzU1FETFNwWFowYjVQY0FncE1EWVpmRGtWbGFscjRzZ1pRNVkwODkwcEp6dE16T0s2VTR5Z1FMQkdQbTlTSmRLY0ExSGU2MXl2YlhuIiwiQ0xBSU0tMDUiOiJFQTEzejA3ejBUcWRkM2gwNElyYThBcklIUzg2aEpCQSJ9.ySJjLhWwUDeP4X8LIJcbsjO74y_UgMHwRDpNrCClndc';
  @Prop() propertyId: number;
  @Prop() baseUrl: string;

  @State() selectedLocale: Locale;
  @State() currencies: ICurrency[];
  @State() languages: IExposedLanguages[];
  @State() isLoading: boolean = false;

  private commonService = new CommonService();
  private propertyService = new PropertyService();

  @State() router = new Stack<HTMLElement>();

  async componentWillLoad() {
    axios.defaults.baseURL = this.baseUrl;
    getUserPrefernce();
    this.token = await this.commonService.getBEToken();
    // if (this.token !== '') {
    //   this.initializeApp();
    // }
    // this.router.push(<ir-booking-page></ir-booking-page>);
  }
  @Watch('token')
  handleTokenChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.initializeApp();
    }
  }
  initializeApp() {
    this.commonService.setToken(this.token);
    this.propertyService.setToken(this.token);
    app_store.app_data = {
      token: this.token,
      property_id: this.propertyId,
    };
    this.initRequest();
  }
  async initRequest() {
    this.isLoading = true;
    const p = JSON.parse(localStorage.getItem('user_prefernce'));
    const [property, currencies, languages] = await Promise.all([
      this.propertyService.getExposedProperty({ id: this.propertyId, language: app_store.userPreferences?.language_id || 'en' }),
      this.commonService.getCurrencies(),
      this.commonService.getExposedLanguages(),
      this.commonService.getExposedCountryByIp(),
    ]);
    this.currencies = currencies;
    this.languages = languages;

    if (!p) {
      setDefaultLocale({ currency: app_store.userDefaultCountry.currency });
    }
    // booking_store.roomTypes = [...roomtypes];
    if (property.space_theme) {
      const root = document.documentElement;
      const shades = generateColorShades(property.space_theme.button_bg_color);
      let shade_number = 900;
      shades.forEach((shade: any, index) => {
        root.style.setProperty(`--brand-${shade_number}`, `${shade.h}, ${shade.s}%, ${shade.l}%`);
        if (index === 9) {
          shade_number = 25;
        } else if (index === 8) {
          shade_number = 50;
        } else {
          shade_number = shade_number - 100;
        }
      });
    }
    this.isLoading = false;
  }

  handleVariationChange(e: CustomEvent, variations: Variation[], rateplanId: number, roomTypeId: number) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const value = e.detail;
    const selectedVariation = variations.find(variation => variation.adult_child_offering === value);
    if (!selectedVariation) {
      return;
    }
    console.log(selectedVariation);
    updateRoomParams({ params: { selected_variation: selectedVariation }, ratePlanId: rateplanId, roomTypeId });
  }

  @Listen('routing')
  handleNavigation(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    console.log(e.detail);
    app_store.currentPage = e.detail;
  }
  @Listen('resetBooking')
  async handleResetBooking(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    await this.resetBooking();
  }
  async resetBooking() {
    if (app_store.fetchedBooking) {
      await Promise.all([
        this.checkAvailability(),
        this.propertyService.getExposedProperty({ id: app_store.app_data.property_id, language: app_store.userPreferences?.language_id || 'en' }),
      ]);
      // booking_store.roomTypes = [...p.My_Result.roomtypes];
    } else {
      this.propertyService.getExposedProperty({ id: app_store.app_data.property_id, language: app_store.userPreferences?.language_id || 'en' });
    }
  }
  async checkAvailability() {
    await this.propertyService.getExposedBookingAvailability({
      propertyid: app_store.app_data.property_id,
      from_date: format(booking_store.bookingAvailabilityParams.from_date, 'yyyy-MM-dd'),
      to_date: format(booking_store.bookingAvailabilityParams.to_date, 'yyyy-MM-dd'),
      room_type_ids: [],
      adult_nbr: booking_store.bookingAvailabilityParams.adult_nbr,
      child_nbr: booking_store.bookingAvailabilityParams.child_nbr,
      language: app_store.userPreferences.language_id,
      currency_ref: app_store.userPreferences.currency_id,
      is_in_loyalty_mode: !!booking_store.bookingAvailabilityParams.coupon,
      promo_key: booking_store.bookingAvailabilityParams.coupon || '',
      is_in_agent_mode: !!booking_store.bookingAvailabilityParams.agent || false,
      agent_id: booking_store.bookingAvailabilityParams.agent || 0,
    });
  }
  render() {
    if (this.isLoading) {
      return null;
    }
    return (
      <main class="relative  flex w-full flex-col space-y-5">
        <section class="sticky top-0 z-50 w-full ">
          <ir-nav website={app_store.property?.space_theme.website} logo={app_store.property?.space_theme?.logo} currencies={this.currencies} languages={this.languages}></ir-nav>
        </section>
        <section class="flex-1 px-4 lg:px-6">
          {app_store.currentPage === 'booking' ? (
            <div class="mx-auto max-w-6xl">
              <ir-booking-page></ir-booking-page>{' '}
            </div>
          ) : (
            <div class="mx-auto max-w-6xl">
              <ir-checkout-page></ir-checkout-page>
            </div>
          )}
        </section>
        <ir-footer></ir-footer>
      </main>
    );
  }
}
