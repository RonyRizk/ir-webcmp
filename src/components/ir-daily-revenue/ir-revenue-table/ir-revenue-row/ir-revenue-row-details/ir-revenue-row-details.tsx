import { FolioPayment } from '@/components';
import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { formatAmount, formatBookingNumber } from '@/utils/number';
import { formatDate } from '@/utils/date';
import calendar_data from '@/stores/calendar-data';
import { _formatTime } from '@/components/ir-booking-details/functions';
import { SidebarOpenEvent } from '@/components/ir-daily-revenue/types';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-revenue-row-details',
  styleUrl: 'ir-revenue-row-details.css',
  scoped: true,
})
export class IrRevenueRowDetails {
  @Prop() payment: FolioPayment;
  @Event() revenueOpenSidebar: EventEmitter<SidebarOpenEvent>;

  render() {
    return (
      <Host>
        <div class="ir-revenue-row-detail">
          <div class="ir-revenue-row-detail__info">
            <div class="ir-revenue-row-detail__time">
              <span class="ir-revenue-row-detail__label">{formatDate(this.payment.date, 'MMM DD, YYYY')}</span>
              <span class="ir-revenue-row-detail__value">{_formatTime(this.payment.hour.toString(), this.payment.minute.toString())}</span>
              <div class="ir-revenue-row-detail__amount">{formatAmount(calendar_data.currency.symbol, this.payment.amount)}</div>
            </div>

            <div class="ir-revenue-row-detail__meta">
              <div class="ir-revenue-row-detail__user">
                <span class="ir-revenue-row-detail__label ir-revenue-row-detail__label--capitalize">{t('Lcz_User', { fallback: 'user' })}:</span>
                <span class="ir-revenue-row-detail__value">{this.payment.user}</span>
              </div>
              <div class="ir-revenue-row-detail__booking">
                <ir-custom-button
                  link
                  style={{ marginInlineStart: '1rem' }}
                  onClickHandler={e => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    this.revenueOpenSidebar.emit({
                      payload: {
                        bookingNumber: Number(this.payment.bookingNbr),
                      },
                      type: 'booking',
                    });
                  }}
                >
                  {formatBookingNumber(this.payment.bookingNbr)}
                </ir-custom-button>
              </div>
            </div>
          </div>

          <div class="ir-revenue-row-detail__amount">{formatAmount(calendar_data.currency.symbol, this.payment.amount)}</div>
        </div>
      </Host>
    );
  }
}
