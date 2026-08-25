import { Booking, ExtraService, ExtraServiceSchema, IUnit, Room } from '@/models/booking.dto';
import { IEntries } from '@/models/IBooking';
import { BookingService } from '@/services/booking-service/booking.service';
import locales from '@/stores/locales.store';
import calendar_data, { getExtraServiceDefaultPrice } from '@/stores/calendar-data';
import { createDateWithOffsetAndHour } from '@/utils/booking';
import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';

/** Service category code for an early-check-in extra service charge. */
const EARLY_CHECK_IN_CATEGORY_CODE = 'ECI';

/**
 * Hour-of-day (24h, hotel-local) each `_ARRIVAL_TIME` setup code represents.
 * These codes are fixed setup-table entries (not derivable from their label text alone,
 * e.g. "Noon"/"Midnight"), so the mapping is hardcoded here. '001' ("Not sure yet") has
 * no time of day and is intentionally omitted.
 */
const ARRIVAL_TIME_HOURS: Record<string, number> = {
  '002': 10, // 10 AM
  '003': 12, // Noon
  '004': 14, // 2 PM
  '005': 16, // 4 PM
  '006': 18, // 6 PM
  '007': 20, // 8 PM
  '008': 22, // 10 PM
  '009': 0, // Midnight
  '010': 2, // 2 AM
  '011': 4, // 4 AM
  '012': 6, // 6 AM
  '013': 8, // 8 AM
};

/**
 * Midnight/2 AM/4 AM ('009'-'011') fall on the calendar day *after* the arrival day — they're
 * late-night arrivals, not early-morning ones, so they can never count as an early check-in
 * even though their raw hour (0, 2, 4) is numerically less than the check-in start hour.
 */
const NEVER_EARLY_CHECK_IN_CODES = new Set(['009', '010', '011']);

/**
 * Dialog that lets staff set or change the expected arrival time for a single room.
 * Persists the choice via BookingService.setArrivalTime and emits `arrivalTimeClose`
 * when it closes so the parent can refresh the booking.
 *
 * Usage:
 *   <ir-arrival-time-dialog
 *     room={room}
 *     open={isOpen}
 *     property_id={propertyId}
 *     arrivalTime={arrivalTimeEntries}
 *     onArrivalTimeClose={e => { isOpen = false; if (e.detail.saved) refresh(); }}
 *   />
 */
@Component({
  tag: 'ir-arrival-time-dialog',
  styleUrl: 'ir-arrival-time-dialog.css',
  scoped: true,
})
export class IrArrivalTimeDialog {
  /** Room whose expected arrival time is being changed. */
  @Prop() room: Room;
  /** Needed to look up whether this room already has an early-check-in extra service charge. */
  @Prop() booking: Booking;
  /** Controls dialog visibility. */
  @Prop() open: boolean;
  @Prop() property_id: number;
  @Prop() arrivalTime: IEntries[] = [];
  @Prop() language: string = 'en';
  /** Needed to create an early-check-in extra service charge alongside the arrival time. */
  @Prop() booking_nbr: string;
  @Prop() currency_id: number;
  @Prop() currencySymbol: string;

  @State() selectedValue: string | null = null;
  @State() isLoading: boolean = false;
  @State() createExtraService: boolean = true;
  @State() extraServicePrice: number | null = null;

  /**
   * Fired when the dialog closes.
   * `saved: true` → arrival time was persisted; `saved: false` → user cancelled.
   */
  @Event({ bubbles: true, composed: true }) arrivalTimeClose: EventEmitter<{ saved: boolean }>;

  private bookingService = new BookingService();
  private dialogRef: HTMLIrDialogElement;
  private closedBySave = false;

  @Watch('open')
  handleOpenChange(next: boolean) {
    if (next) {
      this.selectedValue = this.room?.arrival_time?.code ?? null;
      const existing = this.existingEarlyCheckInService;
      this.extraServicePrice = existing ? existing.price : Number(getExtraServiceDefaultPrice('ECI'));
    }
  }

  /** The room's already-persisted early-check-in extra service charge, if any — its price becomes the field's default instead of the property's generic default. */
  private get existingEarlyCheckInService(): ExtraService | undefined {
    return (this.booking?.extra_services ?? []).find(service => service.room_identifier === this.room?.identifier && service.category?.code === EARLY_CHECK_IN_CATEGORY_CODE);
  }

  /** Whether an arrival-time option (e.g. "10 AM") falls before the property's standard check-in start time, in hotel-local time. */
  private isEarlyCheckIn(entry: IEntries): boolean {
    if (NEVER_EARLY_CHECK_IN_CODES.has(entry.CODE_NAME)) return false;
    const hour = ARRIVAL_TIME_HOURS[entry.CODE_NAME];
    const checkInFrom = calendar_data.property?.time_constraints?.check_in_from;
    const offset = calendar_data.property?.city?.gmt_offset;
    const match = checkInFrom?.match(/^(\d{1,2}):(\d{2})$/);
    if (hour === undefined || !match || offset === undefined) return false;
    const [, checkInHour, checkInMinute] = match;
    const optionTime = createDateWithOffsetAndHour(offset, hour, 0);
    const checkInTime = createDateWithOffsetAndHour(offset, Number(checkInHour), Number(checkInMinute));
    return optionTime.getTime() < checkInTime.getTime();
  }

  /** Whether the currently selected arrival time is an early check-in. */
  private get selectedIsEarlyCheckIn(): boolean {
    const entry = this.arrivalTime?.find(time => time.CODE_NAME === this.selectedValue);
    return entry ? this.isEarlyCheckIn(entry) : false;
  }

  private async handleConfirm(e: CustomEvent) {
    e.stopImmediatePropagation();
    if (!this.selectedValue) return;
    try {
      this.isLoading = true;
      await this.bookingService.setArrivalTime({
        property_id: this.property_id,
        code: this.selectedValue,
        room_identifier: this.room.identifier,
      });
      const existing = this.existingEarlyCheckInService;
      if (this.selectedIsEarlyCheckIn && this.createExtraService) {
        if (this.extraServicePrice) {
          await this.bookingService.doBookingExtraService({
            booking_nbr: this.booking_nbr,
            is_remove: false,
            service: {
              ...existing,
              category: { code: EARLY_CHECK_IN_CATEGORY_CODE },
              price: this.extraServicePrice,
              cost: null,
              currency_id: this.currency_id,
              room_identifier: this.room.identifier,
              start_date: this.room.from_date,
              end_date: null,
              description: null,
              agent: existing?.agent ?? null,
            },
          });
        } else if (existing) {
          // Price cleared/zeroed on an existing charge — treat as removing the early-check-in extra service.
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
        label="Expected Arrival Time"
        ref={el => (this.dialogRef = el)}
        onIrDialogHide={e => {
          e.preventDefault();
          const saved = this.closedBySave;
          this.arrivalTimeClose.emit({ saved });
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
        <div class={'ir-time-dialog__body'}>
          <div class={'ir-time-dialog__current-unit'}>
            <span>{this.room?.roomtype?.name}</span> <span>{this.room?.rateplan?.short_name}</span> <ir-unit-tag unit={(this.room?.unit as IUnit)?.name}></ir-unit-tag>
          </div>
          <wa-select
            size="s"
            placeholder="Not provided"
            value={this.selectedValue ?? ''}
            onwa-after-hide={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
            }}
            defaultValue={this.selectedValue ?? ''}
            onchange={e => (this.selectedValue = (e.target as HTMLSelectElement).value)}
          >
            {this.arrivalTime?.map(time => (
              <wa-option key={time.CODE_NAME} value={time.CODE_NAME}>
                {time[`CODE_VALUE_${this.language?.toUpperCase()}`] ?? time[`CODE_VALUE_EN`]}
                {this.isEarlyCheckIn(time) ? ' (Early check-in)' : ''}
              </wa-option>
            ))}
          </wa-select>
          {this.selectedIsEarlyCheckIn && (
            <div class="ir-time-dialog__insight">
              <div class="ir-time-dialog__insight-row">
                <wa-icon class="ir-time-dialog__insight-icon" name="clock"></wa-icon>
                <div class="ir-time-dialog__insight-copy">
                  <p class="ir-time-dialog__insight-title">
                    Would you like to charge it as an <b>Early Check-in</b>?
                  </p>
                  <p class="ir-time-dialog__insight-subtitle">This will be added as an accommodation extra service</p>
                </div>
                {/* <wa-switch
                checked={this.createExtraService}
                defaultChecked={this.createExtraService}
                onchange={e => (this.createExtraService = (e.target as HTMLInputElement).checked)}
                aria-label="Charge an extra service for early check-in"
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
                      withClear
                      type="text"
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
        <div slot="footer" class="ir-dialog__footer">
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
