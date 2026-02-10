import { Component, Host, h, Prop, Event, EventEmitter, Fragment } from '@stencil/core';
import { AgentBaseSchema, type Agent } from '@/services/agents/type';
import { AgentSetupEntries, AgentsTypes } from '../../types';
import WaRadioGroup from '@awesome.me/webawesome/dist/components/radio-group/radio-group';
import WaSlider from '@awesome.me/webawesome/dist/components/slider/slider';
import WaSwitch from '@awesome.me/webawesome/dist/components/switch/switch';
import { z } from 'zod';

@Component({
  tag: 'ir-agent-contract',
  styleUrl: 'ir-agent-contract.css',
  scoped: true,
})
export class IrAgentContract {
  @Prop() agent?: Agent;
  @Prop() setupEntries: AgentSetupEntries;

  @Event() agentFieldChanged: EventEmitter<Partial<Agent>>;

  componentWillLoad() {}

  private updateField(value: Partial<Agent>) {
    const agent = this.agent ?? ({} as Agent);
    this.agentFieldChanged.emit({ ...agent, ...value });
  }

  private handleRatesChange = (event: Event) => {
    const value = (event.currentTarget as WaRadioGroup).value;
    let payload: Partial<Agent> = {};
    // Reduce BAR → default to 003
    if (value === 'reduce_bar') {
      payload = { agent_rate_type_code: { code: '003' } };
      const discount = this.agent?.provided_discount;
      if (discount == null || Number.isNaN(discount)) {
        payload = { ...payload, provided_discount: 4 };
      }
    }

    // Other modes
    if (value === 'agent_rate_plans') {
      payload = { agent_rate_type_code: { code: '001' } };
    }

    if (value === 'contract_reference') {
      payload = { agent_rate_type_code: { code: '004' } };
    }
    this.updateField(payload);
  };

  private get selectedRate() {
    const code = this.agent?.agent_rate_type_code?.code;

    if (code === '002' || code === '003') return 'reduce_bar';
    if (code === '001') return 'agent_rate_plans';
    if (code === '004') return 'contract_reference';

    return undefined;
  }

  render() {
    const isTourOperator = this.agent?.agent_type_code?.code === AgentsTypes.TOUR_OPERATOR;
    return (
      <Host data-testid="agent-contract">
        {!isTourOperator && (
          <wa-card appearance="plain" class="contract-card contract-card--identification" data-testid="agent-contract-identification-card">
            <p slot="header" class="contract-card__title" data-testid="agent-contract-identification-title">
              Agent Identification
            </p>

            <wa-radio-group
              class="identification-mode rate-mode"
              value={this.agent?.verification_mode}
              data-testid="agent-contract-verification-mode-group"
              onchange={e => {
                this.updateField({
                  verification_mode: (e.currentTarget as WaRadioGroup).value.toString(),
                });
              }}
            >
              {/* OPTION 1 — CODE */}
              <wa-radio value="code" data-testid="agent-contract-verification-code-radio">
                <div class="radio-title">Booking engine code</div>
                <div class="radio-hint">Used during the online booking</div>
              </wa-radio>
              {this.agent?.verification_mode === 'code' && (
                <div class="rates-extra" data-testid="agent-contract-verification-code-section">
                  <ir-validator
                    schema={z.string().min(5).max(10)}
                    value={this.agent?.code}
                    valueEvent="text-change input input-change"
                    data-testid="agent-contract-verification-code-validator"
                  >
                    <ir-input
                      mask={{
                        mask: /^[A-Z0-9]{0,10}$/,
                        prepare: (value: string) => value.toUpperCase(),
                      }}
                      onKeyDown={e => {
                        e.stopPropagation();
                      }}
                      placeholder="5 to 10 characters"
                      maxlength={10}
                      minlength={5}
                      value={this.agent?.code}
                      data-testid="agent-contract-verification-code-input"
                      onText-change={(e: CustomEvent<string>) => this.updateField({ code: e.detail })}
                    >
                      {this.agent?.code && this.agent?.id !== -1 && <wa-copy-button slot="end" value={this.agent?.code}></wa-copy-button>}
                    </ir-input>
                  </ir-validator>
                </div>
              )}

              {/* OPTION 2 — YES / NO QUESTION */}
              <wa-radio value="question" data-testid="agent-contract-verification-question-radio">
                <div class="radio-title">Affiliation Yes/No question</div>
                <div class="radio-hint">
                  Answering <b>Yes</b> will apply the agency rates
                </div>
              </wa-radio>
              {this.agent?.verification_mode === 'question' && (
                <div class="rates-extra" data-testid="agent-contract-verification-question-section">
                  <ir-validator
                    schema={z.string().nonempty()}
                    value={this.agent?.question}
                    valueEvent="text-change input input-change"
                    data-testid="agent-contract-verification-question-validator"
                  >
                    <ir-input
                      onKeyDown={e => {
                        e.stopPropagation();
                      }}
                      placeholder="e.g. Are you a Wizz Air cabin crew?"
                      value={this.agent?.question}
                      data-testid="agent-contract-verification-question-input"
                      onText-change={(e: CustomEvent<string>) => this.updateField({ question: e.detail })}
                    />
                  </ir-validator>
                </div>
              )}
            </wa-radio-group>
          </wa-card>
        )}

        {/* Rates */}
        <wa-card appearance="plain" class={`contract-card`} data-testid="agent-contract-rates-card">
          <p slot="header" class="contract-card__title" data-testid="agent-contract-rates-title">
            Rates
          </p>
          {/* TODO: Switch 002 with 003 */}

          <ir-validator
            schema={AgentBaseSchema.shape.agent_rate_type_code}
            value={this.agent?.agent_rate_type_code}
            valueEvent="change"
            data-testid="agent-contract-rates-validator"
          >
            <wa-radio-group name="rates" class="rate-mode" value={this.selectedRate} data-testid="agent-contract-rates-group" onchange={this.handleRatesChange}>
              <wa-radio value="agent_rate_plans" data-testid="agent-contract-rates-agent-rate-plans-radio">
                <div>
                  <div class="radio-title">Use agent-assigned rate plans (Net)</div>
                  {/* <div class="radio-hint">Use pre-negotiated net rate plans assigned to this agent.</div> */}
                </div>
              </wa-radio>
              {!isTourOperator && (
                <Fragment>
                  <wa-radio value="reduce_bar" data-testid="agent-contract-rates-reduce-bar-radio">
                    <div>
                      <div class="radio-title">Apply a percentage commission on BAR</div>
                      <div class="radio-hint">Reduce the nightly Best Available Rate by a fixed %</div>
                    </div>
                  </wa-radio>
                  {['002', '003'].includes(this.agent?.agent_rate_type_code?.code) && (
                    <div class="rates-extra" data-testid="agent-contract-rates-reduce-bar-section">
                      <wa-slider
                        min={4}
                        max={40}
                        value={this.agent?.provided_discount ?? 4}
                        with-tooltip
                        label="Commission"
                        data-testid="agent-contract-rates-commission-slider"
                        onKeyDown={event => event.stopPropagation()}
                        onchange={event => {
                          event.stopPropagation();
                          this.updateField({ provided_discount: (event.target as WaSlider).value });
                        }}
                      >
                        <div slot="label" class={'rates-extra__slider-label'} data-testid="agent-contract-rates-commission-label">
                          <p>Commission</p>
                          {this.agent?.provided_discount && <p>{this.agent?.provided_discount}%</p>}
                        </div>
                        {/* <span slot="reference">4%</span>
                    <span slot="reference">40%</span> */}
                      </wa-slider>
                      <div class="rates-extra__row" data-testid="agent-contract-rates-non-refundable-row">
                        <div class="rates-extra__text" data-testid="agent-contract-rates-non-refundable-text">
                          <p class="rates-extra__title">Applies to Non-Refundable rates</p>
                          {/* <p class="rates-extra__hint">Apply a percentage commission on BAR</p> */}
                        </div>
                        <wa-switch
                          class="rates-extra__switch"
                          checked={this.agent?.agent_rate_type_code?.code === '002'}
                          defaultChecked={this.agent?.agent_rate_type_code?.code === '002'}
                          data-testid="agent-contract-rates-non-refundable-switch"
                          onKeyDown={event => {
                            event.stopPropagation();
                          }}
                          onchange={event => {
                            event.stopPropagation();
                            this.updateField({ agent_rate_type_code: { code: (event.target as WaSwitch).checked ? '002' : '003' } });
                          }}
                        ></wa-switch>
                      </div>
                    </div>
                  )}
                </Fragment>
              )}

              <wa-radio value="contract_reference" data-testid="agent-contract-rates-contract-reference-radio">
                <div>
                  <div class="radio-title">Use contract-based rates</div>
                  {/* <div class="radio-hint">Apply rates defined in a specific contract reference.</div> */}
                </div>
              </wa-radio>
              {this.agent?.agent_rate_type_code?.code === '004' && (
                <div class="rates-extra" data-testid="agent-contract-rates-contract-reference-section">
                  <ir-validator
                    schema={z.string().nonempty()}
                    value={this.agent?.contract_nbr}
                    valueEvent="text-change input input-change"
                    data-testid="agent-contract-rates-contract-reference-validator"
                  >
                    <ir-input
                      placeholder="Enter contract reference"
                      onKeyDown={e => {
                        e.stopPropagation();
                      }}
                      maxlength={50}
                      value={this.agent?.contract_nbr}
                      data-testid="agent-contract-rates-contract-reference-input"
                      onText-change={e => this.updateField({ contract_nbr: e.detail })}
                    ></ir-input>
                  </ir-validator>
                </div>
              )}
            </wa-radio-group>
          </ir-validator>
        </wa-card>

        {/* Collection Method */}
        <wa-card appearance="plain" class="contract-card" data-testid="agent-contract-collection-card">
          <p slot="header" class="contract-card__title" data-testid="agent-contract-collection-title">
            Collection Method
          </p>
          {isTourOperator ? (
            <div data-testid="agent-contract-collection-tour-operator">
              <div class="radio-title" data-testid="agent-contract-collection-tour-operator-title">
                Net pay later (City ledger)
              </div>
              <div class="radio-hint" data-testid="agent-contract-collection-tour-operator-hint">
                Agent pays on credit terms after guest checkout
              </div>
            </div>
          ) : (
            <wa-radio-group
              class="rate-mode"
              name="collection"
              value={this.agent?.payment_mode?.code}
              data-testid="agent-contract-collection-group"
              onchange={e => {
                const code = (e.currentTarget as WaRadioGroup).value.toString();
                const paymentMethod = this.setupEntries.ta_payment_method.find(c => c.CODE_NAME === code);
                if (!paymentMethod) {
                  return;
                }
                this.updateField({
                  payment_mode: {
                    code: paymentMethod.CODE_NAME,
                    description: paymentMethod.CODE_VALUE_EN,
                  },
                });
              }}
            >
              <wa-radio value="001" data-testid="agent-contract-collection-city-ledger-radio">
                <div>
                  <div class="radio-title">Net pay later (City ledger)</div>
                  <div class="radio-hint">Agent pays on credit terms after guest checkout</div>
                </div>
              </wa-radio>

              <wa-radio value="002" data-testid="agent-contract-collection-from-guest-radio">
                <div>
                  <div class="radio-title">From guest</div>
                  <div class="radio-hint">Payment collected directly from the guest</div>
                </div>
              </wa-radio>
            </wa-radio-group>
          )}
        </wa-card>
      </Host>
    );
  }
}
