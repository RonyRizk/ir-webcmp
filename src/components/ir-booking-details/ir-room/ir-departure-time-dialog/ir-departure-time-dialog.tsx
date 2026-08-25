import { Booking, ExtraService, ExtraServiceSchema, IUnit, Room } from '@/models/booking.dto';
import { IEntries } from '@/models/IBooking';
import { BookingService } from '@/services/booking-service/booking.service';
import locales from '@/stores/locales.store';
import calendar_data, { getExtraServiceDefaultPrice } from '@/stores/calendar-data';
import { createDateWithOffsetAndHour } from '@/utils/booking';
import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';

/** Service category code for a late-checkout extra service charge. */
const LATE_CHECKOUT_CATEGORY_CODE = 'LCO';

/**
 * Dialog that lets staff set or change the expected departure time for a single room.
 * Persists the choice via BookingService.setDepartureTime and emits `departureTimeClose`
 * when it closes so the parent can refresh the booking.
 *
 * Usage:
 *   <ir-departure-time-dialog
 *     room={room}
 *     open={isOpen}
 *     property_id={propertyId}
 *     departureTime={departureTimeEntries}
 *     onDepartureTimeClose={e => { isOpen = false; if (e.detail.saved) refresh(); }}
 *   />
 */
@Component({
  tag: 'ir-departure-time-dialog',
  styleUrl: 'ir-departure-time-dialog.css',
  scoped: true,
})
export class IrDepartureTimeDialog {
  /** Room whose expected departure time is being changed. */
  @Prop() room: Room;
  /** Needed to look up whether this room already has a late-checkout extra service charge. */
  @Prop() booking: Booking;
  /** Controls dialog visibility. */
  @Prop() open: boolean;
  @Prop() property_id: number;
  @Prop() departureTime: IEntries[] = [];
  @Prop() language: string = 'en';
  /** Needed to create a late-checkout extra service charge alongside the departure time. */
  @Prop() booking_nbr: string;
  @Prop() currency_id: number;
  @Prop() currencySymbol: string;

  @State() selectedValue: string | null = null;
  @State() isLoading: boolean = false;
  @State() createExtraService: boolean = true;
  @State() extraServicePrice: number | null = null;

  /**
   * Fired when the dialog closes.
   * `saved: true` → departure time was persisted; `saved: false` → user cancelled.
   */
  @Event({ bubbles: true, composed: true }) departureTimeClose: EventEmitter<{ saved: boolean }>;

  private bookingService = new BookingService();
  private dialogRef: HTMLIrDialogElement;
  private closedBySave = false;

  @Watch('open')
  handleOpenChange(next: boolean) {
    if (next) {
      this.selectedValue = this.room?.departure_time?.code ?? null;
      const existing = this.existingLateCheckoutService;
      this.extraServicePrice = existing ? existing.price : Number(getExtraServiceDefaultPrice('LCO'));
    }
  }

  /** The room's already-persisted late-checkout extra service charge, if any — its price becomes the field's default instead of the property's generic default. */
  private get existingLateCheckoutService(): ExtraService | undefined {
    return (this.booking?.extra_services ?? []).find(service => service.room_identifier === this.room?.identifier && service.category?.code === LATE_CHECKOUT_CATEGORY_CODE);
  }

  /** Whether a departure-time option (e.g. "14:00") falls after the property's standard checkout time, in hotel-local time. */
  private isLateCheckout(entry: IEntries): boolean {
    const match = entry.CODE_VALUE_EN?.match(/^(\d{1,2}):(\d{2})$/);
    const checkoutHours = calendar_data.checkin_checkout_hours;
    if (!match || !checkoutHours) return false;
    const [, hour, minute] = match;
    const optionTime = createDateWithOffsetAndHour(checkoutHours.offset, Number(hour), Number(minute));
    const checkoutTime = createDateWithOffsetAndHour(checkoutHours.offset, checkoutHours.hour, checkoutHours.minute);
    return optionTime.getTime() > checkoutTime.getTime();
  }

  /** Whether the currently selected departure time is a late checkout. */
  private get selectedIsLateCheckout(): boolean {
    const entry = this.departureTime?.find(dt => dt.CODE_NAME === this.selectedValue);
    return entry ? this.isLateCheckout(entry) : false;
  }

  private async handleConfirm(e: CustomEvent) {
    e.stopImmediatePropagation();
    if (!this.selectedValue) return;
    try {
      this.isLoading = true;
      await this.bookingService.setDepartureTime({
        property_id: this.property_id,
        code: this.selectedValue,
        room_identifier: this.room.identifier,
      });
      const existing = this.existingLateCheckoutService;
      if (this.selectedIsLateCheckout && this.createExtraService) {
        if (this.extraServicePrice) {
          await this.bookingService.doBookingExtraService({
            booking_nbr: this.booking_nbr,
            is_remove: false,
            service: {
              ...existing,
              category: { code: LATE_CHECKOUT_CATEGORY_CODE },
              price: this.extraServicePrice,
              cost: null,
              currency_id: this.currency_id,
              room_identifier: this.room.identifier,
              start_date: this.room.to_date,
              end_date: null,
              description: null,
              agent: existing?.agent ?? null,
            },
          });
        } else if (existing) {
          // Price cleared/zeroed on an existing charge — treat as removing the late-checkout extra service.
          await this.bookingService.doBookingExtraService({
            booking_nbr: this.booking_nbr,
            is_remove: true,
            service: existing,
          });
        }
      }
      this.closedBySave = true;
      this.dialogRef?.closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return (
      <ir-dialog
        open={this.open}
        label="Expected Departure Time"
        ref={el => (this.dialogRef = el)}
        onIrDialogHide={e => {
          e.preventDefault();
          const saved = this.closedBySave;
          this.departureTimeClose.emit({ saved });
        }}
        onIrDialogAfterHide={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
          this.closedBySave = false;
          this.selectedValue = null;
          this.createExtraService = true;
          this.extraServicePrice = null;
        }}
      >
        <div class="ir-time-dialog__body">
          <div class={'ir-time-dialog__current-unit'}>
            <span>{this.room?.roomtype?.name}</span> <span>{this.room?.rateplan?.short_name}</span> <ir-unit-tag unit={(this.room?.unit as IUnit)?.name}></ir-unit-tag>
          </div>
          <wa-select
            size="s"
            placeholder="Not provided"
            onwa-after-hide={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
            }}
            value={this.selectedValue ?? ''}
            defaultValue={this.selectedValue ?? ''}
            onchange={e => (this.selectedValue = (e.target as HTMLSelectElement).value)}
          >
            {this.departureTime?.map(dt => (
              <wa-option key={dt.CODE_NAME} value={dt.CODE_NAME}>
                {dt[`CODE_VALUE_${this.language?.toUpperCase()}`] ?? dt[`CODE_VALUE_EN`]}
                {this.isLateCheckout(dt) ? ' (Late check-out)' : ''}
              </wa-option>
            ))}
          </wa-select>
          {this.selectedIsLateCheckout && (
            <div class="ir-time-dialog__insight">
              <div class="ir-time-dialog__insight-row">
                <wa-icon class="ir-time-dialog__insight-icon" name="clock"></wa-icon>
                <div class="ir-time-dialog__insight-copy">
                  <p class="ir-time-dialog__insight-title">
                    Would you like to charge it as an <b>Late Check-out</b>?
                  </p>
                  <p class="ir-time-dialog__insight-subtitle">This will be added as an accommodation extra service</p>
                </div>
                {/* <wa-switch
                checked={this.createExtraService}
                defaultChecked={this.createExtraService}
                onchange={e => (this.createExtraService = (e.target as HTMLInputElement).checked)}
                aria-label="Charge an extra service for late checkout"
              ></wa-switch> */}
              </div>
              {this.createExtraService && (
                <div class="ir-time-dialog__insight-price">
                  <ir-validator value={this.extraServicePrice} schema={ExtraServiceSchema.shape.price}>
                    <ir-input
                      onText-change={e => (this.extraServicePrice = Number(e.detail))}
                      defaultValue={this.extraServicePrice?.toString()}
                      value={this.extraServicePrice?.toString()}
                      mask={'price'}
                      type="text"
                      withClear
                      // label="Price"
                    >
                      <span slot="start">{this.currencySymbol}</span>
                    </ir-input>
                  </ir-validator>
                </div>
              )}
            </div>
          )}
        </div>
        <div slot="footer" class={'ir-dialog__footer'}>
          <ir-custom-button size="m" variant="neutral" appearance="filled" data-dialog="close">
            {locales.entries.Lcz_Cancel}
          </ir-custom-button>
          <ir-custom-button size="m" variant="brand" loading={this.isLoading} disabled={!this.selectedValue} onClickHandler={e => this.handleConfirm(e)} appearance="accent">
            {locales.entries.Lcz_Save}
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
