import { newE2EPage } from '@stencil/core/testing';

describe('ir-filter-card', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-filter-card></ir-filter-card>');

    const element = await page.find('ir-filter-card');
    expect(element).toHaveClass('hydrated');
  });
});
