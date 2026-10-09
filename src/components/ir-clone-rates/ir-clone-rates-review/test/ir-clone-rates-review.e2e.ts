import { newE2EPage } from '@stencil/core/testing';

describe('ir-clone-rates-review', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-clone-rates-review></ir-clone-rates-review>');

    const element = await page.find('ir-clone-rates-review');
    expect(element).toHaveClass('hydrated');
  });
});
