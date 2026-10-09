import { newE2EPage } from '@stencil/core/testing';

describe('ir-clone-rates-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-clone-rates-drawer></ir-clone-rates-drawer>');

    const element = await page.find('ir-clone-rates-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
