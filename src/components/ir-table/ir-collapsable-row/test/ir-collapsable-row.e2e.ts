import { newE2EPage } from '@stencil/core/testing';

describe('ir-collapsable-row', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-collapsable-row></ir-collapsable-row>');

    const element = await page.find('ir-collapsable-row');
    expect(element).toHaveClass('hydrated');
  });
});
