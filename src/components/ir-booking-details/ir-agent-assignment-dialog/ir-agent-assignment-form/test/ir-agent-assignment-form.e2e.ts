import { newE2EPage } from '@stencil/core/testing';

describe('ir-agent-assignment-form', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-agent-assignment-form></ir-agent-assignment-form>');

    const element = await page.find('ir-agent-assignment-form');
    expect(element).toHaveClass('hydrated');
  });
});
