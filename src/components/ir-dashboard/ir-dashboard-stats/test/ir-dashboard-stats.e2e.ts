import { newE2EPage } from '@stencil/core/testing';

describe('ir-dashboard-stats', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-dashboard-stats></ir-dashboard-stats>');

    const element = await page.find('ir-dashboard-stats');
    expect(element).toHaveClass('hydrated');
  });
});
