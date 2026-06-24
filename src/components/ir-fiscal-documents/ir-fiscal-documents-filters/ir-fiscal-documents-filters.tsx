import { Debounce } from '@/decorators/debounce';
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

@Component({
  tag: 'ir-fiscal-documents-filters',
  styleUrl: 'ir-fiscal-documents-filters.css',
  scoped: true,
})
export class IrFiscalDocumentsFilters {
  @Prop() propertyId: number;
  @Prop() filters: FiscalDocumentFilters = {
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

  @State() private docNumber: string = '';
  @State() private agents: Agent[] = [];
  @State() private agentSearch: string = '';
  @State() private guests: ExposedGuests = [];

  @Event() filtersChange: EventEmitter<FiscalDocumentFilters>;
  @Event() applyFilters: EventEmitter<FiscalDocumentFilters>;

  private agentsService = new AgentsService();
  private bookingService = new BookingService();

  componentWillLoad() {
    this.docNumber = this.filters.docNumber ?? '';
    if (this.propertyId) {
      this.fetchAgents();
    }
  }

  @Watch('propertyId')
  handlePropertyIdChange(newValue: number, oldValue: number) {
    if (newValue && newValue !== oldValue) {
      this.fetchAgents();
    }
  }

  private typeOptions: Array<{ label: string; value: FdType | 'all' }> = [
    { label: 'All Document Types', value: 'all' },
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
    return this.filters.folioType === 'guest' ? 'Search by doc or booking number' : 'Search by doc number';
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

  private updateFilters(patch: Partial<FiscalDocumentFilters>) {
    this.filtersChange.emit({ ...this.filters, ...patch });
  }

  private handleFolioTypeChange(folioType: FiscalFolioType) {
    // Reset the folio-scoped selections whenever the folio scope changes.
    this.agentSearch = '';
    this.guests = [];
    this.updateFilters({ folioType, agentId: null, guestId: null });
  }

  private handleGuestSelect(e: CustomEvent) {
    const guest = this.guests?.find(g => g.id?.toString() === e.detail.item.value);
    if (!guest) {
      console.warn(`guest not found with id ${e.detail.item.value}`);
      return;
    }
    this.updateFilters({ guestId: guest.id });
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
                value={this.filters.folioType}
                defaultValue={this.filters.folioType}
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
              <wa-switch
                class="filters-bar__tax-switch"
                checked={this.filters.taxableOnly}
                onchange={e => this.updateFilters({ taxableOnly: (e.target as HTMLInputElement).checked })}
              >
                Taxes
              </wa-switch>
            </div>

            {/* ── Agent folio → agents autocomplete ── */}
            {this.filters.folioType === 'agent' && (
              <ir-autocomplete
                class="filters-bar__folio-select"
                size="s"
                placeholder="Select agent"
                value={this.filters.agentId ? (this.agents.find(a => a.id === this.filters.agentId)?.name ?? '') : ALL_AGENTS_LABEL}
                onText-change={(e: CustomEvent<string>) => {
                  this.agentSearch = e.detail ?? '';
                }}
                onCombobox-change={(e: CustomEvent<string | string[]>) => {
                  this.agentSearch = '';
                  const value = e.detail as string;
                  this.updateFilters({ agentId: value && value !== ALL_AGENTS_VALUE ? Number(value) : null });
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
            {this.filters.folioType === 'guest' && (
              <ir-picker
                class="filters-bar__folio-select"
                size="s"
                placeholder="Search customer by email or name"
                withClear
                mode="select-async"
                debounce={500}
                loading={isRequestPending('/Fetch_Exposed_Guests')}
                onText-change={event => this.fetchGuests(event.detail)}
                onCombobox-select={this.handleGuestSelect.bind(this)}
                onCombobox-clear={() => this.updateFilters({ guestId: null })}
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

            <div class="filters-bar__search-actions">
              <ir-input
                class="filters-bar__search-input"
                placeholder={this.searchPlaceholder}
                value={this.docNumber}
                onText-change={e => {
                  this.docNumber = e.detail;
                  this.emitSearchDebounced(e.detail);
                }}
                withClear
              >
                <wa-icon name="magnifying-glass" slot="start" class="filters-bar__search-icon"></wa-icon>
              </ir-input>

              <ir-custom-button class="filters-bar__search-submit" variant="neutral" appearance="outlined" type="submit">
                <wa-icon name="magnifying-glass"></wa-icon>
              </ir-custom-button>
            </div>
          </div>
        </div>
      </form>
    );
  }
}
