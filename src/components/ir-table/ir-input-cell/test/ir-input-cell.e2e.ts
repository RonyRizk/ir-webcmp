import { newE2EPage } from '@stencil/core/testing';

describe('ir-input-cell', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-input-cell></ir-input-cell>');

    const element = await page.find('ir-input-cell');
    expect(element).toHaveClass('hydrated');
  });
});
