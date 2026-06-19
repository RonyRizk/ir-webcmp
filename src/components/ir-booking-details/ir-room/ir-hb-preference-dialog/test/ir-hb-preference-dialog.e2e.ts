import { newE2EPage } from '@stencil/core/testing';

describe('ir-hb-preference-dialog', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-hb-preference-dialog></ir-hb-preference-dialog>');

    const element = await page.find('ir-hb-preference-dialog');
    expect(element).toHaveClass('hydrated');
  });
});
