import { Booking } from '@/models/booking.dto';
import { CityLedgerService, type FiscalDocument } from '@/services/city-ledger';
import calendar_data from '@/stores/calendar-data';
import Token from '@/models/Token';
import { Component, Host, Listen, Prop, State, Watch, h } from '@stencil/core';

@Component({
  tag: 'ir-agent-billing',
  styleUrl: 'ir-agent-billing.css',
  scoped: true,
})
export class IrAgentBilling {
  @Prop() booking: Booking;

  @State() private fiscalDocuments: FiscalDocument[] = [];
  @State() private isLoading: boolean = false;
  @State() private hasFetched: boolean = false;

  private invoiceDialogRef: HTMLIrClInvoiceDialogElement;

  private cityLedgerService = new CityLedgerService();
  private tokenService = new Token();

  async componentWillLoad() {
    await this.fetchFiscalDocuments();
  }

  @Watch('booking')
  async handleBookingChange(newVal: Booking, oldVal: Booking) {
    if (newVal?.booking_nbr !== oldVal?.booking_nbr || newVal?.agent?.id !== oldVal?.agent?.id) {
      this.fiscalDocuments = [];
      this.hasFetched = false;
      await this.fetchFiscalDocuments();
    }
  }

  private async fetchFiscalDocuments() {
    if (!this.booking?.agent?.id || !this.booking?.booking_nbr) return;
    this.isLoading = true;
    try {
      const result = await this.cityLedgerService.getFiscalDocuments({
        AGENCY_ID: this.booking.agent.id,
        START_DATE: this.booking.from_date,
        END_DATE: this.booking.to_date,
        BOOK_NBR: this.booking.booking_nbr,
      });
      this.fiscalDocuments = result ?? [];
    } catch (err) {
      console.error('[ir-agent-billing] getFiscalDocuments failed:', err);
      this.fiscalDocuments = [];
    } finally {
      this.isLoading = false;
      this.hasFetched = true;
    }
  }

  @Listen('fiscalDocumentIssued', { target: 'body' })
  handleFiscalDocumentIssued(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.fetchFiscalDocuments();
  }
  @Listen('documentConverted', { target: 'body' })
  handleDocumentConverted(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.fetchFiscalDocuments();
  }
  render() {
    if (this.isLoading) {
      return (
        <div class={'agent-bill__loader-container'}>
          <ir-spinner></ir-spinner>
        </div>
      );
    }
    return (
      <Host>
        <div class="billing__container">
          <div class="billing__section-title-row">
            <h4 class="billing__section-title">Issued documents</h4>
            <ir-custom-button
              onClickHandler={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.invoiceDialogRef.openModal();
              }}
              appearance={'accent'}
              class="booking-header__stretched-btn"
              size="s"
              variant="brand"
            >
              Issue Invoice
            </ir-custom-button>
            {/* {!canIssueInvoice && <wa-tooltip for={this._id}>Invoices cannot be issued before guest arrival</wa-tooltip>} */}
          </div>
          <ir-city-ledger-fiscal-documents-table
            class={'agent-billing__table'}
            rows={this.fiscalDocuments}
            booking={this.booking}
            isLoading={this.isLoading}
            hasFetched={this.hasFetched}
            agentId={this.booking?.agent?.id ?? null}
            currencySymbol={calendar_data.property?.currency?.symbol ?? '$'}
            fromDate={this.booking?.from_date ?? null}
            toDate={this.booking?.to_date ?? null}
            hasDates={true}
            ticket={this.tokenService.getToken()}
            propertyId={calendar_data.property?.id}
            onFetchRequested={() => this.fetchFiscalDocuments()}
          ></ir-city-ledger-fiscal-documents-table>
        </div>
        <ir-cl-invoice-dialog
          mode="booking"
          agentId={this.booking.agent?.id}
          booking={this.booking}
          startDate={this.booking.from_date}
          endDate={this.booking.to_date}
          currencyId={calendar_data.property.currency.id}
          ref={el => (this.invoiceDialogRef = el)}
        ></ir-cl-invoice-dialog>
        {/* The agent folio's fiscal documents are previewed through the shared
            `ir-fiscal-document-preview` mounted at the booking-details root. The
            `ir-city-ledger-fiscal-documents-table` above emits `clFiscalDocumentPreview`
            (a window event) which that shared preview listens for. */}
      </Host>
    );
  }
}
