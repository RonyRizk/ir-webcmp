import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { addDaysISO, todayISO } from '@/utils/calendar-dates';
import type { DashboardUnits } from '@/services/dashboard';
import { IrDashboardStats } from '../ir-dashboard-stats';

const performance = { occupancy: 85.29, bookedUnits: 29, roomRevenue: 2736.22, adr: 94.35 };
const real = { booked: 2, total: 33, percent: (2 / 33) * 100 };
const units: DashboardUnits = { available: 0, outOfService: 1, blocked: 2, total: 36, occupancy: { real, virtual: { booked: 0, total: 3, percent: 0 } } };

const render = ({ date = todayISO(), isPms = true, unitsOverride = units }: { date?: string; isPms?: boolean; unitsOverride?: DashboardUnits } = {}) =>
  newSpecPage({
    components: [IrDashboardStats],
    template: () => <ir-dashboard-stats date={date} isPms={isPms} performance={performance} units={unitsOverride} pendingUnits={0} currencySymbol="€"></ir-dashboard-stats>,
  });

const texts = (root: HTMLElement, selector: string) => Array.from(root.querySelectorAll(selector)).map(el => el.textContent);

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

  it('shows real and fake occupancy from the calendar, the bar, every unit row and RevPAR for PMS properties', async () => {
    const page = await render();
    expect(texts(page.root, '.stats__occupancy-value')).toEqual(['6.1%', '0%']);
    expect(texts(page.root, '.stats__figure-label')).toEqual(['Real units', 'Fake units']);
    expect(texts(page.root, '.stats__booked')).toEqual(['2 of 33 booked', '0 of 3 booked']);
    expect(unitLabels(page.root)).toEqual(['Available', 'Booked', 'Pending', 'OOS', 'Blocked']);
    expect(kpiLabels(page.root)).toEqual(['Room Revenue', 'ADR', 'RevPAR']);
  });

  it('splits the bar into a segment per kind, sized by its units, each with a tooltip', async () => {
    const page = await render();
    const segments = Array.from(page.root.querySelectorAll('.stats__segment')) as HTMLElement[];
    expect(segments.map(s => s.style.flexGrow)).toEqual(['33', '3']);
    expect(segments.map(s => s.getAttribute('aria-valuenow'))).toEqual([String(real.percent), '0']);
    const tooltips = Array.from(page.root.querySelectorAll('wa-tooltip'));
    expect(tooltips.map(t => t.getAttribute('for'))).toEqual(segments.map(s => s.id));
    expect(tooltips[0].textContent).toContain('Real units: 6.1%');
  });

  it('shows only the real figure and segment when the property has no virtual room types', async () => {
    const page = await render({ unitsOverride: { ...units, occupancy: { real, virtual: undefined } } });
    expect(texts(page.root, '.stats__figure-label')).toEqual(['Real units']);
    expect(page.root.querySelectorAll('.stats__segment').length).toBe(1);
    expect(page.root.querySelector('.stats__occupancy--split')).toBeNull();
  });

  it("doesn't mention fake units when the virtual room types have none", async () => {
    const page = await render({ unitsOverride: { ...units, occupancy: { real, virtual: { booked: 0, total: 0, percent: 0 } } } });
    expect(texts(page.root, '.stats__figure-label')).toEqual(['Real units']);
    expect(page.root.querySelectorAll('.stats__segment').length).toBe(1);
    expect(page.root.querySelectorAll('wa-tooltip').length).toBe(1);
    expect(page.root.querySelector('.stats__occupancy--split')).toBeNull();
  });

  it('sizes every amount, percentage and count from its full length instead of truncating it', async () => {
    const page = await render();
    const values = Array.from(page.root.querySelectorAll('.stats__kpi-value')) as HTMLElement[];
    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value.style.getPropertyValue('--kpi-chars')).toBe(String(value.textContent.length));
      expect(value.hasAttribute('title')).toBe(false);
    }
    for (const value of Array.from(page.root.querySelectorAll('.stats__occupancy-value')) as HTMLElement[]) {
      expect(value.style.getPropertyValue('--figure-chars')).toBe(String(value.textContent.length));
    }
    for (const value of Array.from(page.root.querySelectorAll('.stats__unit-value')) as HTMLElement[]) {
      expect(value.style.getPropertyValue('--unit-chars')).toBe(String(value.textContent.length));
    }
  });

  it('never rounds a nearly full house up to 100%', async () => {
    const page = await render({ unitsOverride: { ...units, occupancy: { real: { booked: 9999, total: 10000, percent: 99.99 } } } });
    expect(page.root.querySelector('.stats__occupancy-value').textContent).toBe('99.9%');
  });

  it('shows only booked and pending, without occupancy, ADR or RevPAR, for non-PMS properties', async () => {
    const page = await render({ isPms: false });
    expect(page.root.querySelector('.stats__occupancy')).toBeNull();
    expect(page.root.querySelector('.stats__bar')).toBeNull();
    expect(unitLabels(page.root)).toEqual(['Booked', 'Pending']);
    expect(page.root.querySelector('.stats__units').classList.contains('stats__units--stacked')).toBe(true);
    expect(kpiLabels(page.root)).toEqual(['Room Revenue']);
  });
});
