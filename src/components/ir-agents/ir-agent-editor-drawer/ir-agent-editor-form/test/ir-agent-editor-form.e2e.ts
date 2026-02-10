import { newE2EPage } from '@stencil/core/testing';

describe('ir-agent-editor-form', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-agent-editor-form></ir-agent-editor-form>');

    const element = await page.find('ir-agent-editor-form');
    expect(element).toHaveClass('hydrated');
  });
});
