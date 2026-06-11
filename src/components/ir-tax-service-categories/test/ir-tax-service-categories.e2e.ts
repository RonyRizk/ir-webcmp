import { newE2EPage } from '@stencil/core/testing';

describe('ir-tax-service-categories', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-tax-service-categories></ir-tax-service-categories>');

    const element = await page.find('ir-tax-service-categories');
    expect(element).toHaveClass('hydrated');
  });
});
