import { newE2EPage } from '@stencil/core/testing';

describe('ir-agent-billing', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-agent-billing></ir-agent-billing>');

    const element = await page.find('ir-agent-billing');
    expect(element).toHaveClass('hydrated');
  });
});
