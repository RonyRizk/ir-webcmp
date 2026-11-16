import { newSpecPage } from '@stencil/core/testing';
import { IrLoginAsideShowcase } from '../ir-login-aside-showcase';

describe('ir-login-aside-showcase', () => {
  const render = () =>
    newSpecPage({
      components: [IrLoginAsideShowcase],
      html: `<ir-login-aside-showcase></ir-login-aside-showcase>`,
    });

  const segments = (root: HTMLElement) => Array.from(root.querySelectorAll<HTMLButtonElement>('.aside-showcase__segment'));
  const activeSlide = (root: HTMLElement) => root.querySelector('.aside-showcase__slide.is-active').firstElementChild.tagName.toLowerCase();

  it('opens on the calendar, with one time segment per ad', async () => {
    const page = await render();

    expect(activeSlide(page.root)).toBe('ir-login-aside-calendar');
    expect(segments(page.root)).toHaveLength(2);
    expect(segments(page.root)[0].getAttribute('aria-current')).toBe('true');
    expect(segments(page.root)[1].getAttribute('aria-current')).toBeNull();
  });

  it('runs the timer on the active segment only', async () => {
    const page = await render();

    expect(page.root.querySelectorAll('.aside-showcase__fill')).toHaveLength(1);
    expect(segments(page.root)[0].querySelector('.aside-showcase__fill')).not.toBeNull();
  });

  it('gives the dynamic pricing timer the length of its story', async () => {
    const page = await render();

    segments(page.root)[1].click();
    await page.waitForChanges();

    expect(segments(page.root)[1].querySelector<HTMLElement>('.aside-showcase__fill').style.animationDuration).toBe('13580ms');
  });

  it('loops through the ads and back to the first', async () => {
    const page = await render();
    const loop = page.root.querySelector<HTMLButtonElement>('.aside-showcase__loop');

    loop.click();
    await page.waitForChanges();
    expect(activeSlide(page.root)).toBe('ir-login-aside-dynamic-pricing');

    loop.click();
    await page.waitForChanges();
    expect(activeSlide(page.root)).toBe('ir-login-aside-calendar');
  });

  it('jumps straight to a slide from its segment, and ignores the one already on show', async () => {
    const page = await render();

    segments(page.root)[0].click();
    await page.waitForChanges();
    expect(page.root.querySelectorAll('.aside-showcase__slide')).toHaveLength(1);

    segments(page.root)[1].click();
    await page.waitForChanges();
    expect(activeSlide(page.root)).toBe('ir-login-aside-dynamic-pricing');
  });

  it('keeps the outgoing slide underneath during a switch, unreachable to keyboard users', async () => {
    const page = await render();

    segments(page.root)[1].click();
    await page.waitForChanges();

    const slides = page.root.querySelectorAll('.aside-showcase__slide');
    expect(slides).toHaveLength(2);
    expect(slides[0].hasAttribute('inert')).toBe(true);
    expect(slides[1].hasAttribute('inert')).toBe(false);
    expect(slides[1].classList.contains('is-entering')).toBe(true);
  });

  it('restarts a slide that is called back while it is still fading out', async () => {
    const page = await render();

    segments(page.root)[1].click();
    await page.waitForChanges();
    const firstShowing = page.root.querySelector('ir-login-aside-dynamic-pricing');

    segments(page.root)[0].click();
    await page.waitForChanges();
    expect(page.root.contains(firstShowing)).toBe(true);

    segments(page.root)[1].click();
    await page.waitForChanges();
    expect(page.root.contains(firstShowing)).toBe(false);
    expect(page.root.querySelector('ir-login-aside-dynamic-pricing')).not.toBeNull();
  });

  it('never lets a button submit the login form it may sit inside', async () => {
    const page = await render();

    page.root.querySelectorAll('button').forEach(button => expect(button.getAttribute('type')).toBe('button'));
  });

  it('uses server-provided labels and falls back to English for missing keys', async () => {
    const page = await render();

    page.root.localeEntries = { Lcz_LoginPromoShowNext: 'Suivant' };
    await page.waitForChanges();

    expect(page.root.querySelector('.aside-showcase__loop').getAttribute('aria-label')).toBe('Suivant');
    expect(segments(page.root)[1].getAttribute('aria-label')).toBe('Dynamic Pricing');
  });
});
