import { newE2EPage } from '@stencil/core/testing';

describe('ir-reallocation-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-reallocation-drawer></ir-reallocation-drawer>');

    const element = await page.find('ir-reallocation-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
