import { Component, h, Prop } from '@stencil/core';
import { SalesRecord } from '../types';
import { calculateTrend, formatAmount } from '@/utils/utils';
import calendar_data from '@/stores/calendar-data';

export type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

@Component({
  tag: 'ir-sales-by-country-summary',
  styleUrl: 'ir-sales-by-country-summary.css',
  scoped: true,
})
export class IrSalesByCountrySummary {
  @Prop() salesReports: SalesRecord[];

  private calculateTotalValues(field: NumericKeys<SalesRecord>, lastYear: boolean = false) {
    return this.salesReports?.reduce((prev, curr) => {
      const value = lastYear ? (curr.last_year ? curr.last_year[field] : 0) : curr[field];
      return prev + value;
    }, 0);
  }

  render() {
    const totalRoomNights = this.calculateTotalValues('nights');
    const totalGuests = this.calculateTotalValues('number_of_guests');
    const totalRevenue = this.calculateTotalValues('revenue');

    const lastYearTotalRoomNights = this.calculateTotalValues('nights', true);
    const lastYearTotalGuests = this.calculateTotalValues('number_of_guests', true);
    const lastYearTotalRevenue = this.calculateTotalValues('revenue', true);

    const hasLastYear = Boolean(this.salesReports?.length && this.salesReports[0].last_year);

    return (
      <div class="summary-row">
        <ir-metric-card
          class="summary-metric"
          icon="moon"
          label="Total Room Nights"
          value={totalRoomNights?.toString()}
          trend={hasLastYear ? calculateTrend(totalRoomNights, lastYearTotalRoomNights) : undefined}
          trendLabel="vs last year"
          caption={hasLastYear ? `Last year: ${lastYearTotalRoomNights}` : undefined}
        ></ir-metric-card>
        <ir-metric-card
          class="summary-metric"
          icon="user-group"
          label="Total Guests"
          value={totalGuests?.toString()}
          trend={hasLastYear ? calculateTrend(totalGuests, lastYearTotalGuests) : undefined}
          trendLabel="vs last year"
          caption={hasLastYear ? `Last year: ${lastYearTotalGuests}` : undefined}
        ></ir-metric-card>
        <ir-metric-card
          class="summary-metric"
          icon="money-bill"
          label="Total Revenue"
          value={formatAmount(calendar_data.currency.symbol, totalRevenue)}
          trend={hasLastYear ? calculateTrend(totalRevenue, lastYearTotalRevenue) : undefined}
          trendLabel="vs last year"
          caption={hasLastYear ? `Last year: ${formatAmount(calendar_data.currency.symbol, lastYearTotalRevenue)}` : undefined}
        ></ir-metric-card>
      </div>
    );
  }
}
