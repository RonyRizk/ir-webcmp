import { Component, Prop, h, State } from '@stencil/core';
import { MappedCountries, SalesRecord } from '../types';
import { formatAmount } from '@/utils/utils';
import calendar_data from '@/stores/calendar-data';
import { t } from '@/services/locale/t';
import { formatCount, formatPercent } from '@/utils/number';

@Component({
  tag: 'ir-sales-table',
  styleUrls: ['ir-sales-table.css', '../../../common/table.css'],
  scoped: true,
})
export class IrSalesTable {
  @Prop() records: SalesRecord[] = [];
  @Prop() mappedCountries: MappedCountries;
  @State() visibleCount: number = 10;

  private handleLoadMore = () => {
    this.visibleCount = Math.min(this.visibleCount + 10, this.records.length);
  };

  render() {
    const visibleRecords = this.records.slice(0, this.visibleCount);

    if (this.records.length === 0) {
      return (
        <wa-card class="sales-table__card">
          <div class="sales-table__empty-wrapper">
            <ir-empty-state message={t('Lcz_NoSalesDataFound', { fallback: 'No sales data found.' })}></ir-empty-state>
          </div>
        </wa-card>
      );
    }

    return (
      <wa-card class="sales-table__card">
        <div class="sales-table__scroll">
          <table class="table data-table" data-testid="hk_tasks_table">
            <thead class="table-header">
              <tr>
                <th class="cell--left">{t('Lcz_Country', { fallback: 'Country' })}</th>
                <th class="cell--center">{t('Lcz_RoomNights', { fallback: 'Room nights' })}</th>
                <th class="cell--center">{t('Lcz_NumberOfGuests', { fallback: 'Number of Guests' })}</th>
                <th class="cell--right">{t('Lcz_Revenue', { fallback: 'Revenue' })}</th>
                <th style={{ width: '35%' }}></th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map(record => {
                const mainPercentage = formatPercent(parseFloat(record.percentage.toString()), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const secondaryPercentage = record.last_year
                  ? formatPercent(parseFloat(record.last_year.percentage.toString()), { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : null;
                const mappedCountry = this.mappedCountries.get(record.country_id);

                return (
                  <tr data-testid="record_row" class={{ 'task-table-row ir-table-row': true }} key={record.id}>
                    <td class="cell--left">
                      <div class="country-cell">
                        {mappedCountry?.flag && <img class="flag" alt={mappedCountry.name} src={mappedCountry.flag} />}
                        <span>{mappedCountry?.name ?? record.country}</span>
                      </div>
                    </td>
                    <td class="cell--center">
                      <div class="cell-stack">
                        <p class={record.last_year?.nights ? 'value--primary' : ''}>{formatCount(record.nights)}</p>
                        {record.last_year?.nights && <p class="value--previous">{formatCount(record.last_year.nights)}</p>}
                      </div>
                    </td>
                    <td class="cell--center">
                      <div class="cell-stack">
                        <p class={record.last_year?.number_of_guests ? 'value--primary' : ''}>{formatCount(record.number_of_guests)}</p>
                        {record.last_year?.number_of_guests && <p class="value--previous">{formatCount(record.last_year.number_of_guests)}</p>}
                      </div>
                    </td>
                    <td class="cell--right">
                      <div class="cell-stack">
                        <p class={record.last_year?.revenue ? 'value--primary' : ''}>{formatAmount(calendar_data.currency.symbol, record.revenue)}</p>
                        {record.last_year?.revenue && <p class="value--previous">{formatAmount(calendar_data.currency.symbol, record.last_year.revenue)}</p>}
                      </div>
                    </td>
                    <td>
                      <div class="cell-stack">
                        <div class="occ-row">
                          <span class="occ-label">{mainPercentage}</span>
                          <wa-progress-bar class="occ-bar" value={parseFloat(record.percentage.toString())}></wa-progress-bar>
                        </div>
                        {record.last_year?.percentage && (
                          <div class="occ-row">
                            <span class="occ-label">{secondaryPercentage}</span>
                            <wa-progress-bar class="occ-bar occ-bar--previous" value={parseFloat(record.last_year.percentage.toString())}></wa-progress-bar>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontSize: '12px' }}>
                <td colSpan={4}></td>
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
          {this.visibleCount < this.records.length && (
            <div class="sales-table__load-more">
              <ir-custom-button variant="neutral" appearance="outlined" size="s" onClickHandler={this.handleLoadMore}>
                {t('Lcz_LoadMore', { fallback: 'Load more' })}
              </ir-custom-button>
            </div>
          )}
        </div>
      </wa-card>
    );
  }
}
