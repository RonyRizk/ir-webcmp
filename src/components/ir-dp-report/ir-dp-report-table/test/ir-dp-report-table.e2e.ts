import { newE2EPage } from '@stencil/core/testing';

describe('ir-dp-report-table', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-dp-report-table></ir-dp-report-table>');

    const element = await page.find('ir-dp-report-table');
    expect(element).toHaveClass('hydrated');
  });
});
