import { newE2EPage } from '@stencil/core/testing';

describe('ir-city-ledger-folio-table', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-city-ledger-folio-table></ir-city-ledger-folio-table>');

    const element = await page.find('ir-city-ledger-folio-table');
    expect(element).toHaveClass('hydrated');
  });
});
