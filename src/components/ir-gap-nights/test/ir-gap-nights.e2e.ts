import { newE2EPage } from '@stencil/core/testing';

describe('ir-gap-nights', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-gap-nights></ir-gap-nights>');

    const element = await page.find('ir-gap-nights');
    expect(element).toHaveClass('hydrated');
  });
});
