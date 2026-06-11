import { newE2EPage } from '@stencil/core/testing';

describe('ir-cl-credit-note-preview', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-cl-credit-note-preview></ir-cl-credit-note-preview>');

    const element = await page.find('ir-cl-credit-note-preview');
    expect(element).toHaveClass('hydrated');
  });
});
