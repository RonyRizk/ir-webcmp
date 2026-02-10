import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import type { Agent } from '@/services/agents/type';
import WaSwitch from '@awesome.me/webawesome/dist/components/switch/switch';
import { AgentSetupEntries } from '../types';
import { ICountry } from '@/models/IBooking';
import calendar_data from '@/stores/calendar-data';

@Component({
  tag: 'ir-agents-table',
  styleUrls: ['ir-agents-table.css', '../../../common/table.css'],
  scoped: true,
})
export class IrAgentsTable {
  @Prop() agents: Agent[] = [];
  @Prop() setupEntries: AgentSetupEntries;
  @Prop() countries: ICountry[];
  @Prop() language: string;

  @Event() upsertAgent: EventEmitter<Agent>;
  @Event() deleteAgent: EventEmitter<Agent>;
  @Event() toggleAgentActive: EventEmitter<Agent>;

  private getAgentTypeLabel(agent: Agent) {
    const agentType = this.setupEntries.agent_type.find(t => t.CODE_NAME === agent.agent_type_code.code);
    if (!agentType) {
      console.warn(`couldn't find agent type ${agent?.agent_type_code?.code}`, agent);
      return;
    }
    return agentType[`CODE_VALUE_${this.language?.toUpperCase()}`] || agentType.CODE_VALUE_EN;
  }

  private getAgentPhoneNumber({ phone, country_id }: Agent) {
    if (!phone) {
      return null;
    }

    if (!country_id) {
      return phone;
    }
    const country = this.countries.find(c => c.id.toString() === country_id.toString());
    if (!country) {
      return phone;
    }
    return `${country.phone_prefix} ${phone}`;
  }
  private createAgent = () => {
    this.upsertAgent.emit({
      id: -1,
      name: '',
      code: '',
      address: '',
      city: '',
      country_id: null,
      phone: '',
      email: '',
      email_copied_upon_booking: null,
      contact_name: '',
      tax_nbr: '',
      notes: '',
      question: '',
      agent_rate_type_code: {
        code: '001',
      },
      agent_type_code: {
        code: '',
      },
      payment_mode: {
        code: '001',
      },
      contract_nbr: null,
      currency_id: null,
      due_balance: null,
      sort_order: null,
      property_id: calendar_data.property.id,
      provided_discount: null,
      is_active: true,
      is_send_guest_confirmation_email: false,
      verification_mode: 'code',
    });
  };

  render() {
    return (
      <Host>
        <div class="table--container">
          <table class="table">
            <thead>
              <tr>
                <th class="agents-table__header">Name</th>
                <th class="agents-table__header">Type</th>
                <th class="agents-table__header">Email</th>
                <th class="agents-table__header">Phone</th>
                <th class="agents-table__header">Active</th>
                <th class="agents-table__header ">
                  <div class="agents-table__action">
                    <wa-tooltip for="create-agent-button">New Agent</wa-tooltip>
                    <ir-custom-button onClickHandler={this.createAgent} variant="neutral" appearance="plain" id="create-agent-button" data-testid="create-agent-button">
                      <wa-icon name="plus" style={{ fontSize: '1.2rem' }} label="New Agent"></wa-icon>
                    </ir-custom-button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {this.agents.map(agent => {
                // const status = this.getStatusLabel(agent);
                const typeLabel = this.getAgentTypeLabel(agent);
                return (
                  <tr class="ir-table-row" key={agent.id}>
                    <td class="agents-table__name">
                      <div class="d-flex flex-column">
                        <p>{agent.name}</p>
                        <p class="agents-table__muted">{agent.reference}</p>
                      </div>
                    </td>
                    <td>
                      {/* <wa-badge pill variant={this.typeVariant[typeCode] ?? 'neutral'}>
                        {typeLabel}
                      </wa-badge> */}
                      <div class="d-flex flex-column">
                        <p>{typeLabel}</p>
                        <p class="agents-table__muted">{agent.code}</p>
                      </div>
                    </td>
                    <td>{agent.email || 'N/A'}</td>
                    <td>{this.getAgentPhoneNumber(agent) || 'N/A'}</td>
                    <td>
                      {/* <wa-badge pill variant={this.statusVariant[status] ?? 'neutral'}>
                        {status}
                      </wa-badge> */}
                      <wa-switch
                        onchange={e => this.toggleAgentActive.emit({ ...agent, is_active: (e.target as WaSwitch).checked })}
                        defaultChecked={agent.is_active}
                        checked={agent.is_active}
                      ></wa-switch>
                    </td>
                    <td>
                      <div class="agents-table__action">
                        <ir-custom-button appearance="plain" variant="neutral" onClickHandler={() => this.upsertAgent.emit(agent)}>
                          <wa-icon name="edit" aria-hidden="true" style={{ fontSize: '1.2rem' }}></wa-icon>
                        </ir-custom-button>
                      </div>
                      {/* <ir-custom-button appearance="plain" variant="danger" onClickHandler={() => this.deleteAgent.emit(agent)}>
                        <wa-icon name="trash-can" aria-hidden="true" style={{ fontSize: '1.2rem' }}></wa-icon>
                      </ir-custom-button> */}
                    </td>
                  </tr>
                );
              })}
              {this.agents?.length === 0 && (
                <tr class="empty-row">
                  <td colSpan={6}>
                    <ir-empty-state></ir-empty-state>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Host>
    );
  }
}
