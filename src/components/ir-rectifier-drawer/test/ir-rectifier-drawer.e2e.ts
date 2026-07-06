import { newE2EPage } from '@stencil/core/testing';

describe('ir-rectifier-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-rectifier-drawer></ir-rectifier-drawer>');

    const element = await page.find('ir-rectifier-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
