import { newE2EPage } from '@stencil/core/testing';

describe('ir-city-ledger-transaction-form', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-city-ledger-transaction-form></ir-city-ledger-transaction-form>');

    const element = await page.find('ir-city-ledger-transaction-form');
    expect(element).toHaveClass('hydrated');
  });
});
