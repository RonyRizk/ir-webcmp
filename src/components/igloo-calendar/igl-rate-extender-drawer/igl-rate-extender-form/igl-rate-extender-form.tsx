import { Booking, Day, IUnit, Room } from '@/models/booking.dto';
import { Night, Variation } from '@/models/property';
import { IRoomNightsDataEventPayload } from '@/models/property-types';
import { BookingService } from '@/services/booking-service/booking.service';
import booking_store from '@/stores/booking.store';
import calendar_data from '@/stores/calendar-data';
import locales from '@/stores/locales.store';
import { formatDate, getDaysArray } from '@/utils/utils';
import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import moment from 'moment';
import { z } from 'zod';

@Component({
  tag: 'igl-rate-extender-form',
  styleUrl: 'igl-rate-extender-form.css',
  scoped: true,
})
export class IglRateExtenderForm {
  @Prop() bookingNumber: string;
  @Prop() propertyId: number;
  @Prop() language: string;
  @Prop() identifier: string;
  @Prop() toDate: string;
  @Prop() fromDate: string;
  @Prop() pool: string;
  @Prop() defaultDates: { from_date: string; to_date: string };

  @State() booking: Booking;
  @State() selectedRoom: Room;
  @State() rates: Day[] = [];
  @State() isLoading = false;
  @State() initialLoading = true;
  @State() inventory: number | null = null;
  @State() isEndDateBeforeFromDate: boolean = false;
  @State() defaultTotalNights = 0;
  @State() dates: { from_date: Date; to_date: Date } = { from_date: new Date(), to_date: new Date() };

  @Event() closeRoomNightsDialog: EventEmitter<IRoomNightsDataEventPayload>;
  @Event() loadingChanged: EventEmitter<boolean>;
  /** Emits whether inventory is available for the additional nights (false when there is none). */
  @Event() availabilityChanged: EventEmitter<boolean>;

  private bookingService = new BookingService();
  private inputRefs: HTMLIrInputElement[] = [];
  private shouldScrollToFirstEnabled = false;

  componentWillLoad() {
    this.dates = { from_date: new Date(this.fromDate), to_date: new Date(this.toDate) };
    this.init();
  }

  componentDidRender() {
    if (!this.shouldScrollToFirstEnabled) {
      return;
    }
    const target = this.firstEnabledIndex >= 0 ? this.inputRefs[this.firstEnabledIndex] : undefined;
    if (target) {
      this.shouldScrollToFirstEnabled = false;
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
  }

  /** Index of the first editable (non-disabled) night input, or -1 when none. */
  private get firstEnabledIndex(): number {
    if (!this.hasInventory) {
      return -1;
    }
    // Prepending: the newly added nights sit at the start; appending: they follow the existing days.
    return this.isEndDateBeforeFromDate ? 0 : (this.selectedRoom?.days.length ?? -1);
  }

  private async init() {
    try {
      this.initialLoading = true;
      this.inputRefs = [];
      const { from_date } = this.defaultDates;
      if (moment(from_date, 'YYYY-MM-DD').isBefore(moment(this.fromDate, 'YYYY-MM-DD'))) {
        this.dates.from_date = new Date(from_date);
      } else {
        this.dates.from_date = new Date(this.fromDate);
      }
      this.dates.to_date = new Date(this.toDate);
      this.booking = await this.bookingService.getExposedBooking(this.bookingNumber, this.language);
      if (this.booking) {
        const filteredRooms = this.booking.rooms.filter(room => room.identifier === this.identifier);
        this.selectedRoom = filteredRooms[0];
        const lastDay = this.selectedRoom?.days[this.selectedRoom.days.length - 1];
        if (!moment(this.selectedRoom.to_date, 'YYYY-MM-DD').isBefore(moment(this.toDate, 'YYYY-MM-DD'))) {
          const variation = await this.fetchBookingAvailability(this.fromDate, this.selectedRoom.days[0].date, this.selectedRoom.rateplan.id);
          const newDatesArr = getDaysArray(this.selectedRoom.days[0].date, this.fromDate);
          this.isEndDateBeforeFromDate = true;
          let dates: Record<string, Night> = {};
          variation?.nights.forEach(n => (dates[n.night] = n));
          this.rates = [
            ...newDatesArr.map(day => ({
              amount: dates[day].discounted_amount,
              date: day,
              cost: null,
            })),
            ...this.selectedRoom.days,
          ];
          this.defaultTotalNights = this.rates.length - this.selectedRoom.days.length;
        } else {
          const variation = await this.fetchBookingAvailability(this.selectedRoom.to_date, moment(this.toDate, 'YYYY-MM-DD').format('YYYY-MM-DD'), this.selectedRoom.rateplan.id);
          const newDatesArr = getDaysArray(lastDay.date, this.toDate);
          let dates: Record<string, Night> = {};
          variation?.nights.forEach(n => (dates[n.night] = n));
          this.rates = [
            ...this.selectedRoom.days,
            ...newDatesArr.map(day => ({
              amount: dates[day].discounted_amount,
              date: day,
              cost: null,
            })),
          ];
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.initialLoading = false;
      this.availabilityChanged.emit(this.hasInventory);
      this.shouldScrollToFirstEnabled = this.hasInventory;
    }
  }

  private get hasInventory(): boolean {
    return this.inventory !== 0 && this.inventory !== null;
  }

  private handleInput(event: string, index: number) {
    let inputValue = event;
    let days = [...this.rates];
    inputValue = inputValue.replace(/[^0-9.]/g, '');
    if (inputValue === '') {
      days[index].amount = -1;
    } else {
      if (!isNaN(Number(inputValue))) {
        days[index].amount = Number(inputValue);
      }
    }
    this.rates = days;
  }

  private async fetchBookingAvailability(from_date: string, to_date: string, rate_plan_id: number): Promise<Variation | null> {
    try {
      const bookingAvailability = await this.bookingService.getBookingAvailability({
        from_date,
        to_date,
        propertyid: this.propertyId,
        adultChildCount: {
          adult: this.selectedRoom.rateplan.selected_variation.adult_nbr,
          child: this.selectedRoom.rateplan.selected_variation.child_nbr,
        },
        language: this.language,
        currency: this.booking.currency,
        room_type_ids: [this.selectedRoom.roomtype.id],
        rate_plan_ids: [rate_plan_id],
      });
      this.inventory = bookingAvailability[0].inventory;
      const rate_plan = bookingAvailability[0].rateplans.find(rate => rate.id === rate_plan_id);
      if (!rate_plan || !rate_plan.variations) {
        this.inventory = null;
        return null;
      }
      const selected_variation: Variation = rate_plan.variations?.find(
        variation =>
          variation.adult_nbr === this.selectedRoom.rateplan.selected_variation.adult_nbr && variation.child_nbr === this.selectedRoom.rateplan.selected_variation.child_nbr,
      );
      if (!selected_variation) {
        return null;
      }
      return selected_variation;
    } catch (error) {
      console.error(error);
    }
  }

  private disabled(index: number): boolean {
    if (this.inventory === 0 || this.inventory === null) {
      return true;
    }
    if (this.isEndDateBeforeFromDate) {
      return !(index < this.defaultTotalNights);
    }
    return index < this.selectedRoom.days.length;
  }

  private showArrow(index: number): boolean {
    // Prepending (adding from the start date): arrow goes under the last new date.
    if (this.isEndDateBeforeFromDate) {
      return index === this.defaultTotalNights - 1;
    }
    // Appending (adding more dates to it): arrow goes under the previous to_date.
    return index === this.selectedRoom.days.length - 1;
  }

  private async handleRoomConfirmation() {
    try {
      this.isLoading = true;
      this.loadingChanged.emit(true);
      let oldRooms = [...this.booking.rooms];
      let selectedRoomIndex = oldRooms.findIndex(room => room.identifier === this.identifier);
      if (selectedRoomIndex === -1) {
        throw new Error('Invalid Pool');
      }
      oldRooms[selectedRoomIndex] = {
        ...oldRooms[selectedRoomIndex],
        days: this.rates,
        to_date: moment(this.dates.to_date).format('YYYY-MM-DD'),
        from_date: moment(this.dates.from_date).format('YYYY-MM-DD'),
      };
      const body = {
        assign_units: true,
        check_in: true,
        is_pms: true,
        is_direct: true,
        pickup_info: this.booking.pickup_info,
        extra_services: this.booking.extra_services,
        agent: this.booking.agent,
        booking: {
          booking_nbr: this.bookingNumber,
          from_date: moment(this.dates.from_date).format('YYYY-MM-DD'),
          to_date: moment(this.dates.to_date).format('YYYY-MM-DD'),
          remark: this.booking.remark,
          property: this.booking.property,
          source: this.booking.source,
          currency: this.booking.currency,
          arrival: this.booking.arrival,
          guest: this.booking.guest,
          rooms: oldRooms,
        },
      };
      await this.bookingService.doReservation(body);
      this.closeRoomNightsDialog.emit({ type: 'confirm', pool: this.pool });
    } catch (error) {
    } finally {
      this.isLoading = false;
      this.loadingChanged.emit(false);
    }
  }

  render() {
    if (this.initialLoading) {
      return (
        <div class={'drawer__loader-container'}>
          <ir-spinner></ir-spinner>
        </div>
      );
    }
    const currency_symbol = this.booking.currency.symbol;
    return (
      <form
        id="rate-extender-form"
        class="rate-extender-form"
        onSubmit={e => {
          e.preventDefault();
          this.handleRoomConfirmation();
        }}
      >
        <section class="rate-form__body">
          <p class="rate-form__booking-number">
            {`${locales.entries.Lcz_Booking}#`} {this.bookingNumber}
          </p>

          <p class="rate-form__rate-plan">
            {this.selectedRoom.roomtype.name} {`${this.selectedRoom?.rateplan?.short_name}`} {this.selectedRoom?.rateplan?.custom_text}{' '}
            <ir-unit-tag unit={(this.selectedRoom?.unit as IUnit).name}></ir-unit-tag>
            {this.selectedRoom?.rateplan?.is_non_refundable && <span class={'irfontgreen'}>{locales.entries.Lcz_NonRefundable}</span>}
          </p>

          {this.inventory !== 0 && this.inventory !== null && booking_store.roomTypes?.length > 0 && (
            <wa-callout size="small" variant="neutral" appearance="filled" class="rate-form__tax-callout booking-editor-header__tax_statement">
              {calendar_data.tax_statement}
            </wa-callout>
          )}
        </section>
        <p class="rate-form__date-range">
          {formatDate(moment(this.dates.from_date).format('YYYY-MM-DD'), 'YYYY-MM-DD')} <wa-icon name="arrow-right"></wa-icon>{' '}
          {formatDate(moment(this.dates.to_date).format('YYYY-MM-DD'), 'YYYY-MM-DD')}
        </p>
        {(this.inventory === 0 || this.inventory === null) && (
          <wa-callout size="small" variant="danger" class="rate-form__availability-callout">
            <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
            {locales.entries.Lcz_NoAvailabilityForAdditionalNights}
          </wa-callout>
        )}
        {this.rates?.map((day, index) => {
          return [
            <ir-validator key={day.date} value={day.amount} schema={z.number().min(0)}>
              <ir-input
                ref={el => (this.inputRefs[index] = el)}
                disabled={this.disabled(index)}
                class="rate-extender-input"
                aria-describedby="rate cost"
                aria-label="rate"
                onText-change={e => this.handleInput(e.detail, index)}
                value={day.amount.toString()}
                defaultValue={day.amount.toString()}
                mask={'price'}
                label={moment(day.date).format('ddd, MMM D')}
              >
                <span slot="start">{currency_symbol}</span>
              </ir-input>
            </ir-validator>,
            this.showArrow(index) && <wa-icon class="rate-extender-arrow" name={this.isEndDateBeforeFromDate ? 'arrow-up' : 'arrow-down'}></wa-icon>,
          ];
        })}
        <div></div>
      </form>
    );
  }
}
