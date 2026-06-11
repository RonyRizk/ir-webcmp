import { newE2EPage } from '@stencil/core/testing';

describe('igl-rate-extender-form', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<igl-rate-extender-form></igl-rate-extender-form>');

    const element = await page.find('igl-rate-extender-form');
    expect(element).toHaveClass('hydrated');
  });
});
