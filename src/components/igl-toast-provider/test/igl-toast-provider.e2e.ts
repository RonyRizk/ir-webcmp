import { newE2EPage } from '@stencil/core/testing';

describe('igl-toast-provider', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<igl-toast-provider></igl-toast-provider>');

    const element = await page.find('igl-toast-provider');
    expect(element).toHaveClass('hydrated');
  });
});
