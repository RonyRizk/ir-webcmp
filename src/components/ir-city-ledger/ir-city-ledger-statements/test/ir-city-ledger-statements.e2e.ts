import { newE2EPage } from '@stencil/core/testing';

describe('ir-city-ledger-statements', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-city-ledger-statements></ir-city-ledger-statements>');

    const element = await page.find('ir-city-ledger-statements');
    expect(element).toHaveClass('hydrated');
  });
});
