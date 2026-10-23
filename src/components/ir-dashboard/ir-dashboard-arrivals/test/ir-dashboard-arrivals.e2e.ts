import { newE2EPage } from '@stencil/core/testing';

describe('ir-dashboard-arrivals', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-dashboard-arrivals></ir-dashboard-arrivals>');

    const element = await page.find('ir-dashboard-arrivals');
    expect(element).toHaveClass('hydrated');
  });
});
