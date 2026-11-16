import { newE2EPage } from '@stencil/core/testing';

describe('ir-translatable-textarea', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-translatable-textarea></ir-translatable-textarea>');

    const element = await page.find('ir-translatable-textarea');
    expect(element).toHaveClass('hydrated');
  });
});
