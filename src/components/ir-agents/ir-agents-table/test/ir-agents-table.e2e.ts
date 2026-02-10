import { newE2EPage } from '@stencil/core/testing';

describe('ir-agents-table', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-agents-table></ir-agents-table>');

    const element = await page.find('ir-agents-table');
    expect(element).toHaveClass('hydrated');
  });
});
