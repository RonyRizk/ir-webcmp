import { newE2EPage } from '@stencil/core/testing';

describe('ir-dp-report-filters', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-dp-report-filters></ir-dp-report-filters>');

    const element = await page.find('ir-dp-report-filters');
    expect(element).toHaveClass('hydrated');
  });
});
