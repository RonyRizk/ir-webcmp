import { newE2EPage } from '@stencil/core/testing';

describe('ir-agents', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-agents></ir-agents>');

    const element = await page.find('ir-agents');
    expect(element).toHaveClass('hydrated');
  });
});
