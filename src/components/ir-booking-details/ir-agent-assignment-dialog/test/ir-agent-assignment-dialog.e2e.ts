import { newE2EPage } from '@stencil/core/testing';

describe('ir-agent-assignment-dialog', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-agent-assignment-dialog></ir-agent-assignment-dialog>');

    const element = await page.find('ir-agent-assignment-dialog');
    expect(element).toHaveClass('hydrated');
  });
});
