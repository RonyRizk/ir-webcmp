import { newE2EPage } from '@stencil/core/testing';

describe('ir-city-ledger-folio-filters', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-city-ledger-folio-filters></ir-city-ledger-folio-filters>');

    const element = await page.find('ir-city-ledger-folio-filters');
    expect(element).toHaveClass('hydrated');
  });
});
