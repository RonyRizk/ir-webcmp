import { newE2EPage } from '@stencil/core/testing';

describe('ir-dashboard-date-navigator', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-dashboard-date-navigator></ir-dashboard-date-navigator>');

    const element = await page.find('ir-dashboard-date-navigator');
    expect(element).toHaveClass('hydrated');
  });
});
