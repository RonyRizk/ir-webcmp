import { Component, Event, EventEmitter, Host, Listen, State, h } from '@stencil/core';
import { Locale } from 'date-fns';
import { ICurrency, IExposedLanguages, pages } from '@/models/common';
import { IExposedProperty } from '@/models/property';
import booking_store, { calculateTotalCost } from '@/stores/booking';
import app_store, { onAppDataChange } from '@/stores/app.store';
import { formatAmount, getDateDifference } from '@/utils/utils';
// import { roomtypes } from '@/data';
@Component({
  tag: 'ir-booking-page',
  styleUrl: 'ir-booking-page.css',
  shadow: true,
})
export class IrBookingPage {
  @State() selectedLocale: Locale;
  @State() property: IExposedProperty;
  @State() currencies: ICurrency[];
  @State() languages: IExposedLanguages[];
  @Event() routing: EventEmitter<pages>;
  checkoutContainerRef: HTMLDivElement;

  componentWillLoad() {
    this.property = { ...app_store.property };
    onAppDataChange('property', (newValue: IExposedProperty) => {
      console.log(newValue);
      this.property = { ...newValue };
    });
  }
  @Listen('animateBookingButton')
  handleBookingAnimation(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    if (this.checkoutContainerRef) {
      this.checkoutContainerRef.classList.add('bounce-twice');
      this.checkoutContainerRef.addEventListener('animationend', () => {
        this.checkoutContainerRef.classList.remove('bounce-twice');
      });
    }
  }
  render() {
    if (!this.property) {
      return null;
    }
    const { totalAmount } = calculateTotalCost();
    return (
      <Host>
        <div class="space-y-5 ">
          <div>
            <ir-property-gallery></ir-property-gallery>
          </div>
          <div>
            <ir-availibility-header></ir-availibility-header>
          </div>

          <section class="relative justify-between gap-4 rounded-md ">
            <div class=" flex-1 py-2">
              {booking_store.roomTypes?.map(roomType => {
                if (!roomType.is_active || roomType.images.length <= 0 || (roomType.inventory <= 0 && booking_store.enableBooking)) {
                  return null;
                }
                return <ir-roomtype roomtype={roomType} key={roomType.id}></ir-roomtype>;
              })}
            </div>
          </section>
          <section class={'text-sm'}>
            <h2 class="mb-5 text-lg font-medium">Facilities and services</h2>
            <ir-facilities></ir-facilities>
            <p innerHTML={this.property?.description?.location_and_intro} class="px-4 py-5"></p>
          </section>
        </div>
        {booking_store.enableBooking && totalAmount > 0 && (
          <div
            ref={el => (this.checkoutContainerRef = el)}
            class="sticky bottom-2 z-40 mt-14 flex w-full items-center justify-end gap-4 rounded-md bg-gray-700/80 text-base text-gray-200 md:text-lg lg:gap-10  lg:text-2xl"
          >
            <div class="">
              <p>{getDateDifference(booking_store.bookingAvailabilityParams.from_date ?? new Date(), booking_store.bookingAvailabilityParams.to_date ?? new Date())} nights</p>
            </div>
            {totalAmount > 0 && <div>{formatAmount(totalAmount, app_store.userPreferences.currency_id)}</div>}
            <ir-button
              onButtonClick={() => this.routing.emit('checkout')}
              label="BOOK NOW"
              size="lg"
              class="w-auto lg:w-60"
              buttonStyles={{
                height: '64px',
                borderRadius: '0',
                borderTopRightRadius: app_store.dir === 'RTL' ? '0px' : '6px',
                borderBottomRightRadius: app_store.dir === 'RTL' ? '0px' : '6px',
                borderTopLeftRadius: app_store.dir === 'RTL' ? '6px' : '0px',
                borderBottomLeftRadius: app_store.dir === 'RTL' ? '6px' : '0px',
              }}
            ></ir-button>
          </div>
        )}
      </Host>
    );
  }
}
