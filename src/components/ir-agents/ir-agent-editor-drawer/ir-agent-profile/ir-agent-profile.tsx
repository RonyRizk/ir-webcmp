import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';

import { AgentBaseSchema, type Agent } from '@/services/agents/type';
import { ICountry } from '@/models/IBooking';
import { AgentSetupEntries, AgentsTypes } from '../../types';

@Component({
  tag: 'ir-agent-profile',
  styleUrl: 'ir-agent-profile.css',
  scoped: true,
})
export class IrAgentProfile {
  @Prop() agent?: Agent;
  @Prop() countries: ICountry[];
  @Prop() setupEntries: AgentSetupEntries;

  @Event() agentFieldChanged: EventEmitter<Partial<Agent>>;

  private updateField(value: Partial<Agent>) {
    const agent = this.agent ?? ({} as Agent);
    this.agentFieldChanged.emit({ ...agent, ...value });
  }

  private getCountryPhonePrefix() {
    if (!this.agent?.country_id) {
      return;
    }
    const country = this.countries.find(c => c.id.toString() === this.agent.country_id.toString());
    if (!country) {
      return;
    }
    return country.phone_prefix;
  }

  render() {
    const agent = this.agent;
    const phone_prefix = this.getCountryPhonePrefix();
    return (
      <Host data-testid="agent-profile">
        {/* Business information */}
        <wa-card appearance="plain" class="agent-card --business-info" data-testid="agent-profile-business-card">
          <p slot="header" data-testid="agent-profile-business-title">
            Business Information
          </p>

          <div class="agent-form-group">
            <ir-validator schema={AgentBaseSchema?.shape?.agent_type_code} value={agent?.agent_type_code} valueEvent="change" data-testid="agent-profile-agent-type-validator">
              <wa-select
                size="small"
                placeholder="Select agent type ..."
                value={agent?.agent_type_code?.code}
                defaultValue={agent?.agent_type_code?.code}
                data-testid="agent-profile-agent-type-select"
                onchange={e => {
                  const code = (e.target as HTMLSelectElement).value;
                  let payload: Partial<Agent> = { agent_type_code: { code, description: '' } };
                  if (code === AgentsTypes.TOUR_OPERATOR) {
                    payload = {
                      ...payload,
                      payment_mode: {
                        code: '001',
                      },
                      verification_mode: null,
                      provided_discount: null,
                      code: null,
                      question: null,
                      agent_rate_type_code: {
                        code: '001',
                      },
                    };
                  }
                  this.updateField(payload);
                }}
              >
                {this.setupEntries.agent_type?.filter(t=>t.CODE_NAME!=='004').map(agent => (
                  <wa-option key={agent.CODE_NAME} value={agent.CODE_NAME} data-testid={`agent-profile-agent-type-option-${agent.CODE_NAME}`}>
                    {agent.CODE_VALUE_EN}
                  </wa-option>
                ))}
              </wa-select>
            </ir-validator>

            <ir-validator schema={AgentBaseSchema.shape.name} value={agent?.name} valueEvent="text-change input input-change" data-testid="agent-profile-business-name-validator">
              <ir-input
                autocomplete="none"
                placeholder="Business name"
                value={agent?.name}
                data-testid="agent-profile-business-name-input"
                onText-change={(e: CustomEvent<string>) => this.updateField({ name: e.detail })}
              />
            </ir-validator>

            <ir-validator
              schema={AgentBaseSchema.shape.tax_nbr}
              value={agent?.tax_nbr}
              valueEvent="text-change input input-change"
              data-testid="agent-profile-tax-number-validator"
            >
              <ir-input
                placeholder="Tax number"
                value={agent?.tax_nbr}
                data-testid="agent-profile-tax-number-input"
                onText-change={(e: CustomEvent<string>) => this.updateField({ tax_nbr: e.detail })}
              />
            </ir-validator>
            <ir-validator
              schema={AgentBaseSchema.shape.reference}
              value={agent?.reference}
              valueEvent="text-change input input-change"
              data-testid="agent-profile-reference-validator"
            >
              <ir-input
                mask={{
                  mask: /^[A-Za-z0-9 ]*$/,
                }}
                maxlength={20}
                placeholder="Codename"
                value={agent?.reference}
                data-testid="agent-profile-reference-input"
                onText-change={(e: CustomEvent<string>) => this.updateField({ reference: e.detail })}
              />
            </ir-validator>
          </div>
        </wa-card>

        {/* Billing address */}
        <wa-card appearance="plain" class="agent-card" data-testid="agent-profile-billing-card">
          <p slot="header" data-testid="agent-profile-billing-title">
            Billing Address
          </p>

          <div class="agent-form-group">
            <ir-validator
              schema={AgentBaseSchema.shape.country_id}
              value={agent?.country_id}
              valueEvent="text-change input input-change"
              data-testid="agent-profile-country-validator"
            >
              <ir-country-picker
                placeholder="Country"
                country={this.countries.find(c => agent?.country_id?.toString() === c.id?.toString())}
                countries={this.countries}
                variant="modern"
                data-testid="agent-profile-country-picker"
                onCountryChange={event => this.updateField({ country_id: event.detail.id })}
              ></ir-country-picker>
            </ir-validator>

            <ir-validator schema={AgentBaseSchema.shape.city} value={agent?.city} valueEvent="text-change input input-change" data-testid="agent-profile-city-validator">
              <ir-input
                placeholder="City"
                value={agent?.city}
                data-testid="agent-profile-city-input"
                onText-change={(e: CustomEvent<string>) => this.updateField({ city: e.detail })}
              />
            </ir-validator>

            <ir-validator schema={AgentBaseSchema.shape.address} value={agent?.address} valueEvent="text-change input input-change" data-testid="agent-profile-address-validator">
              <ir-input
                placeholder="Address"
                value={agent?.address}
                data-testid="agent-profile-address-input"
                onText-change={(e: CustomEvent<string>) => this.updateField({ address: e.detail })}
              />
            </ir-validator>
          </div>
        </wa-card>

        {/* Contact information */}
        <wa-card appearance="plain" class="agent-card" data-testid="agent-profile-contact-card">
          <p slot="header" data-testid="agent-profile-contact-title">
            Contact Information
          </p>

          <div class="agent-form-group">
            <ir-validator schema={AgentBaseSchema.shape.contact_name} value={agent?.contact_name} data-testid="agent-profile-contact-name-validator">
              <ir-input
                placeholder="Name"
                value={agent?.contact_name}
                data-testid="agent-profile-contact-name-input"
                onText-change={(e: CustomEvent<string>) => this.updateField({ contact_name: e.detail })}
              />
            </ir-validator>

            <ir-validator schema={AgentBaseSchema.shape.phone} value={agent?.phone} data-testid="agent-profile-phone-validator">
              <ir-input
                placeholder="Phone"
                value={agent?.phone}
                data-testid="agent-profile-phone-input"
                onText-change={(e: CustomEvent<string>) => this.updateField({ phone: e.detail })}
              >
                {phone_prefix && (
                  <span slot="start" data-testid="agent-profile-phone-prefix">
                    {phone_prefix}
                  </span>
                )}
              </ir-input>
            </ir-validator>

            <ir-validator schema={AgentBaseSchema.shape.email} value={agent?.email} data-testid="agent-profile-email-validator">
              <ir-input
                placeholder="Email"
                value={agent?.email}
                data-testid="agent-profile-email-input"
                onText-change={(e: CustomEvent<string>) => this.updateField({ email: e.detail ?? null })}
              />
            </ir-validator>

            <ir-validator schema={AgentBaseSchema.shape.email_copied_upon_booking} value={agent?.email_copied_upon_booking} data-testid="agent-profile-email-bcc-validator">
              <ir-input
                placeholder="Email BCCed on booking notifications"
                // hint="Additional email address to receive booking notifications"
                value={agent?.email_copied_upon_booking}
                data-testid="agent-profile-email-bcc-input"
                onText-change={(e: CustomEvent<string>) => this.updateField({ email_copied_upon_booking: e.detail })}
              />
            </ir-validator>

            <ir-validator schema={AgentBaseSchema.shape.notes} value={agent?.notes} valueEvent="input change" data-testid="agent-profile-notes-validator">
              <wa-textarea
                placeholder="Note"
                size="small"
                value={agent?.notes}
                defaultValue={agent?.notes}
                data-testid="agent-profile-notes-textarea"
                onchange={e => this.updateField({ notes: (e.target as HTMLTextAreaElement).value })}
              />
            </ir-validator>
          </div>
        </wa-card>
      </Host>
    );
  }
}
