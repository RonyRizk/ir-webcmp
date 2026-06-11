import { newE2EPage } from '@stencil/core/testing';

describe('ir-cl-debit-note-preview', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-cl-debit-note-preview></ir-cl-debit-note-preview>');

    const element = await page.find('ir-cl-debit-note-preview');
    expect(element).toHaveClass('hydrated');
  });
});
