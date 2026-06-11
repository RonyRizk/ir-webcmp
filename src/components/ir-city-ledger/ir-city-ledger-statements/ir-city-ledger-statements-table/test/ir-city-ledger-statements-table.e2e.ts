import { newE2EPage } from '@stencil/core/testing';

describe('ir-city-ledger-statements-table', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-city-ledger-statements-table></ir-city-ledger-statements-table>');

    const element = await page.find('ir-city-ledger-statements-table');
    expect(element).toHaveClass('hydrated');
  });
});
