import calendar_data from '@/stores/calendar-data';
import locales from '@/stores/locales.store';
import { Agent } from '@/services/agents/type';
import { Component, Fragment, Host, Prop, h } from '@stencil/core';
import { _formatTime, isAgentMode } from '../functions';
import moment from 'moment';
import { Booking } from '@/models/booking.dto';
import type { ClTx } from '@/services/city-ledger/types';
import { mapClTxToFolioRow } from '@/components/ir-city-ledger/ir-city-ledger-folio/types';

@Component({
  tag: 'ir-pickup-view',
  styleUrl: 'ir-pickup-view.css',
  scoped: true,
})
export class IrPickupView {
  @Prop() booking: Booking;
  @Prop() agent: Agent;
  @Prop() clTransactions: ClTx[] = [];

  private get matchedTx(): ClTx | null {
    const sysId = (this.booking.pickup_info as any)?.system_id;
    if (sysId == null) return null;
    return this.clTransactions.find(tx => tx.REL_ENTITY_KEY === sysId) ?? null;
  }

  render() {
    if (!calendar_data.pickup_service.is_enabled || !this.booking.is_editable) {
      return null;
    }

    const { pickup_info } = this.booking;
    const isAgent = isAgentMode(this.agent);
    const tx = this.matchedTx;
    const statusTag = tx ? (
      <ir-cl-status-tag style={{ marginInlineStart: '0.5rem' }} transaction={{ _rowId: '', ...mapClTxToFolioRow(tx), balance: 0 }} size="extra-small"></ir-cl-status-tag>
    ) : null;

    return (
      <Host>
        <wa-card>
          <p slot="header" class={'font-size-large p-0 m-0'}>
            {locales.entries.Lcz_Pickup}
          </p>
          <wa-tooltip for="pickup">{pickup_info ? 'Edit' : 'Add'} pickup</wa-tooltip>
          <ir-custom-button slot="header-actions" id="pickup" size="small" appearance="plain" variant="neutral">
            <wa-icon name="edit" style={{ fontSize: '1rem' }}></wa-icon>
          </ir-custom-button>

          {pickup_info ? (
            <Fragment>
              {isAgent && (
                <p class={`service-group__label${pickup_info.agent ? ' --agent' : ''}`}>
                  {pickup_info.agent ? pickup_info.agent.name : 'Guest'}
                  <span>Folio</span>
                </p>
              )}

              <div class={`pickup-body${isAgent ? (pickup_info.agent ? ' pickup-body--agent' : ' pickup-body--guest') : ''}`}>
                <div class="pickup-row pickup-row--header">
                  <span class="pickup-datetime">
                    {moment(pickup_info.date, 'YYYY-MM-DD').format('MMM DD, YYYY')}
                    {pickup_info.hour && pickup_info.minute && <span class="pickup-time"> · {_formatTime(pickup_info.hour.toString(), pickup_info.minute.toString())}</span>}
                    {statusTag}
                  </span>
                  <strong class="pickup-price">
                    {pickup_info.currency.symbol}
                    {pickup_info.total}
                  </strong>
                </div>

                <dl class="pickup-dl">
                  <div class="pickup-dl__row">
                    <dt>{locales.entries.Lcz_FlightDetails}</dt>
                    <dd>{pickup_info.details}</dd>
                  </div>
                  <div class="pickup-dl__row">
                    <dt>Vehicle</dt>
                    <dd>{pickup_info.selected_option.vehicle.description}</dd>
                  </div>
                  <div class="pickup-dl__row">
                    <dt>{locales.entries.Lcz_NbrOfVehicles}</dt>
                    <dd>{pickup_info.nbr_of_units}</dd>
                  </div>
                </dl>

                {(calendar_data.pickup_service.pickup_instruction?.description || calendar_data.pickup_service.pickup_cancelation_prepayment?.description) && (
                  <p class="pickup-note">
                    {calendar_data.pickup_service.pickup_instruction?.description}
                    {calendar_data.pickup_service.pickup_cancelation_prepayment?.description}
                  </p>
                )}
              </div>
            </Fragment>
          ) : (
            <ir-empty-state showIcon={false}></ir-empty-state>
          )}
        </wa-card>
      </Host>
    );
  }
}
