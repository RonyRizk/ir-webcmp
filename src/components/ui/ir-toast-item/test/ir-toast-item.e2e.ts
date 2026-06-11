import { newE2EPage } from '@stencil/core/testing';

describe('ir-toast-item', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-toast-item></ir-toast-item>');

    const element = await page.find('ir-toast-item');
    expect(element).toHaveClass('hydrated');
  });
});
