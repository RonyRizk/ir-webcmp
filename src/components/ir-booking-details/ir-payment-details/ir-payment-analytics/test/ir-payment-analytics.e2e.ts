import { newE2EPage } from '@stencil/core/testing';

describe('ir-payment-analytics', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-payment-analytics></ir-payment-analytics>');

    const element = await page.find('ir-payment-analytics');
    expect(element).toHaveClass('hydrated');
  });
});
