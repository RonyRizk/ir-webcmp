import { Component, Prop, h } from '@stencil/core';
import { ChannelReport, ChannelReportResult, ChannelSaleFilter } from '../types';
import { calculateTrend, formatAmount } from '@/utils/utils';

@Component({
  tag: 'ir-sales-by-channel-summary',
  styleUrl: 'ir-sales-by-channel-summary.css',
  scoped: true,
})
export class IrSalesByChannelSummary {
  @Prop() records: ChannelReportResult = [];
  @Prop() filters: ChannelSaleFilter;

  private sum(field: keyof Pick<ChannelReport, 'NIGHTS' | 'REVENUE'>, lastYear = false) {
    return (this.records ?? []).reduce((acc, r) => {
      const val = lastYear ? (r.last_year ? r.last_year[field] : 0) : r[field];
      return acc + (val ?? 0);
    }, 0);
  }

  render() {
    const totalNights = this.sum('NIGHTS');
    const totalRevenue = this.sum('REVENUE');
    const lastYearNights = this.sum('NIGHTS', true);
    const lastYearRevenue = this.sum('REVENUE', true);
    const currency = this.records?.[0]?.currency;
    const hasLastYear = Boolean(this.records?.length && this.filters?.include_previous_year);

    return (
      <div class="summary-row">
        <ir-metric-card
          class="summary-metric"
          icon="moon"
          label="Total Room Nights"
          value={totalNights.toString()}
          trend={hasLastYear ? calculateTrend(totalNights, lastYearNights) : undefined}
          trendLabel="vs last year"
          caption={hasLastYear ? `Last year: ${lastYearNights}` : undefined}
        ></ir-metric-card>
        <ir-metric-card
          class="summary-metric"
          icon="money-bill"
          label="Total Revenue"
          value={formatAmount(currency, totalRevenue)}
          trend={hasLastYear ? calculateTrend(totalRevenue, lastYearRevenue) : undefined}
          trendLabel="vs last year"
          caption={hasLastYear ? `Last year: ${formatAmount(currency, lastYearRevenue)}` : undefined}
        ></ir-metric-card>
        <ir-metric-card class="summary-metric" icon="chart-bar" label="Sources" value={(this.records?.length ?? 0).toString()}></ir-metric-card>
      </div>
    );
  }
}
