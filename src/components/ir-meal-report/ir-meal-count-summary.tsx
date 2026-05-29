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
        <div class="text-center p-4 text-muted border-0 bg-white">
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
        {/* Total Summary Section - Explicit Flex for Cards */}
        <div class="d-flex flex-wrap gap-3 mb-4 justify-content-between">
            <div class="card shadow-sm border rounded p-3 text-center bg-white flex-grow-1" style={{ minWidth: '200px' }}>
                <div class="extra-small fw-bold text-muted mb-2" style={{ letterSpacing: '0.5px', fontSize: '10px', textTransform: 'none' }}>Breakfast</div>
                <div class="d-flex justify-content-center align-items-center gap-3">
                    <div>
                        <span class="h4 fw-bold text-primary mb-0 d-block" style={{ fontSize: '20px' }}>{totals.bAd}</span>
                        <div class="extra-small text-muted" style={{ fontSize: '10px' }}>Adults</div>
                    </div>
                    <div style={{ width: '1px', backgroundColor: '#e2e8f0', height: '30px' }}></div>
                    <div>
                        <span class="h4 fw-bold text-dark mb-0 d-block" style={{ fontSize: '20px' }}>{totals.bCh}</span>
                        <div class="extra-small text-muted" style={{ fontSize: '10px' }}>Children</div>
                    </div>
                </div>
            </div>

            <div class="card shadow-sm border rounded p-3 text-center bg-white flex-grow-1" style={{ minWidth: '200px' }}>
                <div class="extra-small fw-bold text-muted mb-2" style={{ letterSpacing: '0.5px', fontSize: '10px', textTransform: 'none' }}>Lunch</div>
                <div class="d-flex justify-content-center align-items-center gap-3">
                    <div>
                        <span class="h4 fw-bold text-primary mb-0 d-block" style={{ fontSize: '20px' }}>{totals.lAd}</span>
                        <div class="extra-small text-muted" style={{ fontSize: '10px' }}>Adults</div>
                    </div>
                    <div style={{ width: '1px', backgroundColor: '#e2e8f0', height: '30px' }}></div>
                    <div>
                        <span class="h4 fw-bold text-dark mb-0 d-block" style={{ fontSize: '20px' }}>{totals.lCh}</span>
                        <div class="extra-small text-muted" style={{ fontSize: '10px' }}>Children</div>
                    </div>
                </div>
            </div>

            <div class="card shadow-sm border rounded p-3 text-center bg-white flex-grow-1" style={{ minWidth: '200px' }}>
                <div class="extra-small fw-bold text-muted mb-2" style={{ letterSpacing: '0.5px', fontSize: '10px', textTransform: 'none' }}>Dinner</div>
                <div class="d-flex justify-content-center align-items-center gap-3">
                    <div>
                        <span class="h4 fw-bold text-primary mb-0 d-block" style={{ fontSize: '20px' }}>{totals.dAd}</span>
                        <div class="extra-small text-muted" style={{ fontSize: '10px' }}>Adults</div>
                    </div>
                    <div style={{ width: '1px', backgroundColor: '#e2e8f0', height: '30px' }}></div>
                    <div>
                        <span class="h4 fw-bold text-dark mb-0 d-block" style={{ fontSize: '20px' }}>{totals.dCh}</span>
                        <div class="extra-small text-muted" style={{ fontSize: '10px' }}>Children</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="table-container p-0 m-0 table-responsive border rounded bg-white">
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
                <th colSpan={2} class="bg-light border-start text-dark fw-bold" style={{ textTransform: 'none', backgroundColor: '#f1f5f9' }}>Breakfast</th>
                <th colSpan={2} class="bg-light border-start text-dark fw-bold" style={{ textTransform: 'none', backgroundColor: '#f1f5f9' }}>Lunch</th>
                <th colSpan={2} class="bg-light border-start text-dark fw-bold" style={{ textTransform: 'none', backgroundColor: '#f1f5f9' }}>Dinner</th>
              </tr>
              <tr class="table-header extra-small border-top-0">
                <th class="border-start text-muted" style={{ textTransform: 'none', backgroundColor: '#f8fafc' }}>Ad</th>
                <th class="text-muted" style={{ textTransform: 'none', backgroundColor: '#f8fafc' }}>Ch</th>
                <th class="border-start text-muted" style={{ textTransform: 'none', backgroundColor: '#f8fafc' }}>Ad</th>
                <th class="text-muted" style={{ textTransform: 'none', backgroundColor: '#f8fafc' }}>Ch</th>
                <th class="border-start text-muted" style={{ textTransform: 'none', backgroundColor: '#f8fafc' }}>Ad</th>
                <th class="text-muted" style={{ textTransform: 'none', backgroundColor: '#f8fafc' }}>Ch</th>
              </tr>
            </thead>
            <tbody>
              {list.map(day => (
                <tr class="ir-table-row">
                  <td class="ps-3 text-start fw-medium text-dark" style={{ fontSize: '11px' }}>{moment(day.Date).format('ddd MMM DD, YYYY')}</td>
                  <td class="border-start fw-bold text-primary" style={{ backgroundColor: '#fdfdfd', fontSize: '12px' }}>{day.Breakfast_Ad}</td>
                  <td class="text-muted" style={{ backgroundColor: '#fdfdfd', fontSize: '12px' }}>{day.Breakfast_Ch}</td>
                  <td class="border-start fw-bold text-primary" style={{ backgroundColor: '#fdfdfd', fontSize: '12px' }}>{day.Lunch_Ad}</td>
                  <td class="text-muted" style={{ backgroundColor: '#fdfdfd', fontSize: '12px' }}>{day.Lunch_Ch}</td>
                  <td class="border-start fw-bold text-primary" style={{ backgroundColor: '#fdfdfd', fontSize: '12px' }}>{day.Dinner_Ad}</td>
                  <td class="text-muted" style={{ backgroundColor: '#fdfdfd', fontSize: '12px' }}>{day.Dinner_Ch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Host>
    );
  }
}
