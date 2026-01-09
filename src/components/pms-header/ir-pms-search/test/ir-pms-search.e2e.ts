import { newE2EPage } from '@stencil/core/testing';

describe('ir-pms-search', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-pms-search></ir-pms-search>');

    const element = await page.find('ir-pms-search');
    expect(element).toHaveClass('hydrated');
  });
});
