import { newE2EPage } from '@stencil/core/testing';

describe('ir-booking-rooms', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-booking-rooms></ir-booking-rooms>');

    const element = await page.find('ir-booking-rooms');
    expect(element).toHaveClass('hydrated');
  });
});
