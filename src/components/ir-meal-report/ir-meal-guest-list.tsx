import { Component, Host, h, Prop } from '@stencil/core';
import { MealGuestEntry } from '@/services/meal-report/types';

@Component({
  tag: 'ir-meal-guest-list',
  styleUrls: ['ir-meal-guest-list.css', '../../common/table.css'],
  scoped: true,
})
export class IrMealGuestList {
  @Prop() guestList: MealGuestEntry[] = [];

  render() {
    const list = this.guestList;

    if (!list || list.length === 0) {
      return (
        <div class="ir-meal-guest-list__empty-state">
          <p class="mb-0 small">No guests found for current filters.</p>
        </div>
      );
    }

    const totalAdults = list.reduce((sum, item) => sum + item.occupancy.adult_nbr, 0);
    const totalChildren = list.reduce((sum, item) => sum + item.occupancy.children_nbr, 0);

    return (
      <Host>
        <div class="ir-meal-guest-list__container table--container">
          <table class="table align-middle mb-0 ir-meal-guest-list__table">
            <thead>
              <tr class="table-header">
                <th class="ps-4 text-start ir-meal-guest-list__header-cell">Unit</th>
                <th class="px-4 text-start ir-meal-guest-list__header-cell">Guest name</th>
                <th class="px-4 text-center ir-meal-guest-list__header-cell">Ad - Ch</th>
                <th class="px-4 text-start ir-meal-guest-list__header-cell">Source</th>
                <th class="pe-4 text-start ir-meal-guest-list__header-cell">Rate plan</th>
              </tr>
            </thead>
            <tbody>
              {list.map(entry => (
                <tr class="ir-table-row border-bottom">
                  <td class="ps-4 text-start py-2 ir-meal-guest-list__cell">
                    <span class="text-dark fw-bold">{entry.unit.name}</span>
                  </td>
                  <td class="px-4 text-start py-2 ir-meal-guest-list__cell">
                    <div class="ir-meal-guest-list__guest-info">
                        <span class="text-dark">{entry.guest.first_name} {entry.guest.last_name}</span>
                        {entry.is_arriving_today && <wa-tag size="small" variant="brand" pill class="ir-meal-guest-list__arr-tag">ARR</wa-tag>}
                    </div>
                  </td>
                  <td class="px-4 text-center py-2 ir-meal-guest-list__cell" style={{ color: 'var(--wa-color-text-quiet)' }}>{entry.occupancy.adult_nbr} - {entry.occupancy.children_nbr}</td>
                  <td class="px-4 text-muted text-start py-2 ir-meal-guest-list__cell">
                    <span>{entry.source?.Label}</span>
                  </td>
                  <td class="pe-4 text-muted text-start py-2 ir-meal-guest-list__cell">{entry.rate_plan.short_name}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr class="ir-meal-guest-list__total-row">
                <td class="ps-3"></td>
                <td class="ir-meal-guest-list__total-label py-2">Total</td>
                <td class="ir-meal-guest-list__total-value py-2">
                    {totalAdults} - {totalChildren}
                </td>
                <td colSpan={2} class="ir-meal-guest-list__total-meta py-2">
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
