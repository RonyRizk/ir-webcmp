import { newE2EPage } from '@stencil/core/testing';

describe('ir-property-switcher', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-property-switcher></ir-property-switcher>');

    const element = await page.find('ir-property-switcher');
    expect(element).toHaveClass('hydrated');
  });
});
