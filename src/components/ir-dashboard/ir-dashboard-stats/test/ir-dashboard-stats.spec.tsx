import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { addDaysISO, todayISO } from '@/utils/calendar-dates';
import { IrDashboardStats } from '../ir-dashboard-stats';

const performance = { occupancy: 85.29, bookedUnits: 29, roomRevenue: 2736.22, adr: 94.35 };
const units = { available: 0, outOfService: 1, blocked: 2, total: 34 };

const render = ({ date = todayISO(), isPms = true } = {}) =>
  newSpecPage({
    components: [IrDashboardStats],
    template: () => <ir-dashboard-stats date={date} isPms={isPms} performance={performance} units={units} pendingUnits={0} currencySymbol="€"></ir-dashboard-stats>,
  });

const unitLabels = (root: HTMLElement) => Array.from(root.querySelectorAll('.stats__unit-label')).map(el => el.textContent);
const kpiLabels = (root: HTMLElement) => Array.from(root.querySelectorAll('.stats__kpi-label')).map(el => el.textContent);

describe('ir-dashboard-stats', () => {
  it("titles the occupancy card with today's occupancy on today", async () => {
    const page = await render();
    expect(page.root.querySelector('.stats__title').textContent).toBe("Today's occupancy");
  });

  it('titles the occupancy card with the day itself on any other day', async () => {
    const page = await render({ date: addDaysISO(todayISO(), 1) });
    const title = page.root.querySelector('.stats__title').textContent;
    expect(title).not.toBe("Today's occupancy");
    expect(title.endsWith('.')).toBe(true);
  });

  it('shows occupancy, units booked, the bar, every unit row and RevPAR for PMS properties', async () => {
    const page = await render();
    expect(page.root.querySelector('.stats__occupancy-value').textContent).toBe('85.3%');
    expect(page.root.querySelector('.stats__booked').textContent).toBe('29 of 34 units booked');
    expect(page.root.querySelector('wa-progress-bar')).not.toBeNull();
    expect(unitLabels(page.root)).toEqual(['Available', 'Booked', 'Pending', 'OOS', 'Blocked']);
    expect(kpiLabels(page.root)).toEqual(['Room Revenue', 'ADR', 'RevPAR']);
  });

  it('sizes every amount from its full length instead of truncating it', async () => {
    const page = await render();
    const values = Array.from(page.root.querySelectorAll('.stats__kpi-value')) as HTMLElement[];
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value.style.getPropertyValue('--kpi-chars')).toBe(String(value.textContent.length));
      expect(value.hasAttribute('title')).toBe(false);
    }
  });

  it('never rounds a nearly full house up to 100%', async () => {
    const page = await newSpecPage({
      components: [IrDashboardStats],
      template: () => <ir-dashboard-stats date={todayISO()} performance={{ ...performance, occupancy: 99.99 }} units={units} pendingUnits={0}></ir-dashboard-stats>,
    });
    expect(page.root.querySelector('.stats__occupancy-value').textContent).toBe('99.9%');
  });

  it('shows only booked and pending, without occupancy or RevPAR, for non-PMS properties', async () => {
    const page = await render({ isPms: false });
    expect(page.root.querySelector('.stats__occupancy')).toBeNull();
    expect(page.root.querySelector('wa-progress-bar')).toBeNull();
    expect(unitLabels(page.root)).toEqual(['Booked', 'Pending']);
    expect(page.root.querySelector('.stats__units').classList.contains('stats__units--stacked')).toBe(true);
    expect(kpiLabels(page.root)).toEqual(['Room Revenue', 'ADR']);
  });
});
