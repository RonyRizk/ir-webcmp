import { Booking } from '@/models/booking.dto';
import { Agent } from '@/services/agents/type';
import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-billing-drawer',
  styleUrl: 'ir-billing-drawer.css',
  scoped: true,
})
export class IrBillingDrawer {
  /**
   * Controls whether the billing drawer is open or closed.
   *
   * When `true`, the drawer becomes visible.
   * When `false`, it is hidden.
   *
   * This prop is reflected to the host element.
   *
   * @type {boolean}
   */
  @Prop({ reflect: true }) open: boolean;

  /**
   * The booking object containing reservation and guest details
   * that will be used to populate the billing view.
   *
   * @type {Booking}
   */
  @Prop() booking: Booking;
  @Prop() agent: Agent;
  @Prop() isAllServicesAgentOwned: boolean;

  /**
   * Emitted when the billing drawer has been closed.
   *
   * Listen to this event to respond to drawer close actions.
   *
   * @event billingClose
   */
  @Event() billingClose: EventEmitter<void>;

  render() {
    return (
      <ir-drawer
        style={{
          '--ir-drawer-width': '70rem',
          '--ir-drawer-background-color': 'var(--wa-color-surface-default)',
          '--ir-drawer-padding-left': '0',
          '--ir-drawer-padding-right': '0',
          '--ir-drawer-padding-top': this.agent ? '0' : 'var(--spacing)',
          '--ir-drawer-padding-bottom': 'var(--spacing)',
        }}
        class="billing__drawer"
        onDrawerHide={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
          this.billingClose.emit();
        }}
        open={this.open}
        label="Billing"
      >
        {this.open && <ir-billing isAllServicesAgentOwned={this.isAllServicesAgentOwned} booking={this.booking} agent={this.agent}></ir-billing>}
      </ir-drawer>
    );
  }
}
