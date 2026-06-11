import { newE2EPage } from '@stencil/core/testing';

describe('ir-city-ledger-folio', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-city-ledger-folio></ir-city-ledger-folio>');

    const element = await page.find('ir-city-ledger-folio');
    expect(element).toHaveClass('hydrated');
  });
});
