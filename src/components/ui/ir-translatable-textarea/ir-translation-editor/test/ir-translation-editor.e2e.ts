import { newE2EPage } from '@stencil/core/testing';

describe('ir-translation-editor', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-translation-editor></ir-translation-editor>');

    const element = await page.find('ir-translation-editor');
    expect(element).toHaveClass('hydrated');
  });
});
