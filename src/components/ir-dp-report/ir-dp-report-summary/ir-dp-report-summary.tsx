import { Component, Host, h } from '@stencil/core';
import dp_report from '@/stores/dp_report.store';
import { formatAmount } from '@/utils/utils';

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

    const totalRevenue = dp_report.rows.reduce((sum, row) => sum + row.accommodationGross, 0);
    const dpContributionPct = totalRevenue !== 0 ? Number(((summary.total_profit / totalRevenue) * 100).toFixed(1)) : 0;

    return (
      <Host>
        <div class="dp-summary__row">
          <ir-metric-card
            class="dp-summary__metric"
            icon="sack-dollar"
            label="Total Profit Generated"
            loading={loading}
            value={formatAmount(currencySymbol, summary.total_profit)}
            trend={dpContributionPct}
            caption={`from ${summary.total_bookings} booking${summary.total_bookings === 1 ? '' : 's'}`}
          ></ir-metric-card>
          <ir-metric-card
            class="dp-summary__metric"
            icon="chart-line"
            label="Bookings Above Base"
            loading={loading}
            value={summary.bookings_above_base}
            caption={`of ${summary.total_bookings} booking${summary.total_bookings === 1 ? '' : 's'}`}
          ></ir-metric-card>
          <ir-metric-card
            class="dp-summary__metric --gain"
            icon="arrow-trend-up"
            label="Avg Gain"
            loading={loading}
            value={formatAmount(currencySymbol, summary.avg_gain)}
            caption={`from ${summary.bookings_above_base} booking${summary.bookings_above_base === 1 ? '' : 's'}`}
          ></ir-metric-card>
          <ir-metric-card
            class="dp-summary__metric --loss"
            icon="arrow-trend-down"
            label="Avg Incentive Reduction"
            loading={loading}
            value={formatAmount(currencySymbol, summary.avg_loss)}
            caption={`from ${summary.bookings_below_base} booking${summary.bookings_below_base === 1 ? '' : 's'}`}
          ></ir-metric-card>
        </div>
      </Host>
    );
  }
}
