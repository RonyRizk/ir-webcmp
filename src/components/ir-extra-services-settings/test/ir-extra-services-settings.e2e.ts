import { newE2EPage } from '@stencil/core/testing';

describe('ir-extra-services-settings', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-extra-services-settings></ir-extra-services-settings>');

    const element = await page.find('ir-extra-services-settings');
    expect(element).toHaveClass('hydrated');
  });
});
