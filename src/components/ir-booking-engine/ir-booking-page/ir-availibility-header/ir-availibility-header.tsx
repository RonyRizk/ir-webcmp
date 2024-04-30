import { Component, Event, EventEmitter, h, Listen, State } from '@stencil/core';
import { ExposedBookingAvailability, TExposedBookingAvailability } from './availability';
import { format } from 'date-fns';
import { ZodError } from 'zod';
import { createPopper } from '@popperjs/core';
import localization_store, { onAppDataChange } from '@/stores/app.store';
import { PropertyService } from '@/services/api/property.service';
import app_store from '@/stores/app.store';
import booking_store from '@/stores/booking';

@Component({
  tag: 'ir-availibility-header',
  styleUrl: 'ir-availibility-header.css',
  shadow: true,
})
export class IrAvailibilityHeader {
  @State() exposedBookingAvailabiltyParams: TExposedBookingAvailability = {
    adult_nbr: 1,
    child_nbr: 0,
    currency_ref: 'USD',
    language: 'en',
    room_type_ids: [],
    propertyid: 42,
    is_in_loyalty_mode: !!booking_store.bookingAvailabilityParams.coupon,
    promo_key: booking_store.bookingAvailabilityParams.coupon || '',
    is_in_agent_mode: !!booking_store.bookingAvailabilityParams.agent || false,
    agent_id: booking_store.bookingAvailabilityParams.agent || 0,
  };

  @State() errorCause: 'date' | 'adult_child' | null = null;
  @State() isLoading = false;

  @Event() resetBooking: EventEmitter<null>;

  private popoverInstance = null;
  private datePopup: HTMLIrDatePopupElement;
  private dateToast: HTMLDivElement;
  private toast_timeout: NodeJS.Timeout;

  private propertyService = new PropertyService();

  componentWillLoad() {
    const { token, property_id } = app_store.app_data;
    this.propertyService.setToken(token);
    if (booking_store.bookingAvailabilityParams.from_date) {
      this.exposedBookingAvailabiltyParams.from_date = format(booking_store.bookingAvailabilityParams.from_date, 'yyyy-MM-dd');
      this.exposedBookingAvailabiltyParams.to_date = format(booking_store.bookingAvailabilityParams.to_date, 'yyyy-MM-dd');
    }
    this.changeExposedAvailabilityParams({
      propertyid: property_id,
      language: app_store.userPreferences.language_id,
      currency_ref: app_store.userPreferences.currency_id,
    });
    onAppDataChange('userPreferences', async newValue => {
      this.changeExposedAvailabilityParams({
        language: newValue.language_id,
        currency_ref: newValue.currency_id,
      });
      try {
        if (app_store.currentPage === 'booking') {
          this.resetBooking.emit(null);
        }
      } catch (error) {}
    });
  }
  componentDidLoad() {
    createPopper(this.datePopup, this.dateToast, {
      placement: localization_store.dir === 'LTR' ? 'bottom-start' : 'bottom-end',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 3],
          },
        },
      ],
    });
  }

  async checkAvailability() {
    const params = ExposedBookingAvailability.parse(this.exposedBookingAvailabiltyParams);
    await this.propertyService.getExposedBookingAvailability({
      ...this.exposedBookingAvailabiltyParams,
      is_in_loyalty_mode: !!booking_store.bookingAvailabilityParams.coupon,
      promo_key: booking_store.bookingAvailabilityParams.coupon || '',
      is_in_agent_mode: !!booking_store.bookingAvailabilityParams.agent || false,
      agent_id: booking_store.bookingAvailabilityParams.agent || 0,
    });
    booking_store.bookingAvailabilityParams = {
      ...booking_store.bookingAvailabilityParams,
      from_date: new Date(params.from_date),
      to_date: new Date(params.to_date),
      adult_nbr: params.adult_nbr,
      child_nbr: params.child_nbr,
    };
    console.log(booking_store.bookingAvailabilityParams);
  }

  async handleCheckAvailability() {
    try {
      this.isLoading = true;
      await this.checkAvailability();
      app_store.fetchedBooking = true;
    } catch (error) {
      if (error instanceof ZodError) {
        for (const err of error.errors) {
          const error_cause = err.path[0].toString();
          if (error_cause.includes('date')) {
            this.triggerToast('date');
            break;
          } else if (error_cause.includes('nbr')) {
            this.triggerToast('adult_child');
            break;
          }
        }
      }
    } finally {
      this.isLoading = false;
    }
  }
  triggerToast(cause: 'date' | 'adult_child') {
    this.errorCause = cause;
    setTimeout(() => {
      this.errorCause = null;
    }, 2000);
  }
  changeExposedAvailabilityParams(params: Partial<TExposedBookingAvailability>) {
    this.exposedBookingAvailabiltyParams = {
      ...this.exposedBookingAvailabiltyParams,
      ...params,
    };
  }
  @Listen('dateChange')
  handleDateChange(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const { start, end } = e.detail;
    if (end) {
      this.changeExposedAvailabilityParams({
        from_date: format(start, 'yyyy-MM-dd').toString(),
        to_date: format(end, 'yyyy-MM-dd').toString(),
      });
    } else if (this.exposedBookingAvailabiltyParams.to_date && !end) {
      this.changeExposedAvailabilityParams({
        from_date: format(start, 'yyyy-MM-dd').toString(),
        to_date: null,
      });
    } else {
      this.changeExposedAvailabilityParams({ from_date: format(start, 'yyyy-MM-dd') });
    }
  }
  @Listen('addAdultsAndChildren')
  handleAdultChildChange(e: CustomEvent) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    this.changeExposedAvailabilityParams({ ...e.detail });
  }
  disconnectedCallback() {
    if (this.popoverInstance) {
      this.popoverInstance.destroy();
    }
    if (this.toast_timeout) {
      clearTimeout(this.toast_timeout);
    }
  }
  render() {
    return (
      <div class="availability-container flex flex-col items-center gap-4 bg-gray-100 p-2 sm:flex-row sm:flex-wrap sm:justify-center ">
        <div class="flex w-full flex-col items-center gap-4 sm:w-fit sm:flex-row lg:mr-10">
          <ir-date-popup
            ref={el => (this.datePopup = el)}
            dates={{
              start: this.exposedBookingAvailabiltyParams?.from_date ? new Date(this.exposedBookingAvailabiltyParams.from_date) : null,
              end: this.exposedBookingAvailabiltyParams?.to_date ? new Date(this.exposedBookingAvailabiltyParams.to_date) : null,
            }}
            class="w-full sm:w-auto"
          ></ir-date-popup>
          <div ref={el => (this.dateToast = el)}>{this.errorCause === 'date' && <p class="rounded-md bg-red-500 px-5 py-1 text-sm text-white"> Select a date</p>}</div>
          <ir-adult-child-counter class="w-full sm:w-auto"></ir-adult-child-counter>
          <ir-button
            isLoading={this.isLoading}
            onButtonClick={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.handleCheckAvailability();
            }}
            label="Search"
            size="lg"
            class="w-full sm:w-auto"
            buttonClassName="justify-center"
          ></ir-button>
        </div>
        {app_store?.property?.promotions && (
          <div class={'flex w-full flex-wrap  items-center gap-4 sm:justify-center md:w-fit md:justify-start'}>
            <ir-coupon-dialog class="w-full sm:w-fit"></ir-coupon-dialog>
            <ir-loyalty class="w-full sm:w-fit"></ir-loyalty>
          </div>
        )}
      </div>
    );
  }
}
