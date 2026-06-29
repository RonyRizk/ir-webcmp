import { FdTypes } from '@/types/enums';
import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import moment from 'moment';
import { FiscalDocumentFilters, FiscalFolioType } from '../types';
import { z } from 'zod';
import WaOption from '@awesome.me/webawesome/dist/components/option/option';
import { AgentsService } from '@/services/agents/agents.service';
import { Agent } from '@/services/agents/type';
import { BookingService } from '@/services/booking-service/booking.service';
import { ExposedGuests } from '@/services/booking-service/types';
import { isRequestPending } from '@/stores/ir-interceptor.store';

const today = moment();
type FdType = (typeof FdTypes)[keyof typeof FdTypes];

/** Sentinel option in the agent autocomplete meaning "no specific agent" (the default). */
const ALL_AGENTS_VALUE = 'all';
const ALL_AGENTS_LABEL = 'All agents';

const DEFAULT_FILTERS: FiscalDocumentFilters = {
  fromDate: null,
  toDate: null,
  docNumber: '',
  taxableOnly: false,
  type: 'all',
  proformaOnly: false,
  folioType: 'all',
  agentId: null,
  guestId: null,
  searchBy: 'doc_nbr',
};

@Component({
  tag: 'ir-fiscal-documents-filters',
  styleUrl: 'ir-fiscal-documents-filters.css',
  scoped: true,
})
export class IrFiscalDocumentsFilters {
  @Prop() propertyId: number;
  @Prop() loading: 'search' | 'export';
  /** Initial filter values. Edits are kept locally and only sent on submit. */
  @Prop() filters: FiscalDocumentFilters = { ...DEFAULT_FILTERS };

  /** Working copy of the filters — edited locally, emitted to the parent only on submit. */
  @State() private draft: FiscalDocumentFilters = { ...DEFAULT_FILTERS };
  @State() private agents: Agent[] = [];
  @State() private agentSearch: string = '';
  @State() private guests: ExposedGuests = [];

  @Event() applyFilters: EventEmitter<FiscalDocumentFilters>;
  @Event() filterChanged: EventEmitter<FiscalDocumentFilters>;

  private agentsService = new AgentsService();
  private bookingService = new BookingService();

  componentWillLoad() {
    this.draft = { ...DEFAULT_FILTERS, ...this.filters };
    if (this.propertyId) {
      this.fetchAgents();
    }
  }

  @Watch('filters')
  handleFiltersChange(newValue: FiscalDocumentFilters) {
    // Re-sync the local draft when the parent pushes a new filter set.
    this.draft = { ...DEFAULT_FILTERS, ...newValue };
  }

  @Watch('propertyId')
  handlePropertyIdChange(newValue: number, oldValue: number) {
    if (newValue && newValue !== oldValue) {
      this.fetchAgents();
    }
  }

  private typeOptions: Array<{ label: string; value: FdType | 'all' }> = [
    { label: 'All document types', value: 'all' },
    { label: 'Invoices', value: FdTypes.Invoice },
    { label: 'Receipts', value: FdTypes.Receipt },
    { label: 'Credit Notes', value: FdTypes.CreditNote },
    // { label: 'Debit Notes', value: FdTypes.DebitNote },
    { label: 'Credit Receipt', value: FdTypes.CreditReceipt },
  ];

  private folioOptions: Array<{ label: string; value: FiscalFolioType }> = [
    { label: 'All folios', value: 'all' },
    { label: 'Agent folio', value: 'agent' },
    { label: 'Guest folio', value: 'guest' },
  ];

  private get filteredAgents(): Agent[] {
    const q = this.agentSearch.trim().toLowerCase();
    if (!q) return this.agents;
    return this.agents.filter(a => a.name.toLowerCase().includes(q));
  }

  private get searchPlaceholder(): string {
    return this.draft.folioType === 'guest' ? `Search by ${this.draft?.searchBy === 'booking_nbr' ? 'booking number' : 'doc number'}` : 'Search by doc number';
  }

  private async fetchAgents() {
    try {
      const agents = await this.agentsService.getExposedAgents({ property_id: this.propertyId });
      this.agents = agents ?? [];
    } catch (error) {
      console.error('Failed to fetch agents', error);
    }
  }

  private async fetchGuests(email: string) {
    try {
      if (!email) {
        return;
      }
      this.guests = await this.bookingService.fetchExposedGuest(email, this.propertyId);
    } catch (error) {
      console.error('Failed to fetch guests', error);
    }
  }

  /** Updates the local draft only — nothing is sent to the parent until submit. */
  private updateDraft(patch: Partial<FiscalDocumentFilters>) {
    this.draft = { ...this.draft, ...patch };
  }

  private handleFolioTypeChange(folioType: FiscalFolioType) {
    // Reset the folio-scoped selections whenever the folio scope changes.
    this.agentSearch = '';
    this.guests = [];
    this.updateDraft({ folioType, agentId: null, guestId: null, searchBy: 'doc_nbr' });
  }

  private handleGuestSelect(e: CustomEvent) {
    const guest = this.guests?.find(g => g.id?.toString() === e.detail.item.value);
    if (!guest) {
      console.warn(`guest not found with id ${e.detail.item.value}`);
      return;
    }
    this.updateDraft({ guestId: guest.id });
  }

  render() {
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          const submitter = (e as SubmitEvent).submitter as any | null;
          this.applyFilters.emit({ ...this.draft, export: submitter?.value === 'export' });
        }}
      >
        <div class="filters-bar">
          {/* ── Date range ───────────────────────── */}
          <ir-validator value={this.draft?.fromDate || this.draft?.toDate} schema={z.string().nonempty()} class="filters-bar__dates">
            <ir-date-range-filter
              maxDate={today.format('YYYY-MM-DD')}
              class="filters-bar__date_picker"
              fromDate={this.draft.fromDate}
              toDate={this.draft.toDate}
              onDatesChanged={e => {
                this.updateDraft({ fromDate: e.detail.from, toDate: e.detail.to });
                this.filterChanged.emit({ ...this.draft, fromDate: e.detail.from, toDate: e.detail.to });
              }}
            ></ir-date-range-filter>
          </ir-validator>

          {/* ── Type + Taxes switch + Search + Apply ── */}
          <div class="filters-bar__search-group">
            {/* type + tax switch always sit side-by-side */}
            <div class="filters-bar__type-group">
              <wa-select
                class="filters-bar__status-select"
                value={this.draft.type}
                defaultValue={this.draft.type}
                onchange={e => this.updateDraft({ type: (e.target as WaOption).value as any })}
                size="s"
                placeholder="Document Type"
              >
                {this.typeOptions.map(option => (
                  <wa-option value={option.value} key={option.value}>
                    {option.label}
                  </wa-option>
                ))}
              </wa-select>
              <wa-select
                class="filters-bar__status-select"
                value={this.draft.folioType}
                defaultValue={this.draft.folioType}
                onchange={e => this.handleFolioTypeChange((e.target as WaOption).value as FiscalFolioType)}
                size="s"
                placeholder="Folios"
              >
                {this.folioOptions.map(option => (
                  <wa-option value={option.value} key={option.value}>
                    {option.label}
                  </wa-option>
                ))}
              </wa-select>
              {/* <wa-switch
                class="filters-bar__tax-switch"
                checked={this.draft.taxableOnly}
                onchange={e => {
                  this.updateDraft({ taxableOnly: (e.target as HTMLInputElement).checked });
                  this.filterChanged.emit({ ...this.draft, taxableOnly: (e.target as HTMLInputElement).checked });
                }}
              >
                Taxes
              </wa-switch> */}
            </div>

            {/* ── Agent folio → agents autocomplete ── */}
            {this.draft.folioType === 'agent' && (
              <ir-autocomplete
                class="filters-bar__folio-select"
                size="s"
                placeholder="Select agent"
                withExpandIcon
                value={this.draft.agentId ? (this.agents.find(a => a.id === this.draft.agentId)?.name ?? '') : ALL_AGENTS_LABEL}
                onText-change={(e: CustomEvent<string>) => {
                  this.agentSearch = e.detail ?? '';
                }}
                onCombobox-change={(e: CustomEvent<string | string[]>) => {
                  this.agentSearch = '';
                  const value = e.detail as string;
                  this.updateDraft({ agentId: value && value !== ALL_AGENTS_VALUE ? Number(value) : null });
                }}
              >
                <ir-autocomplete-option label={ALL_AGENTS_LABEL} value={ALL_AGENTS_VALUE}>
                  {ALL_AGENTS_LABEL}
                </ir-autocomplete-option>
                {this.filteredAgents.map(agent => (
                  <ir-autocomplete-option key={agent.id} label={agent.name} value={String(agent.id)}>
                    {agent.name}
                  </ir-autocomplete-option>
                ))}
              </ir-autocomplete>
            )}

            {/* ── Guest folio → guest search picker ── */}
            {this.draft.folioType === 'guest' && (
              <ir-picker
                class="filters-bar__folio-select"
                size="s"
                placeholder="Customer email or name"
                withClear
                mode="select-async"
                debounce={500}
                loading={isRequestPending('/Fetch_Exposed_Guests')}
                onText-change={event => this.fetchGuests(event.detail)}
                onCombobox-select={this.handleGuestSelect.bind(this)}
                onCombobox-clear={() => {
                  this.updateDraft({ guestId: null });
                  this.applyFilters.emit(this.draft);
                }}
              >
                {this.guests?.map(guest => {
                  const label = `${guest.email} - ${guest.first_name} ${guest.last_name}`;
                  return (
                    <ir-picker-item label={label} value={guest.id?.toString()} key={guest.id}>
                      {label}
                    </ir-picker-item>
                  );
                })}
              </ir-picker>
            )}

            <div class={`filters-bar__search-actions${this.draft.folioType === 'guest' ? ' filters-bar__search-actions--wide' : ''}`}>
              <div class="filters-bar__search-combo">
                <ir-input
                  class={`filters-bar__search-input${this.draft.folioType === 'guest' ? ' filters-bar__combo-input' : ''}`}
                  placeholder={this.searchPlaceholder}
                  value={this.draft.docNumber}
                  onText-change={e => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    this.updateDraft({ docNumber: e.detail });
                  }}
                  withClear
                  onInputCleared={e => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    this.applyFilters.emit({ ...this.draft, docNumber: '' });
                  }}
                >
                  <wa-icon name="magnifying-glass" slot="start" class="filters-bar__search-icon"></wa-icon>
                </ir-input>
                {this.draft.folioType === 'guest' && (
                  <wa-select
                    class="filters-bar__combo-select"
                    size="s"
                    value={this.draft.searchBy}
                    defaultValue={this.draft.searchBy}
                    onchange={e => this.updateDraft({ searchBy: (e.target as HTMLSelectElement).value as 'doc_nbr' | 'booking_nbr' })}
                  >
                    <wa-option value="doc_nbr">Document number</wa-option>
                    <wa-option value="booking_nbr">Booking number</wa-option>
                  </wa-select>
                )}
              </div>

              <wa-tooltip for="search-btn">Search</wa-tooltip>
              <ir-custom-button
                id="search-btn"
                loading={this.loading === 'search'}
                class="filters-bar__search-submit"
                value="search"
                variant="neutral"
                appearance="outlined"
                type="submit"
              >
                <wa-icon name="magnifying-glass"></wa-icon>
              </ir-custom-button>
              <wa-tooltip for="excel-btn">{'Export to excel'}</wa-tooltip>
              <ir-custom-button
                disabled={!(this.draft?.fromDate || this.draft?.toDate)}
                id="excel-btn"
                variant="neutral"
                loading={this.loading === 'export'}
                appearance="outlined"
                type="submit"
                value="export"
              >
                <wa-icon name="file-excel" variant="regular"></wa-icon>
              </ir-custom-button>
            </div>
          </div>
        </div>
      </form>
    );
  }
}
