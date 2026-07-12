import { newE2EPage } from '@stencil/core/testing';

describe('ir-dp-report', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-dp-report></ir-dp-report>');

    const element = await page.find('ir-dp-report');
    expect(element).toHaveClass('hydrated');
  });
});
