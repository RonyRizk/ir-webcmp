import { newSpecPage } from '@stencil/core/testing';
import { IrLoginAsideDynamicPricing } from '../ir-login-aside-dynamic-pricing';
import { BASE_RATE, BEATS, EXTRA_BOOKINGS, EXTRA_PROFIT, WEEK, nextBeat, rateLevel, upcomingWeek } from '../dynamic-pricing-story';

describe('dynamic pricing story', () => {
  it('derives the payoff from the week, net of the Incentives', () => {
    expect(EXTRA_PROFIT).toBe(1242);
    expect(EXTRA_BOOKINGS).toBe(3);
  });

  it('moves prices both ways', () => {
    expect(WEEK.some(night => night.rate > BASE_RATE)).toBe(true);
    expect(WEEK.some(night => night.rate < BASE_RATE)).toBe(true);
  });

  it('draws dearer nights taller, so a rate reads from its bar alone', () => {
    expect(rateLevel(99)).toBeLessThan(rateLevel(BASE_RATE));
    expect(rateLevel(165)).toBeGreaterThan(rateLevel(BASE_RATE));
  });

  it('loops back to the start after the payoff', () => {
    expect(nextBeat('payoff')).toBe('fixed');
    expect(BEATS.map(nextBeat)).toEqual(['signals', 'rates', 'bookings', 'payoff', 'fixed']);
  });

  it('always shows the coming Monday to Sunday', () => {
    // 2026-11-05 is a Thursday
    const week = upcomingWeek(new Date(2026, 10, 5));
    expect(week).toHaveLength(7);
    expect(week[0].getDay()).toBe(1);
    expect(week[0].getDate()).toBe(9);
    expect(week[6].getDay()).toBe(0);
    // A Monday skips to the next one, and a Sunday goes to tomorrow
    expect(upcomingWeek(new Date(2026, 10, 9))[0].getDate()).toBe(16);
    expect(upcomingWeek(new Date(2026, 10, 8))[0].getDate()).toBe(9);
  });
});

describe('ir-login-aside-dynamic-pricing', () => {
  const render = () =>
    newSpecPage({
      components: [IrLoginAsideDynamicPricing],
      html: `<ir-login-aside-dynamic-pricing></ir-login-aside-dynamic-pricing>`,
    });

  it('starts on fixed rates, with nothing earned yet', async () => {
    const page = await render();

    expect(page.root.querySelector('.dp-promo').getAttribute('data-beat')).toBe('fixed');
    expect(page.root.querySelectorAll('.dp-board__day')).toHaveLength(7);
    expect(page.root.querySelectorAll('.dp-rate.is-moved')).toHaveLength(0);
    expect(page.root.querySelector('.dp-stat__value--profit').textContent).toBe('+$0');
    page.root.remove();
  });

  it('never names the integration partner', async () => {
    const page = await render();

    expect(page.root.textContent.toLowerCase()).not.toContain('optim');
    page.root.remove();
  });

  it('sends people to igloorooms by email from a single link', async () => {
    const page = await render();
    const link = page.root.querySelector('.dp-promo__link');

    expect(link.getAttribute('href')).toBe('mailto:support@igloorooms.com?subject=Enable%20Dynamic%20Pricing');
    expect(link.textContent).toContain('Contact igloorooms to enable it');
    expect(link.querySelector('wa-icon').getAttribute('name')).toBe('arrow-right');
    page.root.remove();
  });

  it('uses server-provided labels and falls back to English for missing keys', async () => {
    const page = await render();

    page.root.localeEntries = { Lcz_LoginPromoDpTitle: 'Vos tarifs doivent suivre la demande.' };
    await page.waitForChanges();

    expect(page.root.querySelector('.dp-promo__title').textContent).toBe('Vos tarifs doivent suivre la demande.');
    expect(page.root.querySelector('.dp-promo__footer').textContent).toContain('Not using Dynamic Pricing yet?');
    page.root.remove();
  });

  it('holds the finished payoff frame under reduced motion', async () => {
    const page = await newSpecPage({ components: [IrLoginAsideDynamicPricing], html: '' });
    page.win.matchMedia = ((query: string) => ({ matches: query.includes('reduce') })) as unknown as typeof window.matchMedia;

    page.body.innerHTML = `<ir-login-aside-dynamic-pricing></ir-login-aside-dynamic-pricing>`;
    await page.waitForChanges();

    const root = page.body.querySelector('ir-login-aside-dynamic-pricing');
    expect(root.querySelector('.dp-promo').getAttribute('data-beat')).toBe('payoff');
    expect(root.querySelectorAll('.dp-rate.is-moved')).toHaveLength(5);
    expect(root.querySelector('.dp-stat__value--profit').textContent).toBe('+$1,242');
  });
});
