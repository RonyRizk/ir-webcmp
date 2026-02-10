import { ICountry } from '@/models/IBooking';
import Token from '@/models/Token';
import { AgentsService } from '@/services/agents/agents.service';
import type { Agent, Agents } from '@/services/agents/type';
import { BookingService } from '@/services/booking-service/booking.service';
import { Component, Event, EventEmitter, Host, Listen, Prop, State, Watch, h } from '@stencil/core';
import { AgentSetupEntries } from './types';
import { IToast } from '../ui/ir-toast/toast';
import calendar_data from '@/stores/calendar-data';
import { PropertyService } from '@/services/property.service';

@Component({
  tag: 'ir-agents',
  styleUrl: 'ir-agents.css',
  scoped: true,
})
export class IrAgents {
  /**
   * Authentication token issued by the PMS backend.
   * Required for initializing the component and making API calls.
   */
  @Prop() ticket: string;

  /**
   * ID of the property (hotel) for which arrivals should be displayed.
   * Used in API calls related to rooms, bookings, and check-ins.
   */
  @Prop() propertyid: number;

  /**
   * Two-letter language code (ISO) used for translations and API locale.
   * Defaults to `'en'`.
   */
  @Prop() language: string = 'en';

  /**
   * Property alias or short identifier used by backend endpoints (aname).
   * Passed to `getExposedProperty` when initializing the component.
   */
  @Prop() p: string;

  @State() agents: Agents = [];
  @State() selectedAgent: Agent | null = null;
  @State() isDrawerOpen: boolean = false;
  @State() isDeleteDialogOpen: boolean = false;
  @State() isLoading = true;
  @State() countries: ICountry[];
  @State() setupEntries: AgentSetupEntries;

  @Event() toast: EventEmitter<IToast>;

  private agentsService = new AgentsService();
  private propertyService = new PropertyService();
  private bookingService = new BookingService();

  private tokenService = new Token();

  componentWillLoad() {
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
      this.init();
    }
  }

  @Watch('ticket')
  handleTicketChange() {
    this.tokenService.setToken(this.ticket);
    this.init();
  }

  @Listen('upsertAgent')
  handleUpsertAgentListener(e: CustomEvent<Agent>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.upsertAgent();
  }

  private async init() {
    try {
      this.isLoading = true;
      if (!this.propertyid && !this.p) {
        throw new Error('Missing credentials');
      }
      let propertyId = this.propertyid;

      if (!propertyId) {
        await this.propertyService.getExposedProperty({
          id: 0,
          aname: this.p,
          language: this.language,
          is_backend: true,
        });
      }
      const [countries, setupEntries] = await Promise.all([
        this.bookingService.getCountries(this.language),
        this.bookingService.getSetupEntriesByTableNameMulti(['_AGENT_RATE_TYPE', '_AGENT_TYPE', '_TA_PAYMENT_METHOD']),
        calendar_data?.property
          ? Promise.resolve(null)
          : this.propertyService.getExposedProperty({
              id: this.propertyid || 0,
              language: this.language,
              aname: this.p,
            }),
        this.fetchAgents(),
      ]);
      const { agent_rate_type, agent_type, ta_payment_method } = this.bookingService.groupEntryTablesResult(setupEntries);
      this.setupEntries = {
        agent_rate_type,
        agent_type,
        ta_payment_method,
      };
      this.countries = countries;
      this.isLoading = false;
    } catch (error) {
      console.error(error);
    }
  }

  private upsertAgent() {
    this.fetchAgents();
  }

  private async fetchAgents() {
    const agents = await this.agentsService.getExposedAgents({ property_id: calendar_data?.property ? calendar_data?.property.id : this.propertyid });
    this.agents = agents.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }

  private handleUpsertAgent(agent: Agent) {
    this.selectedAgent = agent;
    this.isDrawerOpen = true;
  }

  private handleDeleteAgent(agent: Agent) {
    this.selectedAgent = agent;
    this.isDeleteDialogOpen = true;
  }

  private handleDrawerClose() {
    this.isDrawerOpen = false;
    this.selectedAgent = null;
  }

  private handleDeleteDialogClose() {
    this.isDeleteDialogOpen = false;
    this.selectedAgent = null;
  }

  private confirmDeleteAgent() {
    if (!this.selectedAgent) {
      return;
    }
    this.agents = this.agents.filter(agent => agent.id !== this.selectedAgent?.id);
    this.handleDeleteDialogClose();
  }
  private async handleToggleAgentStatus(agent: Agent) {
    try {
      await this.agentsService.handleExposedAgent({ agent });
      this.upsertAgent();
      this.toast.emit({
        type: 'success',
        description: '',
        title: 'Saved Successfully',
        position: 'top-right',
      });
    } catch (error) {
      console.error(error);
    }
  }
  render() {
    if (this.isLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    return (
      <Host data-testid="ir-agents">
        <ir-toast></ir-toast>
        <ir-interceptor handledEndpoints={['/Get_Rooms_To_Check_in']}></ir-interceptor>
        <div class="ir-page__container">
          <div class="page-header__container">
            <h3 class="page-title">Agents/Companies</h3>
          </div>
          <ir-agents-table
            countries={this.countries}
            setupEntries={this.setupEntries}
            onToggleAgentActive={event => this.handleToggleAgentStatus(event.detail)}
            agents={this.agents}
            onUpsertAgent={event => this.handleUpsertAgent(event.detail)}
            onDeleteAgent={event => this.handleDeleteAgent(event.detail)}
          ></ir-agents-table>
        </div>
        <ir-agent-editor-drawer
          setupEntries={this.setupEntries}
          countries={this.countries}
          open={this.isDrawerOpen}
          agent={this.selectedAgent ?? undefined}
          onAgentEditorClose={() => this.handleDrawerClose()}
        ></ir-agent-editor-drawer>
        <ir-dialog label="Delete Agent" open={this.isDeleteDialogOpen} lightDismiss={false} onIrDialogHide={() => this.handleDeleteDialogClose()}>
          <span>
            {this.selectedAgent
              ? `Are you sure you want to delete ${this.selectedAgent.name}? This action permanently removes the agent and cannot be undone.`
              : 'Are you sure you want to delete this agent? This action permanently removes the agent and cannot be undone.'}
          </span>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button data-dialog="close" size="medium" appearance="filled" variant="neutral">
              Cancel
            </ir-custom-button>
            <ir-custom-button size="medium" appearance="accent" variant="danger" onClickHandler={() => this.confirmDeleteAgent()}>
              Delete
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
