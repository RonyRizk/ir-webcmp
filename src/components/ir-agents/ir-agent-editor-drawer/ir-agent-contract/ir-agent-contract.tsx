import { Component, Host, h, Prop, Event, EventEmitter, Fragment, State, Watch } from '@stencil/core';
import { AgentBaseSchema, type Agent, type AgentRtNaming } from '@/services/agents/type';
import { AgentSetupEntries, AgentsTypes } from '../../types';
import WaRadioGroup from '@awesome.me/webawesome/dist/components/radio-group/radio-group';
import WaSlider from '@awesome.me/webawesome/dist/components/slider/slider';
import WaSwitch from '@awesome.me/webawesome/dist/components/switch/switch';
import calendar_data from '@/stores/calendar-data';
import { z } from 'zod';
import { t } from '@/services/locale/t';
import { RoomTypeCodeMap, toRoomTypeCodeList, toRoomTypeCodeMap } from './room-type-codes';

/** Show the room type search once the list no longer fits the scroll area. */
const ROOM_TYPE_SEARCH_THRESHOLD = 8;

@Component({
  tag: 'ir-agent-contract',
  styleUrl: 'ir-agent-contract.css',
  scoped: true,
})
export class IrAgentContract {
  @Prop() agent?: Agent;
  @Prop() setupEntries: AgentSetupEntries;

  @State() roomTypeCodes: RoomTypeCodeMap = {};
  @State() roomTypeQuery: string = '';

  @Event() agentFieldChanged: EventEmitter<Partial<Agent>>;

  /** Last array this component emitted, so its own echo doesn't rebuild the map mid-typing. */
  private emittedRoomTypeCodes: AgentRtNaming[] | null | undefined;

  componentWillLoad() {
    this.syncRoomTypeCodes();
  }

  @Watch('agent')
  handleAgentChange() {
    this.syncRoomTypeCodes();
  }

  private syncRoomTypeCodes() {
    const list = this.agent?.rt_namings;
    if (list === this.emittedRoomTypeCodes) return;
    this.emittedRoomTypeCodes = list;
    this.roomTypeCodes = toRoomTypeCodeMap(list);
  }

  private updateField(value: Partial<Agent>) {
    const agent = this.agent ?? ({} as Agent);
    this.agentFieldChanged.emit({ ...agent, ...value });
  }

  private handleRoomTypeCodeChange(roomTypeId: number, name: string) {
    this.roomTypeCodes = { ...this.roomTypeCodes, [roomTypeId]: { id: this.roomTypeCodes[roomTypeId]?.id ?? -1, name: name ?? '' } };
    this.emittedRoomTypeCodes = toRoomTypeCodeList(this.roomTypeCodes);
    this.updateField({ rt_namings: this.emittedRoomTypeCodes });
  }

  private renderRoomTypeCodes() {
    const roomTypes = (calendar_data.property?.roomtypes ?? []).filter(rt => rt.is_active && !rt.is_virtual);
    const query = this.roomTypeQuery.trim().toLowerCase();
    const visibleRoomTypes = query ? roomTypes.filter(rt => rt.name.toLowerCase().includes(query)) : roomTypes;

    return (
      <wa-card appearance="plain" class="contract-card contract-card--room-codes" data-testid="agent-contract-room-type-codes-card">
        <p slot="header" class="contract-card__title" data-testid="agent-contract-room-type-codes-title">
          {t('Lcz_RoomTypesAgentCustomCode', { fallback: 'Room Types & Agent Custom Code' })}
        </p>
        {roomTypes.length > ROOM_TYPE_SEARCH_THRESHOLD && (
          <ir-input
            placeholder={t('Lcz_SearchRoomTypesPlaceholder', { fallback: 'Search room types' })}
            withClear
            value={this.roomTypeQuery}
            data-testid="agent-contract-room-type-codes-search"
            onKeyDown={e => e.stopPropagation()}
            onText-change={(e: CustomEvent<string>) => (this.roomTypeQuery = e.detail ?? '')}
          >
            <wa-icon slot="start" name="magnifying-glass"></wa-icon>
          </ir-input>
        )}
        {visibleRoomTypes.length === 0 ? (
          <ir-empty-state
            message={
              roomTypes.length ? t('Lcz_NoRoomTypesMatchSearch', { fallback: 'No room types match your search' }) : t('Lcz_NoActiveRoomTypes', { fallback: 'No active room types' })
            }
          ></ir-empty-state>
        ) : (
          <ul class="room-code-list" data-testid="agent-contract-room-type-codes-list">
            {visibleRoomTypes.map(rt => (
              <li key={rt.id} class="room-code-row" data-testid={`agent-contract-room-type-code-row-${rt.id}`}>
                <span class="room-code-row__name" id={`room-code-name-${rt.id}`}>
                  {rt.name}
                </span>
                <wa-tooltip for={`room-code-name-${rt.id}`}>{rt.name}</wa-tooltip>
                <wa-icon class="room-code-row__arrow" name="arrow-right" aria-hidden="true"></wa-icon>
                <ir-input
                  class="room-code-row__input"
                  placeholder={t('Lcz_AgentCodePlaceholder', { fallback: 'Agent code' })}
                  value={this.roomTypeCodes[rt.id]?.name ?? ''}
                  data-testid={`agent-contract-room-type-code-input-${rt.id}`}
                  onKeyDown={e => e.stopPropagation()}
                  onText-change={(e: CustomEvent<string>) => this.handleRoomTypeCodeChange(rt.id, e.detail)}
                >
                  <span slot="label" class="room-code-row__sr-only">
                    {rt.name}
                  </span>
                </ir-input>
              </li>
            ))}
          </ul>
        )}
      </wa-card>
    );
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
      <Host data-testid="agent-contract" class={{ 'contract--room-codes': isTourOperator }}>
        {!isTourOperator && (
          <wa-card appearance="plain" class="contract-card contract-card--identification" data-testid="agent-contract-identification-card">
            <p slot="header" class="contract-card__title" data-testid="agent-contract-identification-title">
              {t('Lcz_AgentIdentification', { fallback: 'Agent Identification' })}
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
                <div class="radio-title">{t('Lcz_BookingEngineCode', { fallback: 'Booking engine code' })}</div>
                <div class="radio-hint">{t('Lcz_UsedDuringOnlineBooking', { fallback: 'Used during the online booking' })}</div>
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
                      placeholder={t('Lcz_FiveToTenCharactersPlaceholder', { fallback: '5 to 10 characters' })}
                      maxlength={10}
                      minlength={5}
                      value={this.agent?.code}
                      data-testid="agent-contract-verification-code-input"
                      onText-change={(e: CustomEvent<string>) => this.updateField({ code: e.detail || null })}
                    >
                      {this.agent?.code && this.agent?.id !== -1 && <wa-copy-button slot="end" value={this.agent?.code}></wa-copy-button>}
                    </ir-input>
                  </ir-validator>
                </div>
              )}

              {/* OPTION 2 — YES / NO QUESTION */}
              <wa-radio value="question" data-testid="agent-contract-verification-question-radio">
                <div class="radio-title">{t('Lcz_AffiliationYesNoQuestion', { fallback: 'Affiliation Yes/No question' })}</div>
                <div class="radio-hint">{t('Lcz_AnsweringYesAppliesAgencyRates', { fallback: 'Answering **Yes** will apply the agency rates' })}</div>
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
                      placeholder={t('Lcz_ExampleAffiliationQuestionPlaceholder', { fallback: 'e.g. Are you a Wizz Air cabin crew?' })}
                      value={this.agent?.question}
                      data-testid="agent-contract-verification-question-input"
                      onText-change={(e: CustomEvent<string>) => this.updateField({ question: e.detail || null })}
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
            {t('Lcz_Rates', { fallback: 'Rates' })}
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
                  <div class="radio-title">{t('Lcz_UseAgentAssignedRatePlans', { fallback: 'Use agent-assigned rate plans (Net)' })}</div>
                  {/* <div class="radio-hint">Use pre-negotiated net rate plans assigned to this agent.</div> */}
                </div>
              </wa-radio>
              {!isTourOperator && (
                <Fragment>
                  <wa-radio value="reduce_bar" data-testid="agent-contract-rates-reduce-bar-radio">
                    <div>
                      <div class="radio-title">{t('Lcz_ApplyPercentageCommissionOnBar', { fallback: 'Apply a percentage commission on BAR' })}</div>
                      <div class="radio-hint">{t('Lcz_ReduceNightlyBarByFixedPercent', { fallback: 'Reduce the nightly Best Available Rate by a fixed %' })}</div>
                    </div>
                  </wa-radio>
                  {['002', '003'].includes(this.agent?.agent_rate_type_code?.code) && (
                    <div class="rates-extra" data-testid="agent-contract-rates-reduce-bar-section">
                      <wa-slider
                        min={4}
                        max={40}
                        value={this.agent?.provided_discount ?? 4}
                        with-tooltip
                        label={t('Lcz_Commission', { fallback: 'Commission' })}
                        data-testid="agent-contract-rates-commission-slider"
                        onKeyDown={event => event.stopPropagation()}
                        onchange={event => {
                          event.stopPropagation();
                          this.updateField({ provided_discount: (event.target as WaSlider).value });
                        }}
                      >
                        <div slot="label" class={'rates-extra__slider-label'} data-testid="agent-contract-rates-commission-label">
                          <p>{t('Lcz_Commission', { fallback: 'Commission' })}</p>
                          {this.agent?.provided_discount && <p>{this.agent?.provided_discount}%</p>}
                        </div>
                        {/* <span slot="reference">4%</span>
                    <span slot="reference">40%</span> */}
                      </wa-slider>
                      <div class="rates-extra__row" data-testid="agent-contract-rates-non-refundable-row">
                        <div class="rates-extra__text" data-testid="agent-contract-rates-non-refundable-text">
                          <p class="rates-extra__title">{t('Lcz_AppliesToNonRefundableRates', { fallback: 'Applies to Non-Refundable rates' })}</p>
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
                  <div class="radio-title">{t('Lcz_UseContractBasedRates', { fallback: 'Use contract-based rates' })}</div>
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
                      placeholder={t('Lcz_EnterContractReferencePlaceholder', { fallback: 'Enter contract reference' })}
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
            {t('Lcz_CollectionMethod', { fallback: 'Collection Method' })}
          </p>
          {isTourOperator ? (
            <div data-testid="agent-contract-collection-tour-operator">
              <div class="radio-title" data-testid="agent-contract-collection-tour-operator-title">
                {t('Lcz_NetPayLaterCityLedger', { fallback: 'Net pay later (City ledger)' })}
              </div>
              <div class="radio-hint" data-testid="agent-contract-collection-tour-operator-hint">
                {t('Lcz_AgentPaysOnCreditTermsAfterCheckout', { fallback: 'Agent pays on credit terms after guest checkout' })}
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
                  <div class="radio-title">{t('Lcz_NetPayLaterCityLedger', { fallback: 'Net pay later (City ledger)' })}</div>
                  <div class="radio-hint">{t('Lcz_AgentPaysOnCreditTermsAfterCheckout', { fallback: 'Agent pays on credit terms after guest checkout' })}</div>
                </div>
              </wa-radio>

              <wa-radio value="002" data-testid="agent-contract-collection-from-guest-radio">
                <div>
                  <div class="radio-title">{t('Lcz_FromGuest', { fallback: 'From guest' })}</div>
                  <div class="radio-hint">{t('Lcz_PaymentCollectedDirectlyFromGuest', { fallback: 'Payment collected directly from the guest' })}</div>
                </div>
              </wa-radio>
            </wa-radio-group>
          )}
        </wa-card>
        {isTourOperator && this.renderRoomTypeCodes()}
        {/* Post Timing */}
        {/* <wa-card appearance="plain" class="contract-card" data-testid="agent-contract-collection-card">
          <p slot="header" class="contract-card__title" data-testid="agent-contract-collection-title">
            Post Timing
          </p>
          <ir-validator value={this.agent?.cl_post_timing?.code} schema={z.string().nonempty()}>
            <wa-select
              value={this.agent?.cl_post_timing?.code}
              defaultValue={this.agent?.cl_post_timing?.code}
              placeholder={t('Lcz_SelectPlaceholder', { fallback: 'Select...' })}
              onchange={e =>
                this.updateField({
                  cl_post_timing: { code: (e.target as WaSelect).value?.toString() },
                })
              }
              size="s"
            >
              {this.setupEntries?.cl_post_timing?.map(t => (
                <wa-option value={t.CODE_NAME}>{t.CODE_VALUE_EN}</wa-option>
              ))}
            </wa-select>
          </ir-validator>
        </wa-card> */}
      </Host>
    );
  }
}
