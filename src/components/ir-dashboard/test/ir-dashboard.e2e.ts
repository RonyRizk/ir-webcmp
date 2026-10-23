import { newE2EPage } from '@stencil/core/testing';

describe('ir-dashboard', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-dashboard></ir-dashboard>');

    const element = await page.find('ir-dashboard');
    expect(element).toHaveClass('hydrated');
  });
});
