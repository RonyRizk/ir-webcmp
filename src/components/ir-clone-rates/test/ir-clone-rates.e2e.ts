import { newE2EPage } from '@stencil/core/testing';

describe('ir-clone-rates', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-clone-rates></ir-clone-rates>');

    const element = await page.find('ir-clone-rates');
    expect(element).toHaveClass('hydrated');
  });
});
