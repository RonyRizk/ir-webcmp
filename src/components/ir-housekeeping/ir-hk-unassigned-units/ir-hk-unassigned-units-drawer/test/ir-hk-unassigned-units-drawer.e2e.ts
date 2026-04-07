import { newE2EPage } from '@stencil/core/testing';

describe('ir-hk-unassigned-units-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-hk-unassigned-units-drawer></ir-hk-unassigned-units-drawer>');

    const element = await page.find('ir-hk-unassigned-units-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
