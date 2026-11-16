import { Component, Prop, h } from '@stencil/core';
import { DailyReport } from '../types';
import moment from 'moment';
import { formatAmount } from '@/utils/utils';
import { formatDate } from '@/utils/date';
import calendar_data from '@/stores/calendar-data';
import { t } from '@/services/locale/t';
import { formatCount, formatPercent } from '@/utils/number';

@Component({
  tag: 'ir-monthly-bookings-report-table',
  styleUrls: ['ir-monthly-bookings-report-table.css'],
  scoped: true,
})
export class IrMonthlyBookingsReportTable {
  @Prop() reports: DailyReport[] = [];
  render() {
    return (
      <wa-card class="daily-occupancy-table__card">
        <div class={'table--container'}>
          <table class="table data-table">
            <thead class="table-header">
              <tr>
                <th class="text-center">{t('Lcz_DateLabel', { fallback: 'Date' })}</th>
                <th class="text-center">{t('Lcz_UnitsBooked', { fallback: 'Units booked' })}</th>
                <th class="text-center text-capitalize">{t('Lcz_Adults', { fallback: 'adults' })}</th>
                <th class="text-center">{t('Lcz_Children', { fallback: 'Children' })}</th>
                <th class="ir-text-end">
                  <ir-tooltip customSlot message={t('Lcz_AverageDailyRate', { fallback: 'Average Daily Rate' })} alignment="end">
                    <span slot="tooltip-trigger">{t('Lcz_Adr', { fallback: 'ADR' })}</span>
                  </ir-tooltip>
                </th>
                <th class="ir-text-end">{t('Lcz_RoomsRevenue', { fallback: 'Rooms revenue' })}</th>
                <th>{t('Lcz_Occupancy', { fallback: 'Occupancy' })}</th>
              </tr>
            </thead>
            <tbody>
              {this.reports.length === 0 && (
                <tr>
                  <td colSpan={7} class="empty-row">
                    <ir-empty-state message={t('Lcz_NoDataFound', { fallback: 'No data found' })}></ir-empty-state>
                  </td>
                </tr>
              )}
              {this.reports.map(report => {
                const mainPercentage = formatPercent(parseFloat(report.occupancy_percent.toString()), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const secondaryPercentage = report.last_year
                  ? formatPercent(parseFloat(report.last_year.occupancy_percent.toString()), { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : null;
                const reportDate = moment(report.day, 'YYYY-MM-DD');
                const isFutureDate = moment().isBefore(reportDate, 'dates');
                return (
                  <tr key={report.day} class={`ir-table-row ${isFutureDate ? 'future-report' : ''}`}>
                    <td class="text-center">{formatDate(report.day, { style: 'day-only' })}</td>
                    <td class="text-center">
                      <div class="cell-stack">
                        <p class={report.last_year?.units_booked ? 'value--primary' : ''}>{formatCount(report.units_booked)}</p>
                        {report.last_year?.units_booked > 0 && <p class="value--previous">{formatCount(report.last_year?.units_booked)}</p>}
                      </div>
                    </td>
                    <td class="text-center">
                      <div class="cell-stack">
                        <p class={report.last_year?.total_guests ? 'value--primary' : ''}>{formatCount(report.adults)}</p>
                        {report.last_year?.total_guests > 0 && <p class="value--previous">{formatCount(report.last_year?.adults)}</p>}
                      </div>
                    </td>
                    <td class="text-center">
                      <div class="cell-stack">
                        <p class={report.last_year?.total_guests ? 'value--primary' : ''}>{formatCount(report.children)}</p>
                        {report.last_year?.total_guests > 0 && <p class="value--previous">{formatCount(report.last_year?.children)}</p>}
                      </div>
                    </td>
                    <td class="ir-text-end">
                      <div class="cell-stack">
                        <p class={report.last_year?.adr ? 'value--primary' : ''}>{formatAmount(calendar_data.currency.symbol, report.adr)}</p>
                        {report.last_year?.adr > 0 && <p class="value--previous">{formatAmount(calendar_data.currency.symbol, report.last_year.adr)}</p>}
                      </div>
                    </td>
                    <td class="ir-text-end">
                      <div class="cell-stack">
                        <p class={report.last_year?.rooms_revenue ? 'value--primary' : ''}>{formatAmount(calendar_data.currency.symbol, report.rooms_revenue)}</p>
                        {report.last_year?.rooms_revenue > 0 && <p class="value--previous">{formatAmount(calendar_data.currency.symbol, report.last_year.rooms_revenue)}</p>}
                      </div>
                    </td>
                    <td>
                      <div class="cell-stack">
                        <div class="occ-row">
                          <span class="occ-label">{mainPercentage}</span>
                          <wa-progress-bar class="occ-bar" value={parseFloat(report.occupancy_percent.toString())}></wa-progress-bar>
                        </div>
                        {report.last_year?.occupancy_percent > 0 && (
                          <div class="occ-row">
                            <span class="occ-label">{secondaryPercentage}</span>
                            <wa-progress-bar class="occ-bar occ-bar--previous" value={parseFloat(report.last_year?.occupancy_percent?.toString())}></wa-progress-bar>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6}></td>
                <td class="legend-cell">
                  <div class="legend-row">
                    <div class="legend-item">
                      <div class="legend-dot legend-dot--current"></div>
                      <p>{t('Lcz_SelectedPeriod', { fallback: 'Selected period' })}</p>
                    </div>
                    <div class="legend-item">
                      <div class="legend-dot legend-dot--previous"></div>
                      <p>{t('Lcz_PreviousYear', { fallback: 'Previous year' })}</p>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </wa-card>
    );
  }
}
