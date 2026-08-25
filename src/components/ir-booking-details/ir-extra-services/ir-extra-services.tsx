import { Agent } from '@/services/agents/type';
import { Component, Fragment, Host, Prop, h } from '@stencil/core';
import { Booking } from '@/models/booking.dto';
import locales from '@/stores/locales.store';
import { IEntries } from '@/models/property';
import type { ClTx } from '@/services/city-ledger/types';
import { isAgentMode } from '../functions';
@Component({
  tag: 'ir-extra-services',
  styleUrl: 'ir-extra-services.css',
  scoped: true,
})
export class IrExtraServices {
  @Prop() booking: Booking;
  @Prop() agent: Agent;
  @Prop() language: string;
  @Prop() svcCategories: IEntries[];
  @Prop() clTransactions: ClTx[] = [];

  private renderServiceList(services: Booking['extra_services']) {
    return services.map((service, index) => {
      if (service.room_identifier) {
        return null;
      }
      return (
        <Fragment>
          <ir-extra-service
            language={this.language}
            svcCategories={this.svcCategories}
            booking={this.booking}
            bookingNumber={this.booking.booking_nbr}
            currencySymbol={this.booking.currency.symbol}
            key={service.booking_system_id}
            service={service}
            agent={this.agent}
            clTransactions={this.clTransactions}
          ></ir-extra-service>
          {index !== services.length - 1 && <wa-divider></wa-divider>}
        </Fragment>
      );
    });
  }

  private extraServicesHeaderActions() {
    return this.booking.is_room_less ? (
      <div slot="header-actions" class={'extra-services__header-actions'}>
        <ir-custom-button id="room-add" size="s" appearance="outlined" variant="neutral">
          <wa-icon name="plus" slot="start"></wa-icon>
          Add stay
        </ir-custom-button>
        <ir-custom-button id="extra_service_btn" size="s" appearance="outlined" variant="neutral">
          <wa-icon name="plus" slot="start"></wa-icon>
          Add service
        </ir-custom-button>
      </div>
    ) : (
      <Fragment>
        <wa-tooltip for="extra_service_btn">Add extra service</wa-tooltip>
        <ir-custom-button slot="header-actions" id="extra_service_btn" size="s" appearance="plain" variant="neutral">
          <wa-icon name="plus" style={{ fontSize: '1rem' }}></wa-icon>
        </ir-custom-button>
      </Fragment>
    );
  }

  render() {
    const services = this.booking.extra_services ?? [];

    if (isAgentMode(this.agent)) {
      const guestServices = services.filter(s => s.agent === null || s.agent === undefined);
      const agentServices = services.filter(s => s.agent !== null && s.agent !== undefined);
      const agentName = this.booking.agent?.name ?? 'Agent';

      return (
        <Host>
          <wa-card appearance="plain" class="extra-service__card">
            <p slot="header" class={'font-size-large p-0 m-0'}>
              {locales.entries.Lcz_ExtraServices}
            </p>

            {this.extraServicesHeaderActions()}
            {services.length === 0 ? (
              <ir-empty-state showIcon={false}></ir-empty-state>
            ) : (
              <Fragment>
                <p class="service-group__label --agent">
                  {agentName}
                  <span>Folio</span>
                </p>
                <div class="service-group service-group--agent">
                  <div class="service-group__body">
                    {agentServices.length === 0 ? <p class="service-group__empty">No agent services added</p> : this.renderServiceList(agentServices)}
                  </div>
                </div>
                <wa-divider></wa-divider>
                <p class="service-group__label">
                  Guest
                  <span>Folio</span>
                </p>
                <div class="service-group service-group--guest">
                  <div class="service-group__body">
                    {guestServices.length === 0 ? <p class="service-group__empty">No guest services added</p> : this.renderServiceList(guestServices)}
                  </div>
                </div>
              </Fragment>
            )}
          </wa-card>
        </Host>
      );
    }

    return (
      <Host>
        <wa-card appearance="plain" class="extra-service__card">
          <p slot="header" class={'font-size-large p-0 m-0 '}>
            {locales.entries.Lcz_ExtraServices}
          </p>

          {this.extraServicesHeaderActions()}
          {services.length === 0 && <ir-empty-state showIcon={false}></ir-empty-state>}
          {this.renderServiceList(services)}
        </wa-card>
      </Host>
    );
  }
}
