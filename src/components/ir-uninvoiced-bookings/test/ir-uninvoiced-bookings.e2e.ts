import { newE2EPage } from '@stencil/core/testing';

describe('ir-uninvoiced-bookings', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-uninvoiced-bookings></ir-uninvoiced-bookings>');

    const element = await page.find('ir-uninvoiced-bookings');
    expect(element).toHaveClass('hydrated');
  });
});
