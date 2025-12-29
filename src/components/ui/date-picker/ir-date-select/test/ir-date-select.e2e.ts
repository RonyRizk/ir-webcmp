import { newE2EPage } from '@stencil/core/testing';

describe('ir-date-select', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-date-select></ir-date-select>');

    const element = await page.find('ir-date-select');
    expect(element).toHaveClass('hydrated');
  });
});
