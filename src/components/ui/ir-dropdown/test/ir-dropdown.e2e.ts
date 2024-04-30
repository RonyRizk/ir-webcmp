import { newE2EPage } from '@stencil/core/testing';

describe('ir-dropdown', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-dropdown></ir-dropdown>');

    const element = await page.find('ir-dropdown');
    expect(element).toHaveClass('hydrated');
  });
});
