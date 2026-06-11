import { newE2EPage } from '@stencil/core/testing';

describe('igl-rate-extender-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<igl-rate-extender-drawer></igl-rate-extender-drawer>');

    const element = await page.find('igl-rate-extender-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
