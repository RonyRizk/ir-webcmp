import { newE2EPage } from '@stencil/core/testing';

describe('ir-toasts-provider', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-toasts-provider></ir-toasts-provider>');

    const element = await page.find('ir-toasts-provider');
    expect(element).toHaveClass('hydrated');
  });
});
