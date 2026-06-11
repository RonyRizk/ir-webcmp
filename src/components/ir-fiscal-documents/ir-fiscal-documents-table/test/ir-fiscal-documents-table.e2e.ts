import { newE2EPage } from '@stencil/core/testing';

describe('ir-fiscal-documents-table', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-fiscal-documents-table></ir-fiscal-documents-table>');

    const element = await page.find('ir-fiscal-documents-table');
    expect(element).toHaveClass('hydrated');
  });
});
