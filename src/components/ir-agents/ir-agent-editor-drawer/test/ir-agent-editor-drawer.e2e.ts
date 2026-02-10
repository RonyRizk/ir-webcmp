import { newE2EPage } from '@stencil/core/testing';

describe('ir-agent-editor-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-agent-editor-drawer></ir-agent-editor-drawer>');

    const element = await page.find('ir-agent-editor-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
