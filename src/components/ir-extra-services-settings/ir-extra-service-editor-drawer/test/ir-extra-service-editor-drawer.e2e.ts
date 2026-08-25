import { newE2EPage } from '@stencil/core/testing';

describe('ir-extra-service-editor-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-extra-service-editor-drawer></ir-extra-service-editor-drawer>');

    const element = await page.find('ir-extra-service-editor-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
