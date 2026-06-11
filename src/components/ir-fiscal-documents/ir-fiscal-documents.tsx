import { Component, Prop, State, Watch, h } from '@stencil/core';
import Token from '@/models/Token';
import moment from 'moment';
import { CityLedgerService } from '@/services/city-ledger';
import { FdTypes } from '@/types/enums';
import { FiscalDocumentFilters, FiscalDocumentRow } from './types';

@Component({
  tag: 'ir-fiscal-documents',
  styleUrl: 'ir-fiscal-documents.css',
  scoped: true,
})
export class IrFiscalDocuments {
  @Prop() ticket: string;
  @Prop() baseurl: string;
  @Prop() language: string = 'en';
  @Prop() propertyid: number;

  @State() filters: FiscalDocumentFilters = {
    fromDate: undefined,
    toDate: undefined,
    docNumber: '',
    taxableOnly: false,
    type: 'all',
    proformaOnly: false,
    folioType: 'all',
    agentId: null,
    guestId: null,
  };

  @State() private rows: FiscalDocumentRow[] = [];
  @State() private isLoading: boolean = false;
  @State() private hasFetched: boolean = false;

  private tokenService = new Token();
  private cityLedgerService = new CityLedgerService();

  componentWillLoad() {
    if (this.baseurl) {
      this.tokenService.setBaseUrl(this.baseurl);
    }
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
    }
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue === oldValue) return;
    if (this.baseurl) {
      this.tokenService.setBaseUrl(this.baseurl);
    }
    this.tokenService.setToken(this.ticket);
  }

  private async fetchFiscalDocuments(filters: FiscalDocumentFilters) {
    if (!filters.fromDate && !filters.toDate) return;

    this.isLoading = true;
    const effectiveFrom = filters.fromDate ? filters.fromDate : moment(filters.toDate).subtract(5, 'years').format('YYYY-MM-DD');
    const effectiveTo = filters.toDate ? filters.toDate : moment(filters.fromDate).add(5, 'years').format('YYYY-MM-DD');
    const listFdTypeCode = filters.proformaOnly
      ? [FdTypes.Proforma]
      : filters.type === 'all'
        ? [FdTypes.Invoice, FdTypes.Receipt, FdTypes.CreditNote, FdTypes.DebitNote, FdTypes.Draft, FdTypes.CreditReceipt]
        : [filters.type];

    try {
      // Only the agent-scoped folio maps onto the existing city-ledger endpoint
      // (it requires AGENCY_ID). The "all folios" and "guest folio" scopes need a
      // dedicated backend endpoint that is not available yet.
      if (filters.folioType === 'agent' && filters.agentId) {
        const result = await this.cityLedgerService.getFiscalDocuments({
          AGENCY_ID: filters.agentId,
          START_DATE: effectiveFrom,
          END_DATE: effectiveTo,
          DOC_NUMBER: filters.docNumber || '',
          LIST_FD_TYPE_CODE: listFdTypeCode,
        });
        this.rows = result ?? [];
      } else {
        // TODO: wire all-folios / guest-folio fetch once the backend endpoint exists.
        console.warn('[ir-fiscal-documents] fetch for folioType="%s" is not wired yet — no endpoint available.', filters.folioType);
        this.rows = [];
      }
    } catch (err) {
      console.error('[ir-fiscal-documents] getFiscalDocuments error:', err);
    } finally {
      this.isLoading = false;
      this.hasFetched = true;
    }
  }

  render() {
    return (
      <ir-page label="Fiscal Documents">
        <ir-fiscal-documents-filters
          propertyId={this.propertyid}
          filters={this.filters}
          onFiltersChange={e => (this.filters = e.detail)}
          onApplyFilters={e => {
            this.filters = e.detail;
            this.fetchFiscalDocuments(e.detail);
          }}
        ></ir-fiscal-documents-filters>
        <ir-fiscal-documents-table
          rows={this.rows}
          isLoading={this.isLoading}
          hasFetched={this.hasFetched}
          taxableOnly={this.filters.taxableOnly}
          hasDates={!!(this.filters.fromDate && this.filters.toDate)}
          fromDate={this.filters.fromDate}
          toDate={this.filters.toDate}
          folioType={this.filters.folioType}
          agentId={this.filters.agentId}
          guestId={this.filters.guestId}
          ticket={this.ticket}
          propertyId={this.propertyid}
          onFetchRequested={() => this.fetchFiscalDocuments(this.filters)}
        ></ir-fiscal-documents-table>
      </ir-page>
    );
  }
}
