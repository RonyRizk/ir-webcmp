import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import moment from 'moment';
import { z } from 'zod';
import { Booking, Room } from '@/models/booking.dto';
import { ClTx } from '@/services/city-ledger/types';
import { BookingService } from '@/services/booking-service/booking.service';
import { isAgentMode } from '@/components/ir-booking-details/functions';
import { Agent } from '@/services/agents/type';
import calendar_data from '@/stores/calendar-data';
import { InvoiceableItemReason } from '@/types/enums';

const nightAmountSchema = z.coerce.number({ invalid_type_error: 'Required' }).min(0, 'Minimum is 0');

type NightEntry = {
  date: string;
  amount: string;
  cost: number | null;
  isLocked: boolean;
};

@Component({
  tag: 'ir-booking-pricing-form',
  styleUrl: 'ir-booking-pricing-form.css',
  scoped: true,
})
export class IrBookingPricingForm {
  @Prop() formId: string = 'booking-pricing-form';
  @Prop() booking: Booking;
  @Prop() room: Room;
  @Prop() agent: Agent | null = null;
  @Prop() folioEntries: ClTx[] = [];
  @Prop() currencySymbol: string = '';

  @State() nights: NightEntry[] = [];
  @State() isSubmitting: boolean = false;
  @State() invoiceLocked: boolean = false;
  @State() isCheckingInvoice: boolean = false;

  @Event() pricingSaved: EventEmitter<void>;
  @Event() submitDisabledChange: EventEmitter<boolean>;
  @Event() allDisabled: EventEmitter<boolean>;

  private bookingService = new BookingService();
  private isAgent: boolean;

  componentWillLoad() {
    this.isAgent = this.room.agent && isAgentMode(this.agent);
    this.initNights();
    if (!this.isAgent) {
      this.checkInvoiceStatus();
    }
  }

  componentDidLoad() {
    this.emitAllDisabled();
  }

  @Watch('room')
  handleRoomChange() {
    this.initNights();
    this.emitAllDisabled();
  }

  /** True when nothing in the form is editable (invoice-locked, or every night is locked). */
  private get areAllItemsDisabled(): boolean {
    if (this.invoiceLocked) return true;
    return this.nights.length > 0 && this.nights.every(night => night.isLocked);
  }

  private emitAllDisabled() {
    this.allDisabled.emit(this.areAllItemsDisabled);
  }

  private initNights() {
    const acmTxByDate = this.acmTxByDate;
    this.nights = this.room.days.map(day => ({
      date: day.date,
      amount: day.amount.toString(),
      cost: day.cost,
      isLocked: this.isAgent ? acmTxByDate.get(day.date)?.IS_LOCKED : false,
    }));
  }

  private async checkInvoiceStatus() {
    this.isCheckingInvoice = true;
    try {
      const info = await this.bookingService.getBookingInvoiceInfo({ booking_nbr: this.booking.booking_nbr });
      const accommodationItem = (info.invoiceable_items ?? []).find(item => item.key === this.room.system_id);
      this.invoiceLocked = accommodationItem.reason.code === InvoiceableItemReason.AlreadyInvoiced;
    } catch {
      // non-fatal — fall through with invoiceLocked = false
    } finally {
      this.isCheckingInvoice = false;
      this.emitAllDisabled();
    }
  }

  private isValid(): boolean {
    if (this.invoiceLocked) return false;
    return this.nights.every(n => {
      if (n.isLocked) return true;
      return nightAmountSchema.safeParse(n.amount).success;
    });
  }

  private get acmTxByDate(): Map<string, ClTx> {
    return new Map(this.folioEntries.filter(tx => tx.CATEGORY === 'ACM' && tx.BSA_REF === this.room.identifier).map(tx => [tx.SERVICE_DATE, tx]));
  }

  private updateNight(date: string, value: string) {
    this.nights = this.nights.map(n => (n.date === date ? { ...n, amount: value } : n));
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.isValid()) return;
    this.isSubmitting = true;
    this.submitDisabledChange.emit(true);
    try {
      const updatedRoom: Room = {
        ...this.room,
        days: this.nights.map(n => ({ date: n.date, amount: parseFloat(n.amount), cost: n.cost })),
      };
      const updatedRooms = this.booking.rooms.map(r => (r.identifier === this.room.identifier ? updatedRoom : r));
      const { pickup_info, extra_services, is_direct, is_in_loyalty_mode, promo_key, extras, ...rest } = this.booking as any;
      const payload = {
        assign_units: true,
        is_pms: true,
        is_direct,
        is_backend: true,
        is_in_loyalty_mode,
        promo_key,
        extras: extras ?? [],
        agent: this.booking.agent,
        booking: { ...rest, rooms: updatedRooms, agent: this.booking.agent },
        extra_services,
        pickup_info,
      };
      await this.bookingService.doReservation(payload);
      this.pricingSaved.emit();
    } catch (err: any) {
      console.error(err);
    } finally {
      this.isSubmitting = false;
      this.submitDisabledChange.emit(false);
    }
  }

  render() {
    if (this.isCheckingInvoice) {
      return (
        <div class={'drawer__loader-container'}>
          <ir-spinner></ir-spinner>
        </div>
      );
    }

    const allDisabled = this.invoiceLocked || this.isSubmitting;
    const hasDisabledInput = this.nights.some(night => night.isLocked || allDisabled);

    return (
      <form id={this.formId} class="pricing-form" onSubmit={this.handleSubmit.bind(this)} novalidate>
        {hasDisabledInput && (
          <wa-callout variant="warning" size="s">
            <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
            Locked nightly rates cannot be edited in case they have been invoiced. You can void the invoice with a credit note to update the rates and recreate a new one
          </wa-callout>
        )}

        {calendar_data.property.tax_statement && (
          <wa-callout size="s" variant="neutral">
            {calendar_data.property.tax_statement}
          </wa-callout>
        )}

        <div style={{ marginBottom: '0.5rem' }}></div>
        {this.nights.map(night => (
          <ir-validator key={night.date} class="pricing-form__input-validator" schema={nightAmountSchema} value={night.amount}>
            <ir-input
              class="pricing-form__input"
              label={moment(night.date).format('ddd, MMM D')}
              value={night.amount}
              mask="price"
              disabled={night.isLocked || allDisabled}
              onText-change={(e: CustomEvent<string>) => this.updateNight(night.date, e.detail)}
            >
              <span slot="start">{calendar_data.property.currency.symbol}</span>
              {(night.isLocked || this.invoiceLocked) && <wa-icon slot="end" name="lock" style={{ fontSize: '0.875rem' }}></wa-icon>}
            </ir-input>
          </ir-validator>
        ))}
      </form>
    );
  }
}
