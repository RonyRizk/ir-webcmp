import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';
import Token from '@/models/Token';
import { AgentsService } from '@/services/agents/agents.service';
import type { Agent } from '@/services/agents/type';
import { BookingService } from '@/services/booking-service/booking.service';
import { PropertyService } from '@/services/property.service';
import calendar_data from '@/stores/calendar-data';
import { Moment } from 'moment';
import type {
  TaxOption,
  ServiceCategoryOption,
} from './ir-city-ledger-folio/ir-city-ledger-transaction-drawer/ir-city-ledger-transaction-form/ir-city-ledger-transaction-form.schema';
import type { FolioSummary } from './ir-city-ledger-folio/types';
import { SystemService } from '@/services/system.service';
import { ICurrency } from '@/models/property';
import type { ClFiscalDocumentFilters } from './ir-city-ledger-fiscal-documents/types';
import type { StatementFilters } from './ir-city-ledger-statements/ir-city-ledger-statements-filter/ir-city-ledger-statements-filter';

export type ClPanels = 'folio' | 'fiscal-documents' | 'create-statement';

@Component({
  tag: 'ir-city-ledger',
  styleUrl: 'ir-city-ledger.css',
  scoped: true,
})
export class IrCityLedger {
  @Element() el: HTMLElement;

  @Prop() ticket: string;
  @Prop() p: string;
  @Prop() baseurl: string;
  @Prop() language: string = 'en';
  @Prop() propertyid: number;
  @Prop({ mutable: true }) agentId: number | null = null;

  @State() resolvedPropertyId: number | null = null;
  @State() currentTab: ClPanels = 'folio';
  @State() isLoading: boolean = false;
  @State() agents: Agent[] = [];
  @State() selectedAgent: Agent | null = null;
  @State() taxOptions: TaxOption[] = [];
  @State() serviceCategoryOptions: ServiceCategoryOption[] = [];
  @State() currencySymbol: string = '$';

  // Statement tab state
  @State() statementFrom: Moment | null = null;
  @State() statementTo: Moment | null = null;
  @State() showStatementPreview: boolean = false;
  @State() folioSummary: FolioSummary | null = null;
  @State() agentSearch: string = '';
  @State() fiscalFilters: ClFiscalDocumentFilters = { fromDate: undefined, toDate: undefined, docNumber: '', taxableOnly: false, type: 'all', proformaOnly: false };
  @State() stmtFilters: StatementFilters = { fromDate: null, toDate: null };

  private panels: { id: ClPanels; label: string }[] = [
    { id: 'folio', label: 'Folio' },
    { id: 'fiscal-documents', label: 'Fiscal Documents' },
    { id: 'create-statement', label: 'Create Statement' },
  ];

  private tokenService = new Token();
  private agentsService = new AgentsService();
  private propertyService = new PropertyService();
  private bookingService = new BookingService();
  private systemService = new SystemService();
  private toolbarRef: HTMLIrCityLedgerToolbarElement;
  private createInvoiceDialogRef: HTMLIrClInvoiceDialogElement;

  private currencies: ICurrency[] = [];

  private get filteredAgents(): Agent[] {
    const q = this.agentSearch.trim().toLowerCase();
    if (!q) return this.agents;
    return this.agents.filter(a => a.name.toLowerCase().includes(q));
  }

  componentWillLoad() {
    const agentId = this.getAgentIdFromSearchParams();
    if (agentId && !this.agentId) {
      this.agentId = agentId;
    }
    if (this.ticket) {
      if (this.baseurl) {
        this.tokenService.setBaseUrl(this.baseurl);
      }
      this.tokenService.setToken(this.ticket);
      this.init();
    }
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue === oldValue) return;
    if (this.baseurl) this.tokenService.setBaseUrl(this.baseurl);
    this.tokenService.setToken(this.ticket);
    this.init();
  }

  @Watch('propertyid')
  handlePropertyIdChange(newValue: number, oldValue: number) {
    if (newValue === oldValue) return;
    if (this.ticket) this.init();
  }

  @Watch('agentId')
  handleAgentIdChange(newId: number | null, oldId: number | null) {
    if (newId === oldId || this.isLoading) return;
    this.applyAgentIdProp();
  }

  private getAgentIdFromSearchParams(): number | null {
    const agentId = new URLSearchParams(window.location.search).get('agentId');

    return agentId ? Number(agentId) : null;
  }

  private applyAgentIdProp() {
    if (this.agentId == null) return;
    const agent = this.agents.find(a => a.id === this.agentId);
    if (!agent) return;
    this.selectedAgent = agent;
    this.showStatementPreview = false;
    this.folioSummary = null;
    requestAnimationFrame(() => {
      const autocomplete = this.el.querySelector('ir-autocomplete') as any;
      if (autocomplete) autocomplete.value = agent.name;
    });
  }

  private async init() {
    try {
      this.isLoading = true;

      // If a property name was supplied but no numeric id, resolve the id first.
      let propertyId = this.propertyid;
      if (!propertyId && this.p) {
        await this.propertyService.getExposedProperty({ id: null, language: this.language, aname: this.p });
        propertyId = calendar_data.id;
      }

      this.resolvedPropertyId = propertyId;
      const resolvedByName = !this.propertyid && !!this.p;
      const [, setupEntries, agents, currencies] = await Promise.all([
        resolvedByName ? Promise.resolve() : this.propertyService.getExposedProperty({ id: propertyId, language: this.language }),
        this.bookingService.getSetupEntriesByTableNameMulti(['_SVC_CATEGORY']),
        this.agentsService.getExposedAgents({ property_id: propertyId }),
        this.systemService.getExposedCurrencies(),
      ]);
      this.currencies = currencies;
      this.agents = agents ?? [];
      this.applyAgentIdProp();

      const { svc_category } = this.bookingService.groupEntryTablesResult(setupEntries);
      this.serviceCategoryOptions = (svc_category ?? []).map(entry => ({
        id: entry.CODE_NAME,
        label: entry.CODE_VALUE_EN,
      }));

      this.currencySymbol = calendar_data.currency?.symbol ?? '$';
    } catch (error) {
      console.error('Failed to initialize city ledger', error);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    if (this.isLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }

    return (
      <Host>
        <ir-page label={'City Ledger'} description={this.selectedAgent?.name}>
          {/* Agent selector in page header */}
          <i slot="page-description" style={{ marginLeft: '0.5rem' }}>
            {this.selectedAgent?.code}
          </i>
          <ir-autocomplete
            slot="page-header"
            // size="medium"
            placeholder="Select agent"
            class="city-ledger__agents-autocomplete"
            onText-change={(e: CustomEvent<string>) => {
              this.agentSearch = e.detail ?? '';
            }}
            onCombobox-change={(e: CustomEvent<string>) => {
              this.agentSearch = '';
              this.selectedAgent = e.detail ? this.agents?.find(agent => agent.id === Number(e.detail)) : null;
              this.showStatementPreview = false;
              this.folioSummary = null;
              this.fiscalFilters = { fromDate: undefined, toDate: undefined, docNumber: '', taxableOnly: false, type: 'all', proformaOnly: false };
              this.stmtFilters = { fromDate: null, toDate: null };
              // Update URL search param
              if (this.selectedAgent) {
                const url = new URL(window.location.href);
                url.searchParams.set('agentId', this.selectedAgent.id.toString());
                window.history.replaceState({}, '', url);
              }
            }}
          >
            {this.filteredAgents.map(agent => (
              <ir-autocomplete-option key={agent.id} label={agent.name} value={String(agent.id)}>
                {agent.name}
              </ir-autocomplete-option>
            ))}
          </ir-autocomplete>

          {/* No-agent prompt */}
          {!this.selectedAgent ? (
            <ir-empty-state message="Select an agent to get started" class="city-ledger__no-agent">
              <div slot="icon" class={'city-ledger__no-agent-icon-container'}>
                <wa-icon name="building" class="city-ledger__no-agent-icon"></wa-icon>
              </div>
              <p class="city-ledger__no-agent-sub">Choose an agent from the selector above to view their city ledger folio, fiscal documents, and statements.</p>
            </ir-empty-state>
          ) : (
            <div class="city-ledger__content">
              {/* Toolbar — stats + Create Invoice, visible only when agent selected */}
              <ir-city-ledger-toolbar
                ref={el => (this.toolbarRef = el)}
                agentId={this.selectedAgent?.id}
                currencySymbol={this.currencySymbol}
                onCreateInvoice={() => this.createInvoiceDialogRef.openModal()}
              ></ir-city-ledger-toolbar>

              <wa-tab-group
                activation="manual"
                onwa-tab-show={e => {
                  this.currentTab = e.detail.name.toString() as ClPanels;
                }}
                active={this.currentTab}
              >
                {this.panels.map(panel => (
                  <wa-tab key={panel.id} panel={panel.id}>
                    {panel.label}
                  </wa-tab>
                ))}

                <wa-tab-panel name="folio">
                  {/* {this.currentTab === 'folio' && ( */}
                  <ir-city-ledger-folio
                    agent={this.selectedAgent}
                    propertyId={this.resolvedPropertyId}
                    ticket={this.ticket}
                    language={this.language}
                    serviceCategoryOptions={this.serviceCategoryOptions}
                    currencies={this.currencies}
                    onFolioSummaryUpdate={e => (this.folioSummary = e.detail)}
                  ></ir-city-ledger-folio>
                  {/* )} */}
                </wa-tab-panel>

                <wa-tab-panel name="fiscal-documents">
                  {/* {this.currentTab === 'fiscal-documents' && ( */}
                  <ir-city-ledger-fiscal-documents
                    agentId={this.selectedAgent?.id}
                    currencySymbol={calendar_data.property?.currency?.symbol}
                    currencies={this.currencies}
                    ticket={this.ticket}
                    propertyId={this.resolvedPropertyId}
                    initialFilters={this.fiscalFilters}
                    onClFiscalFiltersChange={e => (this.fiscalFilters = e.detail)}
                  ></ir-city-ledger-fiscal-documents>
                  {/* )} */}
                </wa-tab-panel>

                <wa-tab-panel name="create-statement" class="statement-tab-panel">
                  {/* {this.currentTab === 'create-statement' && ( */}
                  <ir-city-ledger-statements
                    agentId={this.selectedAgent?.id}
                    agentName={this.selectedAgent?.name ?? ''}
                    currencySymbol={calendar_data.property?.currency?.symbol}
                    currencies={this.currencies}
                    ticket={this.ticket}
                    propertyId={this.resolvedPropertyId}
                    initialFilters={this.stmtFilters}
                    onClStmtFiltersChange={e => (this.stmtFilters = e.detail)}
                  ></ir-city-ledger-statements>
                  {/* )} */}
                </wa-tab-panel>
              </wa-tab-group>
            </div>
          )}
        </ir-page>

        <ir-cl-invoice-dialog
          ref={el => (this.createInvoiceDialogRef = el)}
          agentId={this.selectedAgent?.id}
          onInvoiceIssued={async () => {
            await this.toolbarRef?.refresh();
          }}
        ></ir-cl-invoice-dialog>
        <ir-cl-fiscal-document-preview
          ticket={this.ticket}
          propertyId={calendar_data?.property?.id}
          onDocumentConverted={() => this.toolbarRef?.refresh()}
        ></ir-cl-fiscal-document-preview>
      </Host>
    );
  }
}
