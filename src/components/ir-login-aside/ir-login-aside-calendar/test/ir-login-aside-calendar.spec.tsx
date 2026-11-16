import { newSpecPage } from '@stencil/core/testing';
import { IrLoginAsideCalendar } from '../ir-login-aside-calendar';

describe('ir-login-aside-calendar', () => {
  it('renders the current week with today highlighted', async () => {
    const page = await newSpecPage({
      components: [IrLoginAsideCalendar],
      html: `<ir-login-aside-calendar></ir-login-aside-calendar>`,
    });

    const now = new Date();
    const days = Array.from(page.root.querySelectorAll('.cal__day'));
    const today = page.root.querySelector('.cal__day.is-today');

    expect(days).toHaveLength(7);
    expect(days.indexOf(today)).toBe(now.getDay());
    expect(today.querySelector('.cal__day-title').textContent).toContain(String(now.getDate()));
    expect(page.root.querySelector('.cal__month').textContent).toContain(String(now.getFullYear()));

    // Today's column is tinted in every grid row (2 room-type rows + 5 units)
    expect(page.root.querySelectorAll('.cal__cell.is-today')).toHaveLength(7);
  });

  it('uses server-provided labels and falls back to English for missing keys', async () => {
    const page = await newSpecPage({
      components: [IrLoginAsideCalendar],
      html: `<ir-login-aside-calendar></ir-login-aside-calendar>`,
    });

    expect(page.root.querySelector('.pms-auth__promo-title').textContent).toBe('One calendar. Every booking.');

    page.root.localeEntries = { Lcz_LoginPromoTitle: 'Un calendrier. Toutes les réservations.' };
    await page.waitForChanges();

    expect(page.root.querySelector('.pms-auth__promo-title').textContent).toBe('Un calendrier. Toutes les réservations.');
    expect(page.root.querySelector('.cal__search').textContent).toContain('Find a unit');
  });
});
