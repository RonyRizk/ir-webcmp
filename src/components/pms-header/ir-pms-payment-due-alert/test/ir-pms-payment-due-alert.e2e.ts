import { newE2EPage } from '@stencil/core/testing';

describe('ir-pms-payment-due-alert', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-pms-payment-due-alert></ir-pms-payment-due-alert>');

    const element = await page.find('ir-pms-payment-due-alert');
    expect(element).toHaveClass('hydrated');
  });
});
