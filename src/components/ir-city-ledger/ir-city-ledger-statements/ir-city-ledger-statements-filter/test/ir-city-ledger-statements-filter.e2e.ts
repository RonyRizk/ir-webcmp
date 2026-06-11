import { newE2EPage } from '@stencil/core/testing';

describe('ir-city-ledger-statements-filter', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-city-ledger-statements-filter></ir-city-ledger-statements-filter>');

    const element = await page.find('ir-city-ledger-statements-filter');
    expect(element).toHaveClass('hydrated');
  });
});
