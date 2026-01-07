import { newE2EPage } from '@stencil/core/testing';

describe('ir-booking-new-form', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-booking-new-form></ir-booking-new-form>');

    const element = await page.find('ir-booking-new-form');
    expect(element).toHaveClass('hydrated');
  });
});
