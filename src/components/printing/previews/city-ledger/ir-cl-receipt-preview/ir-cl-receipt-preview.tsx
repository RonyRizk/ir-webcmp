import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import type { SetupEntries, IProperty } from '@/models/property';
import { ClFiscalDocumentService } from '../cl-fiscal-document.service';
import { formatAmount } from '@/utils/utils';
import { CityLedgerService, ClTx, FiscalDocument } from '@/services/city-ledger';
import { SetupService, getSetupEntryLabel } from '@/services/setup';
import { t } from '@/services/locale/t';
@Component({
  tag: 'ir-cl-receipt-preview',
  styleUrl: 'ir-cl-receipt-preview.css',
  shadow: true,
})
export class IrClReceiptPreview {
  @Prop() propertyId: number;
  @Prop() ticket: string;
  @Prop() baseurl: string;
  @Prop() agentId: number;
  @Prop() agentName: string;
  @Prop() documentNumber: string;

  @State() private isLoading: boolean = false;
  @State() private ClEntry: ClTx;
  @State() private error: string | null = null;
  @State() private property: IProperty | null = null;
  @State() private paymentMethods: SetupEntries[] = [];
  @State() private document: FiscalDocument | null = null;

  @Event({ bubbles: true, composed: true }) clPreviewReady: EventEmitter<void>;

  private hasEmitted: boolean = false;
  private dataService = new ClFiscalDocumentService();
  private setupService = new SetupService();
  private cityLedgerService = new CityLedgerService();

  componentWillLoad() {
    if (!this.ticket) {
      this.error = t('Lcz_AuthTicketRequired', { fallback: 'Authentication ticket is required.' });
      return;
    }
    this.dataService.init(this.baseurl, this.ticket);
    return this.fetchData();
  }

  private async fetchData() {
    this.isLoading = true;
    this.error = null;
    try {
      const [{ property, transactions }, paymentMethods, documents] = await Promise.all([
        this.dataService.fetchData(this.propertyId, this.agentId, this.documentNumber),
        this.setupService.getSetupEntriesByTableName('_PAY_METHOD'),
        this.cityLedgerService.getFiscalDocuments({
          AGENCY_ID: this.agentId,
          DOC_NUMBER: this.documentNumber,
        }),
      ]);
      this.document = documents[0];
      this.property = property;
      this.ClEntry = transactions[0];
      this.paymentMethods = paymentMethods;
    } catch (e: any) {
      this.error = e?.message ?? t('Lcz_FailedToLoadReceiptData', { fallback: 'Failed to load receipt data.' });
    } finally {
      this.isLoading = false;
    }
  }

  componentDidRender() {
    if (!this.isLoading && !this.error && !this.hasEmitted) {
      this.hasEmitted = true;
      requestAnimationFrame(() => {
        this.clPreviewReady.emit();
      });
    }
  }

  private getPaymentMethodLabel(code: string | null): string {
    if (!code) return '—';
    const entry = this.paymentMethods.find(e => e.CODE_NAME === code);
    return entry ? getSetupEntryLabel(entry) : code;
  }

  render() {
    if (!this.ticket) {
      return (
        <Host>
          <div class="document-state document-state--error">{t('Lcz_AuthTicketRequired', { fallback: 'Authentication ticket is required.' })}</div>
        </Host>
      );
    }
    if (this.isLoading) {
      return (
        <Host>
          <div class="document-state">
            <ir-spinner></ir-spinner>
          </div>
        </Host>
      );
    }
    if (this.error) {
      return (
        <Host>
          <div class="document-state document-state--error">{this.error}</div>
        </Host>
      );
    }

    const tx = this.ClEntry;
    if (!tx) {
      return (
        <Host>
          <div class="document-state document-state--error">{t('Lcz_NoReceiptDataFound', { fallback: 'No receipt data found.' })}</div>
        </Host>
      );
    }

    const currency = this.property?.currency?.symbol ?? '$';
    const fmt = (v: number | null | undefined) => (v != null ? formatAmount(currency, v) : '—');

    return (
      <Host>
        <div class="document">
          <ir-cl-document-header
            style={{ marginBottom: '2.5rem' }}
            property={this.property as any}
            documentNumber={this.documentNumber}
            agentName={this.agentName}
            documentType="receipt"
          ></ir-cl-document-header>

          <div class="receipt-body">
            {/* ── Payment Details ─────────────────────────────────── */}
            <section class="receipt-section">
              <h4 class="receipt-section__title">{t('Lcz_PaymentDetailsTitle', { fallback: 'Payment Details' })}</h4>

              <div class="receipt-rows">
                <div class="receipt-row">
                  <span class="receipt-row__label">{t('Lcz_AmountReceived', { fallback: 'Amount Received' })}</span>
                  <span class="receipt-row__value">{fmt(tx.TOTAL_AMOUNT)}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-row__label">{t('Lcz_PaymentMethod', { fallback: 'Payment Method' })}</span>
                  <span class="receipt-row__value">{this.getPaymentMethodLabel(tx.PAY_METHOD_CODE)}</span>
                </div>
                {tx.DESCRIPTION && (
                  <div class="receipt-row">
                    <span class="receipt-row__label">{t('Lcz_Reference', { fallback: 'Reference' })}</span>
                    <span class="receipt-row__value">{tx.DESCRIPTION}</span>
                  </div>
                )}
              </div>
            </section>

            {/* ── Balance Summary ──────────────────────────────────── */}
            <section class="receipt-section">
              <h4 class="receipt-section__title">{t('Lcz_BalanceSummaryAccountTitle', { fallback: 'Balance Summary (Account)' })}</h4>

              <div class="receipt-rows">
                <div class="receipt-row">
                  <span class="receipt-row__label">{t('Lcz_BalanceBeforePayment', { fallback: 'Balance Before Payment' })}</span>
                  <span class="receipt-row__value">{fmt(this.document?.BALANCE_BEFORE_TX)}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-row__label">{t('Lcz_PaymentReceived', { fallback: 'Payment Received' })}</span>
                  <span class="receipt-row__value">{fmt(tx.TOTAL_AMOUNT)}</span>
                </div>
                <div class="receipt-row">
                  <span class="receipt-row__label">{t('Lcz_BalanceAfterPayment', { fallback: 'Balance After Payment' })}</span>
                  <span class="receipt-row__value">{fmt(this.document?.BALANCE_AFTER_TX)}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Host>
    );
  }
}
