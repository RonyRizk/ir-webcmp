import { newE2EPage } from '@stencil/core/testing';

describe('igl-split-booking-form', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<igl-split-booking-form></igl-split-booking-form>');

    const element = await page.find('igl-split-booking-form');
    expect(element).toHaveClass('hydrated');
  });
});
