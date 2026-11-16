import ApiClient from '@/models/ApiClient';
import { checkUserAuthState, manageAnchorSession } from '@/utils/utils';
import { Component, Host, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'ir-booking',
  styleUrl: 'ir-booking.css',
  scoped: true,
})
export class IrBooking {
  @Prop() propertyid: number;
  @Prop() p: string;
  @Prop() bookingNumber: string;
  @State() isAuthenticated: boolean = false;
  private ApiClient = new ApiClient();

  componentWillLoad() {
    const isAuthenticated = checkUserAuthState();
    if (isAuthenticated) {
      this.isAuthenticated = true;
      this.ApiClient.setApiClient(isAuthenticated.ApiClient);
    }
  }

  private handleAuthFinish(e: CustomEvent) {
    const ApiClient = e.detail.ApiClient;
    this.ApiClient.setApiClient(ApiClient);
    this.isAuthenticated = true;
    manageAnchorSession({ login: { method: 'direct', isLoggedIn: true, ApiClient } });
  }
  render() {
    if (!this.isAuthenticated)
      return (
        <Host>
          <ir-login onAuthFinish={this.handleAuthFinish.bind(this)}></ir-login>
        </Host>
      );
    return (
      <Host>
        <ir-booking-details
          p={this.p}
          hasPrint
          hasReceipt
          propertyid={this.propertyid}
          hasRoomEdit
          hasRoomDelete
          language="en"
          ticket={this.ApiClient.getToken()}
          bookingNumber={this.bookingNumber}
        ></ir-booking-details>
      </Host>
    );
  }
}
