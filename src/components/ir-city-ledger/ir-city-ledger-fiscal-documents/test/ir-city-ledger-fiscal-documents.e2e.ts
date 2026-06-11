import { newE2EPage } from '@stencil/core/testing';

describe('ir-city-ledger-fiscal-documents', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-city-ledger-fiscal-documents></ir-city-ledger-fiscal-documents>');

    const element = await page.find('ir-city-ledger-fiscal-documents');
    expect(element).toHaveClass('hydrated');
  });
});
