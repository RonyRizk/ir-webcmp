import { newE2EPage } from '@stencil/core/testing';

describe('ir-air-date-picker', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-air-date-picker></ir-air-date-picker>');

    const element = await page.find('ir-air-date-picker');
    expect(element).toHaveClass('hydrated');
  });
});
