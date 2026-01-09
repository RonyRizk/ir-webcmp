import { newE2EPage } from '@stencil/core/testing';

describe('ir-pms-page', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-pms-page></ir-pms-page>');

    const element = await page.find('ir-pms-page');
    expect(element).toHaveClass('hydrated');
  });
});
