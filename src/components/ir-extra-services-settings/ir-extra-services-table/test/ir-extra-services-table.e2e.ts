import { newE2EPage } from '@stencil/core/testing';

describe('ir-extra-services-table', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-extra-services-table></ir-extra-services-table>');

    const element = await page.find('ir-extra-services-table');
    expect(element).toHaveClass('hydrated');
  });
});
