import type { CheckoutDialogCloseEvent, CheckoutRoomEvent } from '@/components';
import { isEarlyCheckout } from '@/utils/booking';
import type { ISODate } from '@/utils/calendar-dates';
import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { loadDepartures } from '../dashboard.data';
import type { CheckoutRedirectEvent } from '../types';

/**
 * Departures panel of the dashboard: the existing departures table plus its check-out and invoice dialogs.
 * Early check-outs are handed to the root, which opens them inside booking details.
 */
@Component({
  tag: 'ir-dashboard-departures',
  styleUrl: 'ir-dashboard-departures.css',
  scoped: true,
})
export class IrDashboardDepartures {
  @Prop() propertyId: number;
  @Prop() date: ISODate;
  /** Property without front desk: every departing room in one list, no check-out actions. */
  @Prop() pmsDisabled: boolean = false;

  @State() checkoutState: CheckoutRoomEvent = null;
  @State() invoiceState: CheckoutRoomEvent = null;

  /** Early check-out that must be completed from the booking-details drawer. */
  @Event() checkoutRedirect: EventEmitter<CheckoutRedirectEvent>;

  private reload() {
    return loadDepartures(this.propertyId, this.date);
  }

  private handleCheckoutRoom(event: CustomEvent<CheckoutRoomEvent>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    const { booking, identifier } = event.detail;
    const room = booking?.rooms?.find(r => r.identifier === identifier);
    if (isEarlyCheckout(room)) {
      this.checkoutRedirect.emit({ bookingNumber: Number(booking.booking_nbr), identifier });
      return;
    }
    this.checkoutState = event.detail;
  }

  private async handleCheckoutDialogClosed(event: CustomEvent<CheckoutDialogCloseEvent>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    const state = { ...this.checkoutState };
    this.checkoutState = null;
    switch (event.detail.reason) {
      case 'checkout':
        await this.reload();
        break;
      case 'openInvoice':
        this.invoiceState = state;
        await this.reload();
        break;
    }
  }

  private handleInvoiceClose(event: CustomEvent<void>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.invoiceState = null;
  }

  render() {
    return (
      <Host>
        <ir-departures-table
          hidePagination
          pmsDisabled={this.pmsDisabled}
          onCheckoutRoom={event => this.handleCheckoutRoom(event as CustomEvent<CheckoutRoomEvent>)}
        ></ir-departures-table>
        <ir-checkout-dialog
          booking={this.checkoutState?.booking}
          identifier={this.checkoutState?.identifier}
          open={this.checkoutState !== null}
          onCheckoutDialogClosed={event => this.handleCheckoutDialogClosed(event as CustomEvent<CheckoutDialogCloseEvent>)}
        ></ir-checkout-dialog>
        <ir-invoice
          booking={this.invoiceState?.booking}
          roomIdentifier={this.invoiceState?.identifier}
          open={this.invoiceState !== null}
          onInvoiceClose={event => this.handleInvoiceClose(event as CustomEvent<void>)}
        ></ir-invoice>
      </Host>
    );
  }
}
