import { newE2EPage } from '@stencil/core/testing';

describe('ir-hk-unassigned-units-drawer-form', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-hk-unassigned-units-drawer-form></ir-hk-unassigned-units-drawer-form>');

    const element = await page.find('ir-hk-unassigned-units-drawer-form');
    expect(element).toHaveClass('hydrated');
  });
});
