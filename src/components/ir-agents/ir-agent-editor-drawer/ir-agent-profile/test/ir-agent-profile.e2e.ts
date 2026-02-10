import { newE2EPage } from '@stencil/core/testing';

describe('ir-agent-profile', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-agent-profile></ir-agent-profile>');

    const element = await page.find('ir-agent-profile');
    expect(element).toHaveClass('hydrated');
  });
});
