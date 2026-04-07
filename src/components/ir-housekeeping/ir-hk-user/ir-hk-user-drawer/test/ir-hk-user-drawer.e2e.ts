import { newE2EPage } from '@stencil/core/testing';

describe('ir-hk-user-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-hk-user-drawer></ir-hk-user-drawer>');

    const element = await page.find('ir-hk-user-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
