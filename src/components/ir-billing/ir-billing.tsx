import { Booking } from '@/models/booking.dto';
import { Agent } from '@/services/agents/type';
import { Component, Element, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import { isAgentMode } from '../ir-booking-details/functions';

export type BillingPanels = 'agent' | 'guest';
@Component({
  tag: 'ir-billing',
  styleUrl: 'ir-billing.css',
  scoped: true,
})
export class IrBilling {
  @Element() el: HTMLIrBillingElement;
  @Prop() booking: Booking;
  @Prop() isAllServicesAgentOwned: boolean;
  @Prop() agent: Agent;
  @Watch('agent')
  async handleBookingChange() {
    this.isAgentMode = isAgentMode(this.agent);
    this.setTabGroupActive();
  }

  @State() isAgentMode: boolean = false;
  @State() currentTab: BillingPanels;

  @Event() billingClose: EventEmitter<void>;

  componentWillLoad() {
    this.isAgentMode = isAgentMode(this.agent);
  }
  componentDidLoad() {
    this.setTabGroupActive();
  }

  private setTabGroupActive() {
    requestAnimationFrame(() => {
      if (this.isAgentMode) {
        this.currentTab = 'agent';
      }
    });
  }

  render() {
    if (this.isAgentMode) {
      return (
        <wa-tab-group
          activation="manual"
          onwa-tab-show={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.currentTab = e.detail.name.toString() as BillingPanels;
          }}
          active={this.currentTab}
        >
          <wa-tab panel="guest" disabled={this.isAllServicesAgentOwned}>
            Guest
          </wa-tab>
          <wa-tab panel="agent">Agent</wa-tab>
          <wa-tab-panel name="guest">{this.currentTab === 'guest' && <ir-guest-billing booking={this.booking}></ir-guest-billing>}</wa-tab-panel>
          <wa-tab-panel name="agent">{this.currentTab === 'agent' && <ir-agent-billing booking={this.booking}></ir-agent-billing>}</wa-tab-panel>
        </wa-tab-group>
      );
    }
    return <ir-guest-billing style={{ paddingTop: '1.5rem' }} booking={this.booking}></ir-guest-billing>;
  }
}
