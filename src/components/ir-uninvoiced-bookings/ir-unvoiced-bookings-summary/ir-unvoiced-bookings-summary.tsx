import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'ir-unvoiced-bookings-summary',
  styleUrl: 'ir-unvoiced-bookings-summary.css',
  shadow: true,
})
export class IrUnvoicedBookingsSummary {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
