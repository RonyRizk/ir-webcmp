import { Booking, Day, IUnit, Room } from '@/models/booking.dto';
import { BookingService } from '@/services/booking-service/booking.service';
import locales from '@/stores/locales.store';
import { Component, Event, EventEmitter, Fragment, Prop, State, Watch, h } from '@stencil/core';
import { BookingInvoiceInfo } from '../ir-invoice/types';
import { InvoiceableItemReason } from '@/types/enums';
import moment from 'moment';
import { AgentsService } from '@/services/agents/agents.service';
import { Agent } from '@/services/agents/type';
import { isAgentMode } from '../ir-booking-details/functions';
import { CityLedgerService, ClTx } from '@/services/city-ledger';
import { FolioEntryMode, Payment, PaymentEntries } from '../ir-booking-details/types';
import calendar_data from '@/stores/calendar-data';

export type CheckoutDialogCloseEvent = { reason: 'cancel' | 'checkout' | 'openInvoice' };

@Component({
  tag: 'ir-checkout-dialog',
  styleUrl: 'ir-checkout-dialog.css',
  scoped: true,
})
export class IrCheckoutDialog {
  @Prop({ reflect: true }) open: boolean;
  @Prop() booking: Booking;
  @Prop() identifier: string;

  @State() isLoading: 'checkout' | 'skipCheckout' | 'checkout&invoice' | 'page' = 'page';
  @State() buttons: Set<'checkout' | 'checkout_without_invoice' | 'invoice_checkout'> = new Set();
  @State() invoiceInfo: BookingInvoiceInfo;
  @State() room: Room;
  @State() isEarlyCheckout: boolean = false;
  @State() remainingDays: Day[] = [];
  @State() penaltyAmount: number = 0;
  @State() agent: Agent;
  @State() paymentEntries: PaymentEntries;
  @State() includeInvoice: boolean = false;

  @Event({ composed: true, bubbles: true }) checkoutDialogClosed: EventEmitter<CheckoutDialogCloseEvent>;

  private bookingService = new BookingService();
  private agentService = new AgentsService();
  private cityLedgerService = new CityLedgerService();
  private initialPenaltyStr: string = '0.00';
  private transactions: ClTx[] = [];
  private paymentFolioRef: HTMLIrPaymentFolioElement;

  private get remainingTotal(): number {
    return this.remainingDays.reduce((sum, d) => sum + d.charges.total_amount, 0);
  }

  private get currencySymbol(): string {
    return this.booking?.currency?.symbol ?? '$';
  }

  private formatAmount(amount: number): string {
    return `${this.currencySymbol}${amount.toFixed(2)}`;
  }

  private async checkoutRoom({ e, source }: { e: CustomEvent; source: 'checkout' | 'skipCheckout' | 'checkout&invoice' }) {
    try {
      e.stopImmediatePropagation();
      e.stopPropagation();
      this.isLoading = source;
      // await this.bookingService.handleExposedRoomInOut({
      //   booking_nbr: this.booking.booking_nbr,
      //   room_identifier: this.identifier,
      //   status: '002',
      // });
      await this.bookingService.handleRoomCheckout({
        booking_nbr: this.booking.booking_nbr,
        room_identifier: this.identifier,
        penalty_amount: this.penaltyAmount >= 0 ? this.penaltyAmount : null,
      });
      this.isLoading = null;
      // this.checkoutDialogClosed.emit({ reason: source === 'checkout&invoice' ? 'openInvoice' : 'checkout' });
      this.checkoutDialogClosed.emit({ reason: this.includeInvoice ? 'openInvoice' : 'checkout' });
    } catch (error) {
      console.error(error);
    }
  }

  @Watch('open')
  handleOpenChange(newValue: boolean, oldValue: boolean) {
    if (newValue !== oldValue) {
      this.init();
    }
  }

  private get missingClSummary(): { room: number; extras: number; total: number } | null {
    if (!this.agent || !isAgentMode(this.agent) || !this.room || !this.booking) return null;

    const today = moment().format('YYYY-MM-DD');

    const agentId = this.agent.id;
    const agentRooms = this.booking.rooms.filter(r => r.agent !== null && r.agent.id === agentId);
    const agentExtraServices = (this.booking.extra_services ?? []).filter(e => e.agent !== null && e.agent.id === agentId);

    const room = agentRooms.reduce((total, r) => {
      //TODO check for accomodation REL_ENTITY
      const postedDates = new Set(this.transactions.filter(tx => (tx as any).REL_ENTITY === 'TBL_BSAD' && tx.BSA_REF === r.identifier).map(tx => tx.SERVICE_DATE));
      const unposted = (r.days ?? []).filter(d => d.date < today && !postedDates.has(d.date));
      return total + unposted.length;
    }, 0);

    const postedExtraKeys = new Set(this.transactions.filter(tx => (tx as any).REL_ENTITY === 'TBL_BSE').map(tx => tx.REL_ENTITY_KEY));
    const extras = agentExtraServices.filter(es => es.system_id != null && es.start_date <= today && !postedExtraKeys.has(es.system_id)).length;

    return { room, extras, total: room + extras };
  }

  private async init() {
    if (!this.open) {
      return;
    }
    try {
      this.isLoading = 'page';
      this.room = this.booking.rooms.find(r => r.identifier === this.identifier);
      this.detectEarlyCheckout();

      const hasAgent = !!this.room?.agent;
      const hasDueAmount = (this.booking?.financial?.due_amount ?? 0) > 0;
      const [invoiceInfo, agent, setupEntries] = await Promise.all([
        this.bookingService.getBookingInvoiceInfo({ booking_nbr: this.booking.booking_nbr }),
        hasAgent ? this.agentService.getExposedAgent({ id: this.booking.agent!.id }) : Promise.resolve(null),
        hasDueAmount ? this.bookingService.getSetupEntriesByTableNameMulti(['_PAY_TYPE', '_PAY_TYPE_GROUP', '_PAY_METHOD']) : Promise.resolve(null),
      ]);

      this.invoiceInfo = invoiceInfo;
      this.setupButtons();

      if (setupEntries) {
        const { pay_type, pay_type_group, pay_method } = this.bookingService.groupEntryTablesResult(setupEntries);
        this.paymentEntries = { types: pay_type, groups: pay_type_group, methods: pay_method };
      }

      if (agent && isAgentMode(agent)) {
        this.agent = agent;
        const res = await this.cityLedgerService.fetchCL({
          AGENCY_ID: this.booking.agent.id,
          SEARCH_QUERY: this.booking.booking_nbr,
        });
        this.transactions = res.My_Cl_tx;
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = null;
    }
  }

  private detectEarlyCheckout() {
    const today = moment().startOf('day');
    const toDate = moment(this.room.to_date, 'YYYY-MM-DD');
    this.isEarlyCheckout = today.isBefore(toDate, 'date');
    if (this.isEarlyCheckout) {
      if (this.room.agent === null) {
        this.isEarlyCheckout = false;
        return;
      }
      const todayStr = today.format('YYYY-MM-DD');
      this.remainingDays = (this.room.days ?? []).filter(d => d.date >= todayStr);
      const total = this.remainingTotal;
      this.penaltyAmount = total;
      this.initialPenaltyStr = total.toFixed(2);
    }
  }

  /**
   * Determines which checkout action buttons to surface.
   *
   * Decision rules (evaluated after `invoiceInfo` is loaded):
   *
   * 1. Filter `invoiceable_items` to items that still need invoicing — exclude
   *    `AlreadyInvoiced` and `PickupCancellationPolicy` reasons.
   * 2. From those, isolate room/accommodation items (`type === 'BSA'`).
   * 3. Button set:
   *    - Nothing outstanding           → `checkout` only
   *    - Any outstanding items         → `invoice_checkout` (check out + invoice guest)
   *    - 2+ outstanding room items     → also add `checkout_without_invoice` (skip invoicing)
   *
   * `checkout_without_invoice` is withheld when only one room is un-invoiced because
   * the "check out & invoice" path already covers that case cleanly.
   */
  private setupButtons() {
    const toBeInvoiced = this.invoiceInfo.invoiceable_items.filter(
      item => ![InvoiceableItemReason.AlreadyInvoiced, InvoiceableItemReason.PickupCancellationPolicy].includes(item?.reason?.code as any),
    );
    const toBeInvoicedRooms = toBeInvoiced.filter(item => item.type === 'BSA');
    if (toBeInvoiced.length === 0) {
      this.buttons.add('checkout');

      return;
    }
    const allRoomInvoiced = toBeInvoicedRooms.length === 0;
    let includeInvoice = true;
    this.buttons.add('invoice_checkout');
    if (!allRoomInvoiced && toBeInvoicedRooms.length > 1) {
      includeInvoice = false;
      this.buttons.add('checkout_without_invoice');
    }
    this.includeInvoice = includeInvoice;
  }

  private renderEarlyCheckoutContent() {
    const unitName = (this.room?.unit as IUnit)?.name ?? this.room?.identifier;
    const remainingCount = this.remainingDays.length;
    const total = this.remainingTotal;

    return (
      <div class="early-checkout">
        <wa-callout class="ec-summary" size="s" appearance="filled" variant="neutral">
          <div class="ec-summary__row">
            <span class="ec-summary__label">Unit</span>
            <span class="ec-summary__value">{unitName}</span>
          </div>
          <div class="ec-summary__row">
            <span class="ec-summary__label">Original check-out</span>
            <span class="ec-summary__value">{moment(this.room.to_date, 'YYYY-MM-DD').format('ddd, MMM D, YYYY')}</span>
          </div>
          <div class="ec-summary__row">
            <span class="ec-summary__label">Actual check-out</span>
            <span class="ec-summary__value">{moment().format('ddd, MMM D, YYYY')}</span>
          </div>
          {/* <div class="ec-summary__row">
            <span class="ec-summary__label">Nights reclaimed</span>
            <span class="ec-summary__value ec-summary__value--accent">
              {remainingCount} {remainingCount === 1 ? 'night' : 'nights'}
            </span>
          </div> */}
        </wa-callout>

        <div class="ec-section">
          <p class="ec-section__title">
            Reclaimed Nights <wa-badge pill>{remainingCount}</wa-badge>
          </p>
          <div class="ec-nights">
            {this.remainingDays.map(day => (
              <div key={day.date} class="ec-nights__row">
                <span class="ec-nights__date">{moment(day.date, 'YYYY-MM-DD').format('ddd, MMM D')}</span>
                <span class="ec-nights__amount">{this.formatAmount(day.charges.total_amount)}</span>
              </div>
            ))}
            <div class="ec-nights__subtotal">
              <span>Subtotal (Including taxes and fees)</span>
              <span>{this.formatAmount(total)}</span>
            </div>
          </div>
        </div>

        <div class="ec-section">
          <ir-input
            label="Apply cancellation penalty?"
            mask="price"
            value={this.initialPenaltyStr}
            defaultValue={this.initialPenaltyStr}
            min={0}
            max={total}
            hint="Pre-filled from reclaimed nights. Modify or waive entirely."
            onText-change={(e: CustomEvent<string>) => {
              const val = parseFloat(e.detail);
              this.penaltyAmount = isNaN(val) ? 0 : val;
            }}
          >
            <span slot="start">{this.currencySymbol}</span>
          </ir-input>
        </div>
      </div>
    );
  }

  private get duePayment(): Payment {
    const p = this.paymentEntries.types.find(t => t.CODE_NAME === '001');
    return {
      amount: Math.abs(this.booking?.guest_financial?.due_amount),
      currency: calendar_data.property.currency as any,
      date: moment().format('YYYY-MM-DD'),
      designation: null,
      payment_method: null,
      payment_type: { code: p.CODE_NAME, description: p.CODE_VALUE_EN, operation: p.NOTES },
      id: -1,
      reference: '',
    };
  }

  private renderDueAmountWarning() {
    const balance = this.booking?.guest_financial?.due_amount ?? 0;
    if (!balance || balance <= 0) return null;

    const amount = this.formatAmount(balance);

    return (
      <button type="button" class="due-amount-btn" onClick={() => this.paymentFolioRef?.openFolio()}>
        <wa-callout size="s" variant="danger">
          <wa-icon slot="icon" name="money-bill-wave"></wa-icon>
          <div class={'d-flex align-items-center justify-content-between'}>
            <span>Outstanding guest balance: {amount}</span>
            <wa-icon name="chevron-right" style={{ marginLeft: 'auto' }}></wa-icon>
          </div>
        </wa-callout>
      </button>
    );
  }
  private renderSameDayWarning() {
    if (moment().isSame(moment(this.room.from_date, 'YYYY-MM-DD'), 'date')) {
      const isSingleRoom = this.booking.rooms.length === 1;
      return (
        <wa-callout size="s" variant="danger">
          <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
          This {isSingleRoom ? 'booking' : 'room'} will be {isSingleRoom ? 'cancelled' : 'removed'}
        </wa-callout>
      );
    }
    return null;
  }

  private renderMissingClWarning() {
    const summary = this.missingClSummary;
    if (!summary) return null;

    if (summary.total === 0) {
      return (
        <wa-callout size="s" variant="success">
          <wa-icon slot="icon" name="circle-check"></wa-icon>
          All charges posted to <b>{this.agent.name}</b> City Ledger
        </wa-callout>
      );
    }

    return (
      <wa-callout size="s" variant="warning">
        <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
        {summary.total} item{summary.total !== 1 ? 's' : ''} not posted to city ledger
      </wa-callout>
    );
  }

  render() {
    const isEarly = this.isEarlyCheckout && this.isLoading !== 'page';
    const hasDue = (this.booking?.financial?.due_amount ?? 0) > 0;
    return (
      <Fragment>
        <ir-dialog
          open={this.open}
          label={isEarly ? 'Early Check-Out' : 'Check-Out'}
          style={{ '--ir-dialog-width': isEarly ? 'min(36rem, calc(100vw - 2rem))' : 'fit-content' }}
          onIrDialogHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.buttons.clear();
            this.checkoutDialogClosed.emit({ reason: 'cancel' });
          }}
        >
          {this.isLoading === 'page' ? (
            <div class="dialog__loader-container">
              <ir-spinner></ir-spinner>
            </div>
          ) : (
            <Fragment>
              <div class="checkout-dialog__callouts">
                {this.renderDueAmountWarning()}
                {this.renderMissingClWarning()}
                {this.renderSameDayWarning()}
              </div>
              {this.isEarlyCheckout ? (
                this.renderEarlyCheckoutContent()
              ) : (
                <p style={{ width: 'calc(31rem - var(--spacing))' }}>Are you sure you want to check out unit {(this.room?.unit as IUnit)?.name}?</p>
              )}
              {this.buttons.has('invoice_checkout') && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <wa-checkbox
                    style={{ marginTop: '1rem', color: 'var(--wa-color-text-quiet)', marginLeft: 'auto' }}
                    value={String(this.includeInvoice)}
                    defaultChecked={this.includeInvoice}
                    onchange={() => {
                      this.includeInvoice = !this.includeInvoice;
                    }}
                  >
                    Prepare guest invoice after checkout
                  </wa-checkbox>
                </div>
              )}
            </Fragment>
          )}

          <div slot="footer" class="ir-dialog__footer">
            <Fragment>
              <ir-custom-button size="m" data-dialog="close" appearance="filled" variant="neutral">
                {locales?.entries?.Lcz_Cancel ?? 'Cancel'}
              </ir-custom-button>
              {/* {this.buttons.has('checkout') && ( */}
              <ir-custom-button size="m" onClickHandler={e => this.checkoutRoom({ e, source: 'checkout' })} variant={'brand'} loading={this.isLoading === 'checkout'}>
                {isEarly ? 'Confirm early check-out' : 'Check out'}
              </ir-custom-button>
              {/* )} */}
              {/* {this.buttons.has('checkout_without_invoice') && (
                <ir-custom-button
                  loading={this.isLoading === 'skipCheckout'}
                  size="m"
                  onClickHandler={e => this.checkoutRoom({ e, source: 'skipCheckout' })}
                  variant={'brand'}
                  appearance={this.buttons.has('invoice_checkout') ? 'outlined' : 'accent'}
                >
                  Checkout only
                </ir-custom-button>
              )}
              {this.buttons.has('invoice_checkout') && (
                <ir-custom-button
                  size="m"
                  loading={this.isLoading === 'checkout&invoice'}
                  onClickHandler={e => {
                    this.checkoutRoom({ e, source: 'checkout&invoice' });
                  }}
                  variant={'brand'}
                  appearance={'accent'}
                >
                  Check out & invoice guest
                </ir-custom-button>
              )} */}
            </Fragment>
          </div>
        </ir-dialog>
        {hasDue && this.paymentEntries && (
          <ir-payment-folio
            ref={el => (this.paymentFolioRef = el as HTMLIrPaymentFolioElement)}
            booking={this.booking}
            bookingNumber={this.booking.booking_nbr}
            paymentEntries={this.paymentEntries}
            mode={'payment-action' as FolioEntryMode}
            payment={this.duePayment}
          ></ir-payment-folio>
        )}
      </Fragment>
    );
  }
}
