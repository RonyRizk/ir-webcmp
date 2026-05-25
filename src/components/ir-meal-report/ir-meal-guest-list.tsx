import { Component, Host, h, Prop } from '@stencil/core';
import { mealReportStore } from '../../stores/meal-report.store';

@Component({
  tag: 'ir-meal-guest-list',
  styleUrls: ['ir-meal-guest-list.css', '../../common/table.css'],
  scoped: true,
})
export class IrMealGuestList {
  @Prop() propertyid: number;
  @Prop() ticket: string;

  render() {
    const list = mealReportStore.guestList;

    if (!list || list.length === 0) {
      return (
        <div class="text-center p-4 text-muted border-0 bg-white">
          <p class="mb-0 small">No guests found for current filters.</p>
        </div>
      );
    }

    const totalAdults = list.reduce((sum, item) => sum + item.occupancy.adult_nbr, 0);
    const totalChildren = list.reduce((sum, item) => sum + item.occupancy.children_nbr, 0);

    return (
      <Host>
        <div class="table-container p-0 m-0 table-responsive border rounded bg-white shadow-sm d-inline-block" style={{ maxWidth: '100%' }}>
          <table class="table align-middle mb-0" style={{ width: 'auto' }}>
            <thead>
              <tr class="table-header">
                <th class="ps-4 text-start" style={{ textTransform: 'none', fontSize: '11px', whiteSpace: 'nowrap' }}>Unit</th>
                <th class="px-4 text-start" style={{ textTransform: 'none', fontSize: '11px', whiteSpace: 'nowrap' }}>Guest name</th>
                <th class="px-4 text-center" style={{ textTransform: 'none', fontSize: '11px', whiteSpace: 'nowrap' }}>Ad - Ch</th>
                <th class="px-4 text-start" style={{ textTransform: 'none', fontSize: '11px', whiteSpace: 'nowrap' }}>Source</th>
                <th class="pe-4 text-start" style={{ textTransform: 'none', fontSize: '11px', whiteSpace: 'nowrap' }}>Rate plan</th>
              </tr>
            </thead>
            <tbody>
              {list.map(entry => (
                <tr class="ir-table-row border-bottom">
                  <td class="ps-4 text-start py-2" style={{ whiteSpace: 'nowrap' }}>
                    <span class="text-dark fw-bold" style={{ fontSize: '11px' }}>{entry.unit.name}</span>
                  </td>
                  <td class="px-4 text-start py-2" style={{ whiteSpace: 'nowrap' }}>
                    <div class="d-flex align-items-center">
                        <span class="text-dark" style={{ fontSize: '11px' }}>{entry.guest.first_name} {entry.guest.last_name}</span>
                        {entry.is_arriving_today && <wa-tag size="small" variant="brand" pill class="ms-2" style={{fontSize: '8px', padding: '0 4px'}}>ARR</wa-tag>}
                    </div>
                  </td>
                  <td class="px-4 text-center py-2" style={{ fontSize: '11px', color: '#666', whiteSpace: 'nowrap' }}>{entry.occupancy.adult_nbr} - {entry.occupancy.children_nbr}</td>
                  <td class="px-4 text-muted text-start py-2" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                    <span>{entry.source?.Label}</span>
                  </td>
                  <td class="pe-4 text-muted text-start py-2" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{entry.rate_plan.short_name}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr class="total-row bg-light">
                <td class="ps-3"></td>
                <td class="text-end fw-bold py-2 text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Total</td>
                <td class="text-center fw-bold text-primary py-2" style={{ fontSize: '12px' }}>
                    {totalAdults} - {totalChildren}
                </td>
                <td colSpan={2} class="text-muted ps-3 py-2" style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                    {list.length} Units | {totalAdults + totalChildren} Guests
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Host>
    );
  }
}
