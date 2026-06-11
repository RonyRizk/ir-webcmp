import { newE2EPage } from '@stencil/core/testing';

describe('ir-fiscal-documents-filters', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-fiscal-documents-filters></ir-fiscal-documents-filters>');

    const element = await page.find('ir-fiscal-documents-filters');
    expect(element).toHaveClass('hydrated');
  });
});
