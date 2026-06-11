import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import type { ClFiscalDocumentFilters } from '../types';
import WaOption from '@awesome.me/webawesome/dist/components/option/option';
import moment from 'moment';
import { FdTypes } from '@/types/enums';
import { Debounce } from '@/decorators/debounce';
import { z } from 'zod';

const today = moment();
type FdType = (typeof FdTypes)[keyof typeof FdTypes];

@Component({
  tag: 'ir-city-ledger-fiscal-documents-filters',
  styleUrl: 'ir-city-ledger-fiscal-documents-filters.css',
  scoped: true,
})
export class IrCityLedgerFiscalDocumentsFilters {
  @Prop() filters: ClFiscalDocumentFilters = {
    fromDate: undefined,
    toDate: undefined,
    docNumber: '',
    taxableOnly: false,
    type: 'all',
    proformaOnly: false,
  };

  @State() private docNumber: string = '';

  @Event() filtersChange: EventEmitter<ClFiscalDocumentFilters>;
  @Event() applyFilters: EventEmitter<ClFiscalDocumentFilters>;

  componentWillLoad() {
    this.docNumber = this.filters.docNumber ?? '';
  }

  private typeOptions: Array<{ label: string; value: FdType | 'all' }> = [
    { label: 'All Document Types', value: 'all' },
    { label: 'Invoices', value: FdTypes.Invoice },
    { label: 'Receipts', value: FdTypes.Receipt },
    { label: 'Credit Notes', value: FdTypes.CreditNote },
    // { label: 'Debit Notes', value: FdTypes.DebitNote },
    { label: 'Credit Receipt', value: FdTypes.CreditReceipt },
  ];

  private updateFilters(patch: Partial<ClFiscalDocumentFilters>) {
    this.filtersChange.emit({ ...this.filters, ...patch });
  }

  @Debounce(300)
  private emitSearchDebounced(value: string) {
    this.updateFilters({ docNumber: value });
  }

  render() {
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          this.applyFilters.emit(this.filters);
        }}
      >
        <div class="filters-bar">
          {/* ── Date range ───────────────────────── */}
          <ir-validator value={this.filters?.fromDate || this.filters?.toDate} schema={z.string().nonempty()} class="filters-bar__dates">
            <ir-date-range-filter
              maxDate={today.format('YYYY-MM-DD')}
              class="filters-bar__date_picker"
              fromDate={this.filters.fromDate}
              toDate={this.filters.toDate}
              onDatesChanged={e => this.updateFilters({ fromDate: e.detail.from, toDate: e.detail.to })}
            ></ir-date-range-filter>
          </ir-validator>

          {/* ── Type + Taxes switch + Search + Apply ── */}
          <div class="filters-bar__search-group">
            {/* type + tax switch always sit side-by-side */}
            <div class="filters-bar__type-group">
              <wa-select
                class="filters-bar__status-select"
                value={this.filters.type}
                defaultValue={this.filters.type}
                onchange={e => this.updateFilters({ type: (e.target as WaOption).value as any })}
                size="small"
                placeholder="Document Type"
              >
                {this.typeOptions.map(option => (
                  <wa-option value={option.value} key={option.value}>
                    {option.label}
                  </wa-option>
                ))}
              </wa-select>

              <wa-switch
                class="filters-bar__tax-switch"
                checked={this.filters.taxableOnly}
                onchange={e => this.updateFilters({ taxableOnly: (e.target as HTMLInputElement).checked })}
              >
                Taxes
              </wa-switch>

              <wa-switch
                class="filters-bar__proforma-switch"
                checked={this.filters.proformaOnly}
                onchange={e => {
                  const updated = { ...this.filters, proformaOnly: (e.target as HTMLInputElement).checked };
                  this.filtersChange.emit(updated);
                  this.applyFilters.emit(updated);
                }}
              >
                Proforma
              </wa-switch>
            </div>

            <ir-input
              class="filters-bar__search-input"
              placeholder="Search by doc number"
              value={this.docNumber}
              onText-change={e => {
                this.docNumber = e.detail;
                this.emitSearchDebounced(e.detail);
              }}
              withClear
            >
              <wa-icon name="magnifying-glass" slot="start" class="filters-bar__search-icon"></wa-icon>
            </ir-input>

            <ir-custom-button variant="neutral" appearance="outlined" type="submit">
              <wa-icon name="magnifying-glass"></wa-icon>
            </ir-custom-button>
          </div>
        </div>
      </form>
    );
  }
}
