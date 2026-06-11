import { newE2EPage } from '@stencil/core/testing';

describe('ir-tax-input', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-tax-input></ir-tax-input>');

    const element = await page.find('ir-tax-input');
    expect(element).toHaveClass('hydrated');
  });
});
