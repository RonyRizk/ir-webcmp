import { newE2EPage } from '@stencil/core/testing';

describe('ir-cl-receipt-preview', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-cl-receipt-preview></ir-cl-receipt-preview>');

    const element = await page.find('ir-cl-receipt-preview');
    expect(element).toHaveClass('hydrated');
  });
});
