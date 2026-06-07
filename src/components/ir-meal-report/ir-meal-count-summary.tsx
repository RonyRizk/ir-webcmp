import { Component, Host, h, Prop } from '@stencil/core';
import moment from 'moment';
import { MealCountDaySummary } from '@/services/meal-report/types';

@Component({
  tag: 'ir-meal-count-summary',
  styleUrls: ['ir-meal-count-summary.css', '../../common/table.css'],
  scoped: true,
})
export class IrMealCountSummary {
  @Prop() mealCountSummary: MealCountDaySummary[] = [];

  render() {
    const list = this.mealCountSummary;

    if (!list || list.length === 0) {
      return (
        <div class="ir-meal-count-summary__empty-state">
          <p class="mb-0 small">No summary data available.</p>
        </div>
      );
    }

    const totals = {
      bAd: list.reduce((s, d) => s + (d.Breakfast_Ad || 0), 0),
      bCh: list.reduce((s, d) => s + (d.Breakfast_Ch || 0), 0),
      lAd: list.reduce((s, d) => s + (d.Lunch_Ad || 0), 0),
      lCh: list.reduce((s, d) => s + (d.Lunch_Ch || 0), 0),
      dAd: list.reduce((s, d) => s + (d.Dinner_Ad || 0), 0),
      dCh: list.reduce((s, d) => s + (d.Dinner_Ch || 0), 0),
    };

    return (
      <Host>
        {/* Total Summary Section */}
        <div class="ir-meal-count-summary__stats-grid">
            <div class="ir-meal-count-summary__stat-card">
                <div class="ir-meal-count-summary__stat-title">Breakfast</div>
                <div class="ir-meal-count-summary__stat-content">
                    <div>
                        <span class="ir-meal-count-summary__stat-value ir-meal-count-summary__stat-value--primary">{totals.bAd}</span>
                        <div class="ir-meal-count-summary__stat-label">Adults</div>
                    </div>
                    <div class="ir-meal-count-summary__stat-divider"></div>
                    <div>
                        <span class="ir-meal-count-summary__stat-value ir-meal-count-summary__stat-value--dark">{totals.bCh}</span>
                        <div class="ir-meal-count-summary__stat-label">Children</div>
                    </div>
                </div>
            </div>

            <div class="ir-meal-count-summary__stat-card">
                <div class="ir-meal-count-summary__stat-title">Lunch</div>
                <div class="ir-meal-count-summary__stat-content">
                    <div>
                        <span class="ir-meal-count-summary__stat-value ir-meal-count-summary__stat-value--primary">{totals.lAd}</span>
                        <div class="ir-meal-count-summary__stat-label">Adults</div>
                    </div>
                    <div class="ir-meal-count-summary__stat-divider"></div>
                    <div>
                        <span class="ir-meal-count-summary__stat-value ir-meal-count-summary__stat-value--dark">{totals.lCh}</span>
                        <div class="ir-meal-count-summary__stat-label">Children</div>
                    </div>
                </div>
            </div>

            <div class="ir-meal-count-summary__stat-card">
                <div class="ir-meal-count-summary__stat-title">Dinner</div>
                <div class="ir-meal-count-summary__stat-content">
                    <div>
                        <span class="ir-meal-count-summary__stat-value ir-meal-count-summary__stat-value--primary">{totals.dAd}</span>
                        <div class="ir-meal-count-summary__stat-label">Adults</div>
                    </div>
                    <div class="ir-meal-count-summary__stat-divider"></div>
                    <div>
                        <span class="ir-meal-count-summary__stat-value ir-meal-count-summary__stat-value--dark">{totals.dCh}</span>
                        <div class="ir-meal-count-summary__stat-label">Children</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="ir-meal-count-summary__container table--container">
          <table class="table text-center align-middle mb-0" style={{ tableLayout: 'fixed', width: '100%', minWidth: '650px' }}>
            <colgroup>
              <col style={{ width: '16%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
            </colgroup>
            <thead>
              <tr class="table-header border-bottom-0">
                <th rowSpan={2} class="align-middle border-bottom-0 ps-3 text-start bg-white" style={{ textTransform: 'none', width: '16%' }}></th>
                <th colSpan={2} class="ir-meal-count-summary__header-group border-start">Breakfast</th>
                <th colSpan={2} class="ir-meal-count-summary__header-group border-start">Lunch</th>
                <th colSpan={2} class="ir-meal-count-summary__header-group border-start">Dinner</th>
              </tr>
              <tr class="table-header extra-small border-top-0">
                <th class="ir-meal-count-summary__header-sub border-start">Ad</th>
                <th class="ir-meal-count-summary__header-sub">Ch</th>
                <th class="ir-meal-count-summary__header-sub border-start">Ad</th>
                <th class="ir-meal-count-summary__header-sub">Ch</th>
                <th class="ir-meal-count-summary__header-sub border-start">Ad</th>
                <th class="ir-meal-count-summary__header-sub">Ch</th>
              </tr>
            </thead>
            <tbody>
              {list.map(day => (
                <tr class="ir-table-row">
                  <td class="ps-3 text-start ir-meal-count-summary__cell-date">{moment(day.Date).format('ddd MMM DD, YYYY')}</td>
                  <td class="ir-meal-count-summary__cell-data border-start ir-meal-count-summary__cell--primary">{day.Breakfast_Ad}</td>
                  <td class="ir-meal-count-summary__cell-data text-muted">{day.Breakfast_Ch}</td>
                  <td class="ir-meal-count-summary__cell-data border-start ir-meal-count-summary__cell--primary">{day.Lunch_Ad}</td>
                  <td class="ir-meal-count-summary__cell-data text-muted">{day.Lunch_Ch}</td>
                  <td class="ir-meal-count-summary__cell-data border-start ir-meal-count-summary__cell--primary">{day.Dinner_Ad}</td>
                  <td class="ir-meal-count-summary__cell-data text-muted">{day.Dinner_Ch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Host>
    );
  }
}
