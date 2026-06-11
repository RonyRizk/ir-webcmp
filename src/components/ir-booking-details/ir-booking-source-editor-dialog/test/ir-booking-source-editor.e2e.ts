import { newE2EPage } from '@stencil/core/testing';

describe('ir-booking-source-editor-dialog', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-booking-source-editor-dialog></ir-booking-source-editor-dialog>');

    const element = await page.find('ir-booking-source-editor-dialog');
    expect(element).toHaveClass('hydrated');
  });
});
