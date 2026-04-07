import { newE2EPage } from '@stencil/core/testing';

describe('ir-hk-delete-dialog', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-hk-delete-dialog></ir-hk-delete-dialog>');

    const element = await page.find('ir-hk-delete-dialog');
    expect(element).toHaveClass('hydrated');
  });
});
