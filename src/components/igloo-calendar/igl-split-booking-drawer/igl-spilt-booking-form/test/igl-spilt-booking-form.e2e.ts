import { newE2EPage } from '@stencil/core/testing';

describe('igl-spilt-booking-form', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<igl-spilt-booking-form></igl-spilt-booking-form>');

    const element = await page.find('igl-spilt-booking-form');
    expect(element).toHaveClass('hydrated');
  });
});
