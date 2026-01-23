import { newE2EPage } from '@stencil/core/testing';

describe('ir-rectifier', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-rectifier></ir-rectifier>');

    const element = await page.find('ir-rectifier');
    expect(element).toHaveClass('hydrated');
  });
});
