import { Component, Host, Prop, h } from '@stencil/core';
import { DailyPaymentFilter, FolioPayment, GroupedFolioPayment } from '../types';
import { calculateTrend, formatAmount } from '@/utils/utils';
import calendar_data from '@/stores/calendar-data';
import { PaymentEntries } from '@/components/ir-booking-details/types';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-revenue-summary',
  styleUrl: 'ir-revenue-summary.css',
  scoped: true,
})
export class IrRevenueSummary {
  @Prop() filters: DailyPaymentFilter;
  @Prop() groupedPayments: GroupedFolioPayment = new Map();
  @Prop() previousDateGroupedPayments: GroupedFolioPayment = new Map();
  @Prop() paymentEntries: PaymentEntries;

  private calculateTotalPayments(groupedPayments: GroupedFolioPayment) {
    let total = 0;
    groupedPayments.forEach((value, key) => {
      if (key.split('_')[0] === '001') {
        total += this.calculateTotalValue(value);
      }
    });
    return total;
  }

  private calculateTotalRefunds(groupedPayments: GroupedFolioPayment) {
    const refundKeyCode = '010';
    const payments: FolioPayment[] = [];
    groupedPayments.forEach((value, key) => {
      if (key.split('_')[0] === refundKeyCode) {
        payments.push(...value);
      }
    });
    return this.calculateTotalValue(payments);
  }

  private calculateTotalValue(payments: FolioPayment[]) {
    return payments.reduce((p, c) => p + c.amount, 0);
  }

  private getTrendIcon(val1: number, val2: number) {
    if (val1 === val2) {
      return undefined;
    }
    return val1 > val2 ? 'arrow-trend-up' : 'arrow-trend-down';
  }

  render() {
    const paymentsTotal = this.calculateTotalPayments(this.groupedPayments);
    const refundAmount = this.calculateTotalRefunds(this.groupedPayments);
    const totalAmount = paymentsTotal + refundAmount;

    const previousDatePaymentsTotal = this.calculateTotalPayments(this.previousDateGroupedPayments);
    const previousDateRefundAmount = this.calculateTotalRefunds(this.previousDateGroupedPayments);
    const previousDateTotalAmount = previousDatePaymentsTotal + previousDateRefundAmount;

    const hasPrevious = Boolean(this.filters?.date && this.previousDateGroupedPayments?.size > 0);

    return (
      <Host>
        <div class="revenue-summary__row">
          <ir-metric-card
            class="revenue-summary__metric"
            icon="arrow-trend-up"
            label={t('Lcz_Payments', { fallback: 'Payments' })}
            value={formatAmount(calendar_data.currency.symbol, paymentsTotal)}
            trend={hasPrevious ? calculateTrend(paymentsTotal, previousDatePaymentsTotal) : undefined}
            trendLabel={t('Lcz_FromPreviousDay', { fallback: 'from previous day' })}
            caption={hasPrevious ? `${t('Lcz_PreviousDay', { fallback: 'Previous day:' })} ${formatAmount(calendar_data.currency.symbol, previousDatePaymentsTotal)}` : undefined}
          ></ir-metric-card>
          <ir-metric-card
            class="revenue-summary__metric"
            icon="arrow-trend-down"
            label={t('Lcz_Refunds', { fallback: 'Refunds' })}
            value={formatAmount(calendar_data.currency.symbol, refundAmount)}
            trend={hasPrevious ? calculateTrend(refundAmount, previousDateRefundAmount) : undefined}
            trendLabel={t('Lcz_FromPreviousDay', { fallback: 'from previous day' })}
            invertTrend
            caption={hasPrevious ? `${t('Lcz_PreviousDay', { fallback: 'Previous day:' })} ${formatAmount(calendar_data.currency.symbol, previousDateRefundAmount)}` : undefined}
          ></ir-metric-card>
          <ir-metric-card
            class="revenue-summary__metric"
            icon={this.getTrendIcon(totalAmount, previousDateTotalAmount) ?? 'money-bill'}
            label={t('Lcz_NetTotal', { fallback: 'Net Total' })}
            value={formatAmount(calendar_data.currency.symbol, totalAmount)}
            trend={hasPrevious ? calculateTrend(totalAmount, previousDateTotalAmount) : undefined}
            trendLabel={t('Lcz_FromPreviousDay', { fallback: 'from previous day' })}
            caption={hasPrevious ? `${t('Lcz_PreviousDay', { fallback: 'Previous day:' })} ${formatAmount(calendar_data.currency.symbol, previousDateTotalAmount)}` : undefined}
          ></ir-metric-card>
        </div>
      </Host>
    );
  }
}
