import { pages } from '@/models/common';
import { IExposedProperty } from '@/models/property';
import app_store, { onAppDataChange } from '@/stores/app.store';
import booking_store, { calculateTotalCost } from '@/stores/booking';
import { checkout_store } from '@/stores/checkout.store';
import { formatAmount, getDateDifference } from '@/utils/utils';
import { Component, Host, State, h, Event, EventEmitter, Prop } from '@stencil/core';
import { format } from 'date-fns';

@Component({
  tag: 'ir-booking-summary',
  styleUrl: 'ir-booking-summary.css',
  shadow: true,
})
export class IrBookingSummary {
  @Prop() isLoading = false;

  @State() property: IExposedProperty;

  componentWillLoad() {
    this.property = { ...app_store.property };
    onAppDataChange('property', (newValue: IExposedProperty) => {
      this.property = { ...newValue };
    });
  }

  @Event() routing: EventEmitter<pages>;
  @Event() bookingClicked: EventEmitter<null>;
  handleBooking() {
    this.bookingClicked.emit(null);
  }
  render() {
    const total_nights = getDateDifference(booking_store.bookingAvailabilityParams.from_date ?? new Date(), booking_store.bookingAvailabilityParams.to_date ?? new Date());
    const { prePaymentAmount, totalAmount } = calculateTotalCost();
    return (
      <Host>
        <div class="w-full rounded-md bg-gray-100  text-sm lg:max-w-sm">
          <div class="aspect-[1/1] max-h-32 w-full lg:aspect-[16/9]">
            <img class="h-full w-full rounded-t-md object-cover" src={this.property.space_theme.background_image} alt="" />
          </div>
          <section class="flex flex-col items-center space-y-4 p-4 lg:px-6 lg:pb-6">
            <h3 class="text-center  text-lg font-medium">{this.property.name}</h3>
            <div class="flex w-full flex-1 items-center ">
              <div class="w-56 rounded-md border border-gray-300 p-2 text-center text-xs">
                <p>Check-in</p>
                <p class="font-semibold">
                  {format(booking_store.bookingAvailabilityParams?.from_date ? new Date(booking_store.bookingAvailabilityParams?.from_date) : new Date(), 'eee, dd MMM yyyy')}
                </p>
                <p>From {app_store.property?.time_constraints.check_in_from}</p>
              </div>
              <div class="h-[1px] w-full min-w-[50px] flex-1 bg-gray-300 "></div>
              <div class="w-56 rounded-md border border-gray-300 p-2 text-center text-xs">
                <p>Check-out</p>
                <p class="font-semibold">
                  {format(booking_store.bookingAvailabilityParams?.to_date ? new Date(booking_store.bookingAvailabilityParams?.to_date) : new Date(), 'eee, dd MMM yyyy')}
                </p>
                <p>Before {app_store.property?.time_constraints.check_out_till}</p>
              </div>
            </div>

            <ir-button onButtonClick={() => this.routing.emit('booking')} label="Change details" variants="outline-primary" class="w-full"></ir-button>
            <div class={'mt-4  w-full'}>
              <ul class={'w-full space-y-2'}>
                <li class={'flex w-full items-center justify-between'}>
                  <span>
                    {total_nights} {total_nights > 1 ? 'Nights' : 'Night'}
                  </span>
                  <span>{formatAmount(totalAmount, app_store.userPreferences.currency_id)}</span>
                </li>
                {checkout_store.pickup?.location && (
                  <li class={'flex w-full items-center justify-between'}>
                    <span>Pickup fee</span>
                    <span>{formatAmount(checkout_store.pickup.location ? Number(checkout_store.pickup.due_upon_booking) : 0, app_store.userPreferences.currency_id)}</span>
                  </li>
                )}
                <li class={'flex w-full items-center justify-between text-base font-medium'}>
                  <span>Total</span>
                  <span>
                    {formatAmount(totalAmount + (checkout_store.pickup.location ? Number(checkout_store.pickup.due_upon_booking) : 0), app_store.userPreferences.currency_id)}
                  </span>
                </li>
                {prePaymentAmount > 0 && (
                  <li class={'flex w-full items-center justify-between text-base'}>
                    <span>Pay now</span>
                    <span>{formatAmount(prePaymentAmount, app_store.userPreferences.currency_id)}</span>
                  </li>
                )}
              </ul>
            </div>
            <div class={'w-full'}>
              <ir-checkbox label="I agree to the privacy policy."></ir-checkbox>
            </div>
            <ir-button isLoading={this.isLoading} size="md" class="w-full" label="CONFIRM BOOKING" onButtonClick={this.handleBooking.bind(this)}></ir-button>
          </section>
        </div>
      </Host>
    );
  }
}
