import { newE2EPage } from '@stencil/core/testing';

describe('ir-unvoiced-bookings-filters', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-unvoiced-bookings-filters></ir-unvoiced-bookings-filters>');

    const element = await page.find('ir-unvoiced-bookings-filters');
    expect(element).toHaveClass('hydrated');
  });
});
