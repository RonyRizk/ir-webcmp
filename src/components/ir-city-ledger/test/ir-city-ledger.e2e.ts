import { newE2EPage } from '@stencil/core/testing';

describe('ir-city-ledger', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-city-ledger></ir-city-ledger>');

    const element = await page.find('ir-city-ledger');
    expect(element).toHaveClass('hydrated');
  });
});
