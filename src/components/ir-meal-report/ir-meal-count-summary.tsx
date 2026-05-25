import { Component, Host, h } from '@stencil/core';
import { mealReportStore } from '../../stores/meal-report.store';
import moment from 'moment';

@Component({
  tag: 'ir-meal-count-summary',
  styleUrls: ['ir-meal-count-summary.css', '../../common/table.css'],
  scoped: true,
})
export class IrMealCountSummary {
  render() {
    const list = mealReportStore.mealCountSummary;

    if (!list || list.length === 0) {
      return (
        <div class="text-center p-4 text-muted border-0 bg-white">
          <p class="mb-0 small">No summary data available.</p>
        </div>
      );
    }

    const getVal = (obj: any, key: string) => {
        if (!obj) return 0;
        const lowerKey = key.toLowerCase();
        const actualKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
        const val = actualKey ? obj[actualKey] : 0;
        return typeof val === 'number' ? val : (parseInt(val) || 0);
    };

    const getDateVal = (obj: any) => {
        if (!obj) return null;
        return obj.Date || obj.DATE || obj.date || null;
    };

    const totals = {
      bAd: list.reduce((s, d) => s + getVal(d, 'Breakfast_Ad'), 0),
      bCh: list.reduce((s, d) => s + getVal(d, 'Breakfast_Ch'), 0),
      lAd: list.reduce((s, d) => s + getVal(d, 'Lunch_Ad'), 0),
      lCh: list.reduce((s, d) => s + getVal(d, 'Lunch_Ch'), 0),
      dAd: list.reduce((s, d) => s + getVal(d, 'Dinner_Ad'), 0),
      dCh: list.reduce((s, d) => s + getVal(d, 'Dinner_Ch'), 0),
    };

    return (
      <Host>
        {/* Total Summary Section */}
        <div class="mb-4 p-3 bg-light rounded shadow-sm">
            <h5 class="text-uppercase small fw-bold text-muted mb-3 d-flex align-items-center">
                <i class="fas fa-calculator me-2"></i> Grand Totals
            </h5>
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="p-2 bg-white border rounded text-center">
                        <div class="extra-small text-muted mb-1 font-weight-bold">Breakfast</div>
                        <div class="d-flex justify-content-center gap-3 align-items-baseline">
                            <div><span class="h5 fw-bold text-primary mb-0">{totals.bAd}</span> <small class="text-muted">Ad</small></div>
                            <div class="text-neutral-300">|</div>
                            <div><span class="h5 fw-bold text-dark mb-0">{totals.bCh}</span> <small class="text-muted">Ch</small></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-2 bg-white border rounded text-center">
                        <div class="extra-small text-muted mb-1 font-weight-bold">Lunch</div>
                        <div class="d-flex justify-content-center gap-3 align-items-baseline">
                            <div><span class="h5 fw-bold text-primary mb-0">{totals.lAd}</span> <small class="text-muted">Ad</small></div>
                            <div class="text-neutral-300">|</div>
                            <div><span class="h5 fw-bold text-dark mb-0">{totals.lCh}</span> <small class="text-muted">Ch</small></div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-2 bg-white border rounded text-center">
                        <div class="extra-small text-muted mb-1 font-weight-bold">Dinner</div>
                        <div class="d-flex justify-content-center gap-3 align-items-baseline">
                            <div><span class="h5 fw-bold text-primary mb-0">{totals.dAd}</span> <small class="text-muted">Ad</small></div>
                            <div class="text-neutral-300">|</div>
                            <div><span class="h5 fw-bold text-dark mb-0">{totals.dCh}</span> <small class="text-muted">Ch</small></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="table-container p-0 m-0 table-responsive border rounded">
          <table class="table text-center align-middle mb-0" style={{ tableLayout: 'fixed', width: '100%', minWidth: '800px' }}>
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '12.5%' }} />
              <col style={{ width: '12.5%' }} />
              <col style={{ width: '12.5%' }} />
              <col style={{ width: '12.5%' }} />
              <col style={{ width: '12.5%' }} />
              <col style={{ width: '12.5%' }} />
            </colgroup>
            <thead>
              <tr class="table-header border-bottom-0">
                <th rowSpan={2} class="align-middle border-bottom-0 ps-3 text-start bg-white" style={{ textTransform: 'none' }}></th>
                <th colSpan={2} class="bg-light-bf border-start" style={{ textTransform: 'none' }}>Breakfast</th>
                <th colSpan={2} class="bg-light-ln border-start" style={{ textTransform: 'none' }}>Lunch</th>
                <th colSpan={2} class="bg-light-dn border-start" style={{ textTransform: 'none' }}>Dinner</th>
              </tr>
              <tr class="table-header extra-small border-top-0">
                <th class="bg-light-bf border-start" style={{ textTransform: 'none' }}>Ad</th>
                <th class="bg-light-bf" style={{ textTransform: 'none' }}>Ch</th>
                <th class="bg-light-ln border-start" style={{ textTransform: 'none' }}>Ad</th>
                <th class="bg-light-ln" style={{ textTransform: 'none' }}>Ch</th>
                <th class="bg-light-dn border-start" style={{ textTransform: 'none' }}>Ad</th>
                <th class="bg-light-dn" style={{ textTransform: 'none' }}>Ch</th>
              </tr>
            </thead>
            <tbody>
              {list.map(day => (
                <tr class="ir-table-row">
                  <td class="ps-3 text-start fw-bold text-dark">{moment(getDateVal(day)).format('ddd MMM DD, YYYY')}</td>
                  <td class="bg-light-bf border-start">{getVal(day, 'Breakfast_Ad')}</td>
                  <td class="bg-light-bf text-muted">{getVal(day, 'Breakfast_Ch')}</td>
                  <td class="bg-light-ln border-start">{getVal(day, 'Lunch_Ad')}</td>
                  <td class="bg-light-ln text-muted">{getVal(day, 'Lunch_Ch')}</td>
                  <td class="bg-light-dn border-start">{getVal(day, 'Dinner_Ad')}</td>
                  <td class="bg-light-dn text-muted">{getVal(day, 'Dinner_Ch')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Host>
    );
  }
}
