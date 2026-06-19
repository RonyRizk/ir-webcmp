import { newE2EPage } from '@stencil/core/testing';

describe('ir-metric-card', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-metric-card></ir-metric-card>');

    const element = await page.find('ir-metric-card');
    expect(element).toHaveClass('hydrated');
  });
});
