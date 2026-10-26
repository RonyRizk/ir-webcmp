import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { addDaysISO, todayISO } from '@/utils/calendar-dates';
import { IrDashboardDateNavigator } from '../ir-dashboard-date-navigator';
import { MAX_DAY_OFFSET } from '../../dashboard.helpers';

const render = (date: string) =>
  newSpecPage({
    components: [IrDashboardDateNavigator],
    template: () => <ir-dashboard-date-navigator date={date}></ir-dashboard-date-navigator>,
  });

describe('ir-dashboard-date-navigator', () => {
  it('reaches two days ahead of today', () => {
    expect(MAX_DAY_OFFSET).toBe(2);
  });

  it('lists the days from today to two ahead, with no past days, checking the selected one and marking today', async () => {
    const today = todayISO();
    const page = await render(addDaysISO(today, 1));
    // wa-dropdown-item isn't defined in spec pages, so its props land as attributes.
    const items = Array.from(page.root.querySelectorAll('wa-dropdown-item'));
    const value = (item: Element) => item.getAttribute('value');
    expect(items.map(value)).toEqual([0, 1, 2].map(offset => addDaysISO(today, offset)));
    expect(items.filter(item => item.hasAttribute('checked')).map(value)).toEqual([addDaysISO(today, 1)]);
    expect(items[0].querySelector('.date-navigator__today')).not.toBeNull();
    expect(items[1].querySelector('.date-navigator__today')).toBeNull();
  });

  it('shows the selected day in the trigger', async () => {
    const page = await render(todayISO());
    expect(page.root.querySelector('.date-navigator__date').getAttribute('datetime')).toBe(todayISO());
  });

  it('emits the picked day, and nothing when the selected day is picked again', async () => {
    const today = todayISO();
    const page = await render(today);
    const spy = jest.fn();
    page.root.addEventListener('dateChange', (e: CustomEvent) => spy(e.detail));
    const dropdown = page.root.querySelector('wa-dropdown');
    const select = (value: string) => dropdown.dispatchEvent(new CustomEvent('wa-select', { detail: { item: { value } } }));
    select(today);
    select(addDaysISO(today, 2));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(addDaysISO(today, 2));
  });
});
