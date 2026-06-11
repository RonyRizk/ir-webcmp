import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { CityLedgerService, type FiscalDocument } from '../../../services/city-ledger';
import type { ClFiscalDocumentFilters } from './types';
import type { ICurrency } from '@/models/property';
import { FdTypes } from '@/types/enums';
import moment from 'moment';

@Component({
  tag: 'ir-city-ledger-fiscal-documents',
  styleUrl: 'ir-city-ledger-fiscal-documents.css',
  scoped: true,
})
export class IrCityLedgerFiscalDocuments {
  @Prop() agentId: number | null = null;
  @Prop() currencySymbol: string = '$';
  @Prop() currencies: ICurrency[] = [];
  @Prop() ticket: string;
  @Prop() propertyId: number;
  @Prop() initialFilters: ClFiscalDocumentFilters;

  @Event() clFiscalFiltersChange: EventEmitter<ClFiscalDocumentFilters>;

  @State() private filters: ClFiscalDocumentFilters = {
    fromDate: undefined,
    toDate: undefined,
    docNumber: '',
    taxableOnly: false,
    type: 'all',
    proformaOnly: false,
  };

  componentWillLoad() {
    if (this.initialFilters) {
      this.filters = { ...this.initialFilters };
    }
  }
  @State() private fiscalDocuments: FiscalDocument[] = [];
  @State() private isLoading: boolean = false;
  @State() private hasFetched: boolean = false;

  private cityLedgerService = new CityLedgerService();

  @Watch('agentId')
  handleAgentIdChange() {
    this.fiscalDocuments = [];
    this.hasFetched = false;
  }

  private get filteredDocuments(): FiscalDocument[] {
    return this.fiscalDocuments;
  }
  private async fetchFiscalDocuments(filters: ClFiscalDocumentFilters) {
    if (!this.agentId || (!filters.fromDate && !filters.toDate)) return;

    this.isLoading = true;
    const effectiveFrom = this.filters.fromDate ? this.filters.fromDate : moment(filters.toDate).subtract(5, 'years').format('YYYY-MM-DD');
    const effectiveTo = filters.toDate ? this.filters.toDate : moment(filters.fromDate).add(5, 'years').format('YYYY-MM-DD');
    try {
      const result = await this.cityLedgerService.getFiscalDocuments({
        AGENCY_ID: this.agentId,
        START_DATE: effectiveFrom,
        END_DATE: effectiveTo,
        DOC_NUMBER: filters.docNumber || '',
        LIST_FD_TYPE_CODE: filters.proformaOnly
          ? [FdTypes.Proforma]
          : filters.type === 'all'
            ? [FdTypes.Invoice, FdTypes.Receipt, FdTypes.CreditNote, FdTypes.DebitNote, FdTypes.Draft, FdTypes.CreditReceipt]
            : [filters.type],
      });
      this.fiscalDocuments = result ?? [];
    } catch (err) {
      console.error('[ir-city-ledger-fiscal-documents] getFiscalDocuments error:', err);
    } finally {
      this.isLoading = false;
      this.hasFetched = true;
    }
  }

  render() {
    return (
      <Host>
        <section class="fiscal-documents" aria-label="City ledger fiscal documents">
          <ir-city-ledger-fiscal-documents-filters
            filters={this.filters}
            onFiltersChange={event => {
              this.filters = event.detail;
              this.clFiscalFiltersChange.emit(event.detail);
            }}
            onApplyFilters={event => {
              this.filters = event.detail;
              this.clFiscalFiltersChange.emit(event.detail);
              this.fetchFiscalDocuments(event.detail);
            }}
          ></ir-city-ledger-fiscal-documents-filters>

          <ir-city-ledger-fiscal-documents-table
            isLoading={this.isLoading}
            rows={this.filteredDocuments}
            currencySymbol={this.currencySymbol}
            currencies={this.currencies}
            taxableOnly={this.filters.taxableOnly}
            hasDates={!!(this.filters.fromDate && this.filters.toDate)}
            hasFetched={this.hasFetched}
            ticket={this.ticket}
            propertyId={this.propertyId}
            agentId={this.agentId}
            fromDate={this.filters.fromDate}
            toDate={this.filters.toDate}
            onFetchRequested={() => this.fetchFiscalDocuments(this.filters)}
          ></ir-city-ledger-fiscal-documents-table>
        </section>
      </Host>
    );
  }
}
