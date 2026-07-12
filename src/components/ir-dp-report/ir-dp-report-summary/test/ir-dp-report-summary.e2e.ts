import { newE2EPage } from '@stencil/core/testing';

describe('ir-dp-report-summary', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-dp-report-summary></ir-dp-report-summary>');

    const element = await page.find('ir-dp-report-summary');
    expect(element).toHaveClass('hydrated');
  });
});
