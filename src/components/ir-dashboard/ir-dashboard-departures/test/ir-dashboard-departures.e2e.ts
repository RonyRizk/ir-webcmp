import { newE2EPage } from '@stencil/core/testing';

describe('ir-dashboard-departures', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-dashboard-departures></ir-dashboard-departures>');

    const element = await page.find('ir-dashboard-departures');
    expect(element).toHaveClass('hydrated');
  });
});
