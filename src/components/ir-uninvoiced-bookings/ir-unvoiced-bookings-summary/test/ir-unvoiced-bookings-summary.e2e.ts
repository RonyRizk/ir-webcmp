import { newE2EPage } from '@stencil/core/testing';

describe('ir-unvoiced-bookings-summary', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-unvoiced-bookings-summary></ir-unvoiced-bookings-summary>');

    const element = await page.find('ir-unvoiced-bookings-summary');
    expect(element).toHaveClass('hydrated');
  });
});
