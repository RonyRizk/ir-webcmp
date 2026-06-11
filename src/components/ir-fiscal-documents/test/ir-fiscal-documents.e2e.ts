import { newE2EPage } from '@stencil/core/testing';

describe('ir-fiscal-documents', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-fiscal-documents></ir-fiscal-documents>');

    const element = await page.find('ir-fiscal-documents');
    expect(element).toHaveClass('hydrated');
  });
});
