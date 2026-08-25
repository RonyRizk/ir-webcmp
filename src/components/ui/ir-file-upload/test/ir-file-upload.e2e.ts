import { newE2EPage } from '@stencil/core/testing';

describe('ir-file-upload', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-file-upload></ir-file-upload>');

    const element = await page.find('ir-file-upload');
    expect(element).toHaveClass('hydrated');
  });
});
