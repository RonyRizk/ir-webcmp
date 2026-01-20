import { FetchNotificationsResult as Notifications, PropertyService } from '@/services/property.service';
import Token from '@/models/Token';
import { Component, Host, Prop, State, Watch, h } from '@stencil/core';

@Component({
  tag: 'ir-pms-payment-due-alert',
  styleUrl: 'ir-pms-payment-due-alert.css',
  scoped: true,
})
export class IrPmsPaymentDueAlert {
  @Prop() propertyid: number;
  @Prop() ticket: string;
  @Prop() baseUrl: string;

  @State() notifications: Notifications = [];

  private tokenService = new Token();
  private propertyService = new PropertyService();

  componentWillLoad() {
    if (this.baseUrl) {
      this.tokenService.setBaseUrl(this.baseUrl);
    }
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
      this.fetchNotifications();
    }
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue === oldValue || !newValue) {
      return;
    }
    this.tokenService.setToken(newValue);
    this.fetchNotifications();
  }

  private async fetchNotifications() {
    if (!this.propertyid) {
      this.notifications = [];
      return;
    }
    try {
      this.notifications = await this.propertyService.fetchNotifications(this.propertyid);
    } catch (error) {
      console.log(error);
      this.notifications = [];
    }
  }

  render() {
    const combinedMessage = this.notifications
      ?.filter(n => n.type === 'financial')
      ?.map(notification => notification.message)
      ?.filter(Boolean)
      ?.join(' ');
    if (!combinedMessage) {
      return <Host></Host>;
    }
    return (
      <Host>
        <wa-callout class="pms-payment-due-alert__callout" size="small" appearance="filled" variant="danger">
          <div class="pms-payment-due-alert__callout-message">
            <wa-icon style={{ color: 'var(--wa-color-danger-fill-loud)', fontSize: '1rem' }} slot="icon" name="triangle-exclamation"></wa-icon>
            <span>{combinedMessage}</span>
          </div>
        </wa-callout>
      </Host>
    );
  }
}
