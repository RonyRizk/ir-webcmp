import { newE2EPage } from '@stencil/core/testing';

describe('ir-city-ledger-transaction-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-city-ledger-transaction-drawer></ir-city-ledger-transaction-drawer>');

    const element = await page.find('ir-city-ledger-transaction-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
