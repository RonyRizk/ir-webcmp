import { Component, h, Prop, State } from '@stencil/core';
import { Booking } from '@/models/booking.dto';
import { BookingService } from '@/services/booking-service/booking.service';
import { toFloat } from '@/utils/utils';
import calendar_data from '@/stores/calendar-data';

import { t } from '@/services/locale/t';
@Component({
  styleUrl: 'ir-booking-guarantee.css',
  tag: 'ir-booking-guarantee',
  scoped: true,
})
export class IrBookingGuarantee {
  @Prop() booking: Booking;
  @Prop() bookingService: BookingService;

  @State() collapsed: boolean = false;
  @State() paymentDetailsUrl: string = '';
  @State() paymentExceptionMessage: string = '';

  async componentWillLoad() {
    try {
      // Initialize any required data
    } catch (error) {
      if (this.booking.guest.cci) {
        return;
      }
      if (!this.booking.is_direct && this.booking.channel_booking_nbr) {
        this.paymentExceptionMessage = error;
      }
    }
  }

  private formatCurrency(amount: number, currency: string, locale: string = 'en-US'): string {
    if (!currency || amount < 0) {
      return '';
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private checkPaymentCode(value: string): string | null {
    return calendar_data.allowed_payment_methods?.find(pm => pm.code === value)?.description ?? null;
  }

  private getPaymentMethod(): string | null {
    let paymentMethod = null;
    const payment_code = this.booking?.extras?.find(e => e.key === 'payment_code');

    if (this.booking.agent) {
      const code = this.booking?.extras?.find(e => e.key === 'agent_payment_mode');
      if (code) {
        paymentMethod = code.value === '001' ? t('Lcz_OnCredit') : payment_code ? this.checkPaymentCode(payment_code.value) : null;
      }
    } else if (payment_code) {
      paymentMethod = payment_code.value === '000' ? t('Lcz_NoCardInfoRequired', { fallback: 'No card info required upon booking' }) : this.checkPaymentCode(payment_code.value);
    }

    return paymentMethod;
  }

  private async handleToggleCollapse() {
    if (!this.booking.is_direct && this.booking.channel_booking_nbr && !this.booking.guest.cci && !this.collapsed) {
      this.paymentDetailsUrl = await this.bookingService.getPCICardInfoURL(this.booking.booking_nbr);
    }
    this.collapsed = !this.collapsed;
  }

  private shouldShowGuarantee(): boolean {
    const paymentMethod = this.booking.is_direct ? this.getPaymentMethod() : null;
    return this.booking.is_direct ? Boolean(paymentMethod || this.booking.guest.cci) : true;
  }

  private shouldShowToggleButton() {
    return (!this.booking.is_direct && this.booking.ota_guarante) || (this.booking.is_direct && this.booking.guest.cci);
  }

  private renderCreditCardInfo() {
    const { cci } = this.booking.guest;
    if (!cci) return null;

    return [
      <div>
        {cci && t('Lcz_CardLabel', { fallback: 'Card:' })} <span>{cci.nbr || ''}</span>
        {cci.expiry_month && t('Lcz_ExpiryLabel', { fallback: ' Expiry: ' })}
        <span>
          {cci.expiry_month || ''}
          {cci.expiry_year && '/' + cci.expiry_year}
        </span>
      </div>,
      <div>
        {cci.holder_name && `${t('Lcz_Name', { fallback: 'Name' })}:`} <span>{cci.holder_name || ''}</span>
        {cci.cvc && t('Lcz_CvcLabel', { fallback: ' - CVC:' })} <span>{cci.cvc || ''}</span>
      </div>,
    ];
  }

  private renderCollapsedContent() {
    if (this.booking.guest.cci) {
      return this.renderCreditCardInfo();
    }

    if (this.paymentDetailsUrl) {
      return <iframe src={this.paymentDetailsUrl} width="100%" class="iframeHeight" frameborder="0" name="payment" />;
    }

    return <div class="text-center">{this.paymentExceptionMessage}</div>;
  }

  private renderOtaGuarantee() {
    const { ota_guarante } = this.booking;
    if (!ota_guarante || this.booking.is_direct) return null;

    return (
      <div>
        <ir-label
          content={ota_guarante.card_type + `${ota_guarante.is_virtual ? t('Lcz_VirtualCardSuffix', { fallback: ' (virtual)' }) : ''}`}
          labelText={`${t('Lcz_CardType')}:`}
        />
        <ir-label content={ota_guarante.cardholder_name} labelText={`${t('Lcz_CardHolderName', { fallback: 'Card holder name' })}:`} />
        <ir-label content={ota_guarante.card_number} labelText={`${t('Lcz_CardNumber', { fallback: 'Card number' })}:`} />
        <ir-label
          content={this.formatCurrency(
            toFloat(Number(ota_guarante.meta?.virtual_card_current_balance), Number(ota_guarante.meta?.virtual_card_decimal_places)),
            ota_guarante.meta?.virtual_card_currency_code,
          )}
          labelText={`${t('Lcz_CardBalance')}:`}
        />
      </div>
    );
  }

  render() {
    if (!this.shouldShowGuarantee()) {
      return null;
    }

    const paymentMethod = this.booking.is_direct ? this.getPaymentMethod() : null;

    return (
      <div class="mb-1">
        <div class="d-flex align-items-center">
          <span class="ir-me-1 font-medium">
            {t('Lcz_BookingGuarantee')}
            {paymentMethod && <span>: {paymentMethod}</span>}
          </span>

          {this.shouldShowToggleButton() && (
            <ir-button
              id="drawer-icon"
              data-toggle="collapse"
              data-target=".guarrantee"
              aria-expanded={this.collapsed ? 'true' : 'false'}
              aria-controls="myCollapse"
              class="sm-padding-right pointer"
              variant="icon"
              icon_name="credit_card"
              onClickHandler={this.handleToggleCollapse.bind(this)}
            />
          )}
        </div>

        <div class="collapse guarrantee">{this.renderCollapsedContent()}</div>

        {this.renderOtaGuarantee()}
      </div>
    );
  }
}
