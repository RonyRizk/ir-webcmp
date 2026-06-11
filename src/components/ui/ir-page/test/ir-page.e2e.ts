import { newE2EPage } from '@stencil/core/testing';

describe('ir-page', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-page></ir-page>');

    const element = await page.find('ir-page');
    expect(element).toHaveClass('hydrated');
  });
});
