import { Component, Host, h } from '@stencil/core';
import dp_report from '@/stores/dp_report.store';
import { formatAmount, formatCount } from '@/utils/number';
import { t } from '@/services/locale/t';

@Component({
  tag: 'ir-dp-report-summary',
  styleUrl: 'ir-dp-report-summary.css',
  scoped: true,
})
export class IrDpReportSummary {
  render() {
    const summary = dp_report.summary;
    const currencySymbol = dp_report.rows[0]?.currencySymbol ?? '$';
    const loading = dp_report.isLoading;

    const totalBookings = summary.total_bookings;
    const totalNbOfProfitableBooking = dp_report.rows.filter(row => row.profit > 0).length;

    // const totalRevenue = dp_report.rows.reduce((sum, row) => sum + row.accommodationGross, 0);
    // const dpContributionPct = totalRevenue !== 0 ? Number(((summary.total_profit / totalRevenue) * 100).toFixed(1)) : 0;

    return (
      <Host>
        <div class="dp-summary__row">
          <ir-metric-card
            class="dp-summary__metric"
            icon="sack-dollar"
            label={t('Lcz_ExtraProfitGenerated', { fallback: 'Extra Profit Generated' })}
            loading={loading}
            value={formatAmount(currencySymbol, summary.total_profit)}
            // trend={dpContributionPct}
            caption={t('Lcz_FromNOfMBookings', { fallback: 'from %1 / %2 booking(s)', params: [formatCount(totalNbOfProfitableBooking), formatCount(totalBookings)] })}
          ></ir-metric-card>
          {/* <ir-metric-card
            class="dp-summary__metric"
            icon="chart-line"
            label="Bookings Above Base"
            loading={loading}
            value={summary.bookings_above_base}
            caption={`of ${summary.total_bookings} booking${summary.total_bookings === 1 ? '' : 's'}`}
          ></ir-metric-card> */}
          <ir-metric-card
            class="dp-summary__metric --gain"
            icon="arrow-trend-up"
            label={t('Lcz_AvgGain', { fallback: 'Avg Gain' })}
            loading={loading}
            value={formatAmount(currencySymbol, summary.avg_gain)}
            // caption={`from ${summary.bookings_above_base} booking${summary.bookings_above_base === 1 ? '' : 's'}`}
            caption={t('Lcz_PerBooking', { fallback: 'per booking' })}
          ></ir-metric-card>
          <ir-metric-card
            class="dp-summary__metric --loss"
            icon="arrow-trend-down"
            label={t('Lcz_ExtraBookingsFromAppliedIncentives', { fallback: 'Extra Bookings from Applied Incentives' })}
            loading={loading}
            value={summary.bookings_below_base}
            caption={t('Lcz_AmountPerBookingAverageReduction', { fallback: '%1/booking(s) average reduction', params: [formatAmount(currencySymbol, summary.avg_loss)] })}
          ></ir-metric-card>
        </div>
      </Host>
    );
  }
}
