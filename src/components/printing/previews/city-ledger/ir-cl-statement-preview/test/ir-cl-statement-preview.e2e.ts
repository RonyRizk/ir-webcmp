import { newE2EPage } from '@stencil/core/testing';

describe('ir-cl-statement-preview', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-cl-statement-preview></ir-cl-statement-preview>');

    const element = await page.find('ir-cl-statement-preview');
    expect(element).toHaveClass('hydrated');
  });
});
