import { ICountry } from '@/models/IBooking';
import ApiClient from '@/models/ApiClient';
import { AgentsService } from '@/services/agents/agents.service';
import type { Agent, Agents } from '@/services/agents/type';
import { BookingService } from '@/services/booking-service/booking.service';
import { SetupService, groupEntryTablesResult } from '@/services/setup';
import { Component, Host, Listen, Prop, State, Watch, h } from '@stencil/core';
import { AgentSetupEntries } from './types';
import calendar_data from '@/stores/calendar-data';
import { PropertyService } from '@/services/property.service';
import { showToast } from '@/utils/utils';
import { LocaleController } from '@/services/locale/locale.controller';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';
import { LanguageSync } from '@/services/locale/language-sync';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-agents',
  styleUrl: 'ir-agents.css',
  scoped: true,
})
export class IrAgents {
  /**
   * Authentication ApiClient issued by the PMS backend.
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

  private agentsService = new AgentsService();
  private propertyService = new PropertyService();
  private bookingService = new BookingService();
  private setupService = new SetupService();

  private apiClientService = new ApiClient();
  private languageSync = new LanguageSync(SCREEN_TABLES.agents, () => this.init());

  componentWillLoad() {
    if (this.ticket) {
      this.apiClientService.setApiClient(this.ticket);
      this.init();
    }
  }

  componentDidLoad() {
    this.languageSync.connect();
  }

  disconnectedCallback() {
    this.languageSync.disconnect();
  }

  @Watch('language')
  languageChanged(next: string, previous: string) {
    this.languageSync.propChanged(next, previous);
  }

  @Watch('ticket')
  handleTicketChange() {
    this.apiClientService.setApiClient(this.ticket);
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
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.agents });
      if (!this.propertyid && !this.p) {
        throw new Error('Missing credentials');
      }
      let propertyId = this.propertyid;

      if (!propertyId) {
        await this.propertyService.getExposedProperty({
          id: 0,
          aname: this.p,
          language: LocaleController.language,
          is_backend: true,
        });
      }
      const [countries, setupEntries] = await Promise.all([
        this.bookingService.getCountries(LocaleController.language),
        this.setupService.getSetupEntriesByTableNameMulti(['_AGENT_RATE_TYPE', '_AGENT_TYPE', '_TA_PAYMENT_METHOD', '_CL_POST_TIMING']),
        localeReady,
        calendar_data?.property
          ? Promise.resolve(null)
          : this.propertyService.getExposedProperty({
              id: this.propertyid || 0,
              language: LocaleController.language,
              aname: this.p,
            }),
        this.fetchAgents(),
      ]);
      const { agent_rate_type, agent_type, ta_payment_method, cl_post_timing } = groupEntryTablesResult(setupEntries);
      this.setupEntries = {
        agent_rate_type,
        agent_type,
        ta_payment_method,
        cl_post_timing,
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
      showToast({
        type: 'success',
        description: '',
        title: t('Lcz_SavedSuccessfully', { fallback: 'Saved Successfully' }),
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
            <h3 class="page-title">{t('Lcz_AgentsCompanies', { fallback: 'Agents/Companies' })}</h3>
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
        <ir-dialog
          label={t('Lcz_DeleteAgent', { fallback: 'Delete Agent' })}
          open={this.isDeleteDialogOpen}
          lightDismiss={false}
          onIrDialogHide={() => this.handleDeleteDialogClose()}
        >
          <span>
            {this.selectedAgent
              ? t('Lcz_ConfirmDeleteAgentNamed', {
                  fallback: `Are you sure you want to delete ${this.selectedAgent.name}? This action permanently removes the agent and cannot be undone.`,
                  params: [this.selectedAgent.name],
                })
              : t('Lcz_ConfirmDeleteAgent', { fallback: 'Are you sure you want to delete this agent? This action permanently removes the agent and cannot be undone.' })}
          </span>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button data-dialog="close" size="m" appearance="filled" variant="neutral">
              {t('Lcz_Cancel', { fallback: 'Cancel' })}
            </ir-custom-button>
            <ir-custom-button size="m" appearance="accent" variant="danger" onClickHandler={() => this.confirmDeleteAgent()}>
              {t('Lcz_Delete', { fallback: 'Delete' })}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
