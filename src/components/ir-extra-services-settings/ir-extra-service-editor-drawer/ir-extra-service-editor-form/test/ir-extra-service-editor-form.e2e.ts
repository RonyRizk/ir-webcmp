import { newE2EPage } from '@stencil/core/testing';

describe('ir-extra-service-editor-form', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-extra-service-editor-form></ir-extra-service-editor-form>');

    const element = await page.find('ir-extra-service-editor-form');
    expect(element).toHaveClass('hydrated');
  });
});
