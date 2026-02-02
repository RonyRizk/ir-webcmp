import { Booking } from '@/models/booking.dto';
import { IEntries } from '@/models/IBooking';
import { BookingService } from '@/services/booking-service/booking.service';
import locales from '@/stores/locales.store';
import { Component, Event, EventEmitter, Method, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'ir-arrival-time-dialog',
  styleUrl: 'ir-arrival-time-dialog.css',
  scoped: true,
})
export class IrArrivalTimeDialog {
  @Prop() booking: Booking;
  @Prop() arrivalTime: IEntries[] = [];

  @State() isLoading = false;
  @State() open = false;
  @State() selectedArrivalTime = '';

  @Event() resetBookingEvt: EventEmitter<Booking | null>;

  private bookingService = new BookingService();

  @Method()
  async openDialog() {
    this.selectedArrivalTime = this.booking?.arrival?.code || '';
    this.open = true;
  }

  @Method()
  async closeDialog() {
    this.open = false;
  }

  private updateArrivalTime(value: string) {
    this.selectedArrivalTime = value;
  }

  private getArrivalDescription(code: string) {
    const entry = this.arrivalTime.find(time => time.CODE_NAME === code);
    return entry?.CODE_VALUE_EN || this.booking?.arrival?.description || '';
  }

  private async saveArrivalTime() {
    if (!this.selectedArrivalTime || this.selectedArrivalTime === this.booking?.arrival?.code) {
      this.closeDialog();
      return;
    }
    try {
      this.isLoading = true;
      const booking = {
        assign_units: true,
        is_pms: true,
        is_direct: this.booking.is_direct,
        is_backend: true,
        is_in_loyalty_mode: this.booking.is_in_loyalty_mode,
        promo_key: this.booking.promo_key,
        extras: this.booking.extras,
        agent: this.booking.agent,
        booking: {
          ...this.booking,
          arrival: {
            code: this.selectedArrivalTime,
            description: this.getArrivalDescription(this.selectedArrivalTime),
          },
          from_date: this.booking.from_date,
          to_date: this.booking.to_date,
          remark: this.booking.remark,
          booking_nbr: this.booking.booking_nbr,
          property: this.booking.property,
          booked_on: this.booking.booked_on,
          source: this.booking.source,
          rooms: this.booking.rooms,
          currency: this.booking.currency,
          guest: this.booking.guest,
        },
        pickup_info: this.booking.pickup_info,
      };
      const res = await this.bookingService.doReservation(booking);
      this.resetBookingEvt.emit(res);
      this.closeDialog();
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return (
      <ir-dialog
        label="Edit arrival time"
        open={this.open}
        onIrDialogHide={() => {
          this.open = false;
        }}
      >
        <wa-select
          size="small"
          value={this.selectedArrivalTime}
          defaultValue={this.selectedArrivalTime}
          onchange={e => this.updateArrivalTime((e.target as HTMLSelectElement).value)}
        >
          {this.arrivalTime.map(time => (
            <wa-option value={time.CODE_NAME} selected={time.CODE_NAME === this.selectedArrivalTime}>
              {time.CODE_VALUE_EN}
            </wa-option>
          ))}
        </wa-select>
        <div slot="footer" class="ir-dialog__footer">
          <ir-custom-button size="medium" appearance="filled" variant="neutral" onClickHandler={() => this.closeDialog()}>
            {locales.entries.Lcz_Cancel}
          </ir-custom-button>
          <ir-custom-button size="medium" variant="brand" onClickHandler={() => this.saveArrivalTime()} loading={this.isLoading}>
            {locales.entries.Lcz_Save}
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
