import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import type { IProperty } from '@/models/property';
import { CityLedgerService, type CLStatements, type FiscalDocument } from '@/services/city-ledger';
import { PropertyService } from '@/services/property.service';
import { formatAmount } from '@/utils/utils';
import ApiClient from '@/models/ApiClient';
import { FdTypes } from '@/types/enums';
import { LocaleController } from '@/services/locale/locale.controller';
import { t } from '@/services/locale/t';
import { formatBookingNumber } from '@/utils/number';
import { formatDate } from '@/utils/date';

const DATE_DISPLAY = 'MMM DD, YYYY';

@Component({
  tag: 'ir-cl-statement-preview',
  styleUrl: 'ir-cl-statement-preview.css',
  shadow: true,
})
export class IrClStatementPreview {
  @Prop() propertyId: number;
  @Prop() ticket: string;
  @Prop() baseurl: string;
  @Prop() agentId: number;
  @Prop() agentName: string;
  @Prop() fromDate: string;
  @Prop() toDate: string;
  @Prop() currencyId: number;

  @State() private isLoading = false;
  @State() private error: string | null = null;
  @State() private property: IProperty | null = null;
  @State() private statement: CLStatements | null = null;
  @State() private fiscalDocuments: FiscalDocument[] = [];

  @Event({ bubbles: true, composed: true }) clPreviewReady: EventEmitter<void>;

  private apiClientService = new ApiClient();
  private propertyService = new PropertyService();
  private cityLedgerService = new CityLedgerService();
  private hasEmitted: boolean = false;

  componentWillLoad() {
    if (!this.ticket) {
      this.error = t('Lcz_AuthTicketRequired', { fallback: 'Authentication ticket is required.' });
      return;
    }
    if (this.baseurl) this.apiClientService.setBaseUrl(this.baseurl);
    this.apiClientService.setApiClient(this.ticket);
    return this.fetchData();
  }
  componentDidRender() {
    if (!this.isLoading && !this.error && !this.hasEmitted) {
      this.hasEmitted = true;
      requestAnimationFrame(() => {
        this.clPreviewReady.emit();
      });
    }
  }
  private async fetchData() {
    this.isLoading = true;
    this.error = null;
    try {
      const [propertyData, statement, fiscalDocuments] = await Promise.all([
        this.propertyService.getExposedProperty({ id: this.propertyId, language: LocaleController.language }),
        this.cityLedgerService.getCLStatement({
          AGENCY_ID: this.agentId,
          CURRENCY_ID: this.currencyId,
          START_DATE: this.fromDate,
          END_DATE: this.toDate,
        }),
        this.cityLedgerService.getFiscalDocuments({
          AGENCY_ID: this.agentId,
          START_DATE: this.fromDate,
          END_DATE: this.toDate,
          LIST_FD_TYPE_CODE: [FdTypes.CreditNote, FdTypes.DebitNote, FdTypes.Invoice, FdTypes.Receipt],
        }),
      ]);
      this.property = propertyData?.My_Result ?? null;
      this.statement = statement;
      this.fiscalDocuments = fiscalDocuments ?? [];
    } catch (e: any) {
      this.error = e?.message ?? t('Lcz_FailedToLoadStatementData', { fallback: 'Failed to load statement data.' });
    } finally {
      this.isLoading = false;
    }
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
    if (!this.statement) {
      return (
        <Host>
          <div class="document-state document-state--error">{t('Lcz_NoStatementDataFound', { fallback: 'No statement data found.' })}</div>
        </Host>
      );
    }

    const { STARTING_BALANCE, ENDING_BALANCE } = this.statement;
    const currency = this.property?.currency?.symbol ?? '$';
    const fmt = (v: number | null | undefined) => (v != null ? formatAmount(currency, v) : '—');

    return (
      <Host>
        <div class="document">
          <ir-cl-document-header style={{ marginBottom: '1.75rem' }} property={this.property as any} agentName={this.agentName} documentType="statement"></ir-cl-document-header>

          <table class="cl-table">
            <thead>
              <tr>
                <th class="cl-th">{t('Lcz_DateLabel', { fallback: 'Date' })}</th>
                <th class="cl-th">{t('Lcz_DocumentNumberLabel', { fallback: 'Document #' })}</th>
                <th class="cl-th">{t('Lcz_Type', { fallback: 'Type' })}</th>
                <th class="cl-th cl-th--num">{t('Lcz_Debit', { fallback: 'Debit' })}</th>
                <th class="cl-th cl-th--num">{t('Lcz_Credit', { fallback: 'Credit' })}</th>
                <th class="cl-th cl-th--num">{t('Lcz_Balance', { fallback: 'Balance' })}</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening balance */}
              <tr class="cl-balance-row">
                <td class="cl-td" colSpan={3}>
                  {t('Lcz_OpeningBalanceRow', { fallback: 'Opening Balance — %1', params: [formatDate(this.fromDate, DATE_DISPLAY)] })}
                </td>
                <td class="cl-td"></td>
                <td class="cl-td"></td>
                <td class="cl-td cl-td--num cl-td--bold">{fmt(STARTING_BALANCE)}</td>
              </tr>

              {/* Fiscal document rows */}
              {(() => {
                let running = STARTING_BALANCE;
                return this.fiscalDocuments.map(doc => {
                  running += (doc.DEBIT ?? 0) - (doc.CREDIT ?? 0);
                  return (
                    <tr>
                      <td class="cl-td cl-td--nowrap">{doc.ISSUE_DATE_DISPLAY || (doc.ISSUE_DATE ? formatDate(doc.ISSUE_DATE, DATE_DISPLAY) : '—')}</td>
                      <td class="cl-td">{doc.DOC_NUMBER ? formatBookingNumber(doc.DOC_NUMBER) : '—'}</td>
                      <td class="cl-td">{doc.FD_TYPE_NAME || '—'}</td>
                      <td class="cl-td cl-td--num cl-td--muted">{doc.DEBIT ? fmt(doc.DEBIT) : '—'}</td>
                      <td class="cl-td cl-td--num cl-td--muted">{doc.CREDIT ? fmt(doc.CREDIT) : '—'}</td>
                      <td class="cl-td cl-td--num cl-td--bold">{fmt(running)}</td>
                    </tr>
                  );
                });
              })()}

              {this.fiscalDocuments.length === 0 && (
                <tr>
                  <td class="cl-td cl-td--empty" colSpan={6}>
                    {t('Lcz_NoFiscalDocumentsForPeriod', { fallback: 'No fiscal documents found for this period.' })}
                  </td>
                </tr>
              )}

              {/* Closing balance */}
              <tr class="cl-balance-row">
                <td class="cl-td" colSpan={3}>
                  {t('Lcz_ClosingBalanceRow', { fallback: 'Closing Balance — %1', params: [formatDate(this.toDate, DATE_DISPLAY)] })}
                </td>
                <td class="cl-td"></td>
                <td class="cl-td"></td>
                <td class="cl-td cl-td--num cl-td--bold">{fmt(ENDING_BALANCE)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Host>
    );
  }
}
