import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import moment, { Moment } from 'moment';
import type { FolioFilters } from '../types';
import WaSelect from '@awesome.me/webawesome/dist/components/select/select';
import { Debounce } from '@/decorators/debounce';
import { z } from 'zod';

@Component({
  tag: 'ir-city-ledger-folio-filters',
  styleUrl: 'ir-city-ledger-folio-filters.css',
  scoped: true,
})
export class IrCityLedgerFolioFilters {
  @Prop() isExporting: boolean;

  @State() dates: { from: Moment | null; to: Moment | null } = {
    from: undefined,
    to: undefined,
  };
  @State() statusFilter: string = 'all';
  @State() searchQuery: string = '';

  @Event() filtersChange: EventEmitter<FolioFilters>;
  @Event() addEntry: EventEmitter<void>;
  @Event() applyFilters: EventEmitter<FolioFilters>;
  @Event() exportFolio: EventEmitter<void>;

  componentDidLoad() {
    this.emitFilters();
  }

  private statuses = [
    { value: 'all', label: 'All entries' },
    { value: 'billed', label: 'Billed' },
    { value: 'held', label: 'Held' },
    { value: 'unbilled', label: 'Unbilled' },
    { value: 'unbilled&checkedOut', label: 'Unbilled checkouts' },
  ];

  private emitFilters() {
    this.filtersChange.emit({
      fromDate: this.dates.from?.format('YYYY-MM-DD'),
      toDate: this.dates.to?.format('YYYY-MM-DD'),
      status: this.statusFilter,
      search: this.searchQuery,
    });
  }

  @Debounce(300)
  private emitFiltersDebounced() {
    this.emitFilters();
  }

  render() {
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          this.applyFilters.emit({
            fromDate: this.dates.from?.format('YYYY-MM-DD'),
            toDate: this.dates.to?.format('YYYY-MM-DD'),
            status: this.statusFilter,
            search: this.searchQuery,
          });
        }}
      >
        <div class="filters-bar">
          {/* ── Row 1: Date range ───────────────────────── */}
          <ir-validator value={this.dates?.from?.format('YYYY-MM-DD') || this.dates?.to?.format('YYYY-MM-DD')} schema={z.string().nonempty()} class="filters-bar__dates">
            <ir-date-range-filter
              maxDate={moment().format('YYYY-MM-DD')}
              class="filters-bar__date_picker"
              fromDate={this.dates.from?.format('YYYY-MM-DD') ?? undefined}
              toDate={this.dates.to?.format('YYYY-MM-DD') ?? undefined}
              onDatesChanged={e => {
                const { from, to } = e.detail;
                this.dates = {
                  from: from ? moment(from, 'YYYY-MM-DD') : null,
                  to: to ? moment(to, 'YYYY-MM-DD') : null,
                };
                this.emitFilters();
              }}
            ></ir-date-range-filter>
          </ir-validator>

          {/* ── Row 2: Status + Search ──────────────────── */}
          <div class="filters-bar__search-group">
            <wa-select
              class="filters-bar__status-select"
              value={this.statusFilter}
              onchange={e => {
                this.statusFilter = (e.target as WaSelect).value?.toString();
                this.emitFilters();
              }}
              onwa-clear={() => {
                this.statusFilter = 'all';
                this.emitFilters();
              }}
              placeholder="Status"
              size="small"
              withClear
            >
              {this.statuses.map(s => (
                <wa-option value={s.value} label={s.label}>
                  {s.label}
                </wa-option>
              ))}
            </wa-select>

            <ir-input
              class="filters-bar__search-input"
              onText-change={e => {
                const wasCleared = this.searchQuery !== '' && e.detail === '';
                this.searchQuery = e.detail;
                if (wasCleared) {
                  this.applyFilters.emit({
                    fromDate: this.dates.from?.format('YYYY-MM-DD'),
                    toDate: this.dates.to?.format('YYYY-MM-DD'),
                    status: this.statusFilter,
                    search: '',
                  });
                } else {
                  this.emitFiltersDebounced();
                }
              }}
              onChange={() => {
                this.emitFiltersDebounced();
              }}
              onInputCleared={() =>
                this.applyFilters.emit({
                  fromDate: this.dates.from?.format('YYYY-MM-DD'),
                  toDate: this.dates.to?.format('YYYY-MM-DD'),
                  status: this.statusFilter,
                  search: '',
                })
              }
              value={this.searchQuery}
              placeholder="Booking# or doc number"
              withClear
            >
              <wa-icon name="magnifying-glass" slot="start" class="filters-bar__search-icon"></wa-icon>
            </ir-input>

            <ir-custom-button variant="neutral" type="submit" appearance="outlined">
              <wa-icon name="magnifying-glass"></wa-icon>
            </ir-custom-button>
          </div>

          {/* ── Row 3: Actions ──────────────────────────── */}
          <div class="filters-bar__actions">
            <ir-custom-button loading={this.isExporting} appearance="outlined" disabled={!this.dates.from && !this.dates.to} onClickHandler={() => this.exportFolio.emit()}>
              <wa-icon name="download" slot="start"></wa-icon>
              <span>Export</span>
            </ir-custom-button>
            {/* <wa-dropdown>
              <wa-dropdown-item value="csv">
                <wa-icon slot="icon" name="file-csv"></wa-icon>
                Export as CSV
              </wa-dropdown-item>
              <wa-dropdown-item value="pdf">
                <wa-icon slot="icon" name="file-pdf"></wa-icon>
                Export as PDF
              </wa-dropdown-item>
              <wa-divider></wa-divider>
              <wa-dropdown-item value="print">
                <wa-icon slot="icon" name="print"></wa-icon>
                Print Folio
              </wa-dropdown-item>
            </wa-dropdown> */}

            <ir-custom-button variant="brand" appearance="outlined" onClickHandler={() => this.addEntry.emit()}>
              Add Entry
            </ir-custom-button>
          </div>
        </div>
      </form>
    );
  }
}
