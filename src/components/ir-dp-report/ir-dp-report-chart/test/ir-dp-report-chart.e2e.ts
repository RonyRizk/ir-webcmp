import { newE2EPage } from '@stencil/core/testing';

describe('ir-dp-report-chart', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-dp-report-chart></ir-dp-report-chart>');

    const element = await page.find('ir-dp-report-chart');
    expect(element).toHaveClass('hydrated');
  });
});
