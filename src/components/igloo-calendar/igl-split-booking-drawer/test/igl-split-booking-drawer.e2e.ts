import { newE2EPage } from '@stencil/core/testing';

describe('igl-split-booking-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<igl-split-booking-drawer></igl-split-booking-drawer>');

    const element = await page.find('igl-split-booking-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
