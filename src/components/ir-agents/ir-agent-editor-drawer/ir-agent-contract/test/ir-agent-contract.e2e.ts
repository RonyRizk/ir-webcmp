import { newE2EPage } from '@stencil/core/testing';

describe('ir-agent-contract', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-agent-contract></ir-agent-contract>');

    const element = await page.find('ir-agent-contract');
    expect(element).toHaveClass('hydrated');
  });
});
