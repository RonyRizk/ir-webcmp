import { newE2EPage } from '@stencil/core/testing';

describe('ir-toast-alert', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-toast-alert></ir-toast-alert>');

    const element = await page.find('ir-toast-alert');
    expect(element).toHaveClass('hydrated');
  });
});
