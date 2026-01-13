import { newE2EPage } from '@stencil/core/testing';

describe('ir-user-form-panel-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-user-form-panel-drawer></ir-user-form-panel-drawer>');

    const element = await page.find('ir-user-form-panel-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
