import { newE2EPage } from '@stencil/core/testing';

describe('ir-hk-user-drawer-form', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-hk-user-drawer-form></ir-hk-user-drawer-form>');

    const element = await page.find('ir-hk-user-drawer-form');
    expect(element).toHaveClass('hydrated');
  });
});
