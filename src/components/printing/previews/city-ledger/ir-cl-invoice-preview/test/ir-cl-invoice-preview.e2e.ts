import { newE2EPage } from '@stencil/core/testing';

describe('ir-cl-invoice-preview', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-cl-invoice-preview></ir-cl-invoice-preview>');

    const element = await page.find('ir-cl-invoice-preview');
    expect(element).toHaveClass('hydrated');
  });
});
