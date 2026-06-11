import { newE2EPage } from '@stencil/core/testing';

describe('ir-date-range-filter', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-date-range-filter></ir-date-range-filter>');

    const element = await page.find('ir-date-range-filter');
    expect(element).toHaveClass('hydrated');
  });
});
