import { newE2EPage } from '@stencil/core/testing';

describe('ir-guest-billing', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-guest-billing></ir-guest-billing>');

    const element = await page.find('ir-guest-billing');
    expect(element).toHaveClass('hydrated');
  });
});
