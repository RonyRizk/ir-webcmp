import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import type { IProperty } from '@/models/property';
import { CityLedgerService, type CLStatements, type FiscalDocument } from '@/services/city-ledger';
import { PropertyService } from '@/services/property.service';
import { formatAmount } from '@/utils/utils';
import Token from '@/models/Token';
import moment from 'moment';
import { FdTypes } from '@/types/enums';

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

  private tokenService = new Token();
  private propertyService = new PropertyService();
  private cityLedgerService = new CityLedgerService();
  private hasEmitted: boolean = false;

  componentWillLoad() {
    if (!this.ticket) {
      this.error = 'Authentication ticket is required.';
      return;
    }
    if (this.baseurl) this.tokenService.setBaseUrl(this.baseurl);
    this.tokenService.setToken(this.ticket);
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
        this.propertyService.getExposedProperty({ id: this.propertyId, language: 'en' }),
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
      this.error = e?.message ?? 'Failed to load statement data.';
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    if (!this.ticket) {
      return (
        <Host>
          <div class="document-state document-state--error">Authentication ticket is required.</div>
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
          <div class="document-state document-state--error">No statement data found.</div>
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
                <th class="cl-th">Date</th>
                <th class="cl-th">Document #</th>
                <th class="cl-th">Type</th>
                <th class="cl-th cl-th--num">Debit</th>
                <th class="cl-th cl-th--num">Credit</th>
                <th class="cl-th cl-th--num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening balance */}
              <tr class="cl-balance-row">
                <td class="cl-td" colSpan={3}>
                  Opening Balance — {moment(this.fromDate).format(DATE_DISPLAY)}
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
                      <td class="cl-td cl-td--nowrap">{doc.ISSUE_DATE_DISPLAY || (doc.ISSUE_DATE ? moment(doc.ISSUE_DATE).format(DATE_DISPLAY) : '—')}</td>
                      <td class="cl-td">{doc.DOC_NUMBER || '—'}</td>
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
                    No fiscal documents found for this period.
                  </td>
                </tr>
              )}

              {/* Closing balance */}
              <tr class="cl-balance-row">
                <td class="cl-td" colSpan={3}>
                  Closing Balance — {moment(this.toDate).format(DATE_DISPLAY)}
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
