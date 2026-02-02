import { newE2EPage } from '@stencil/core/testing';

describe('ir-arrival-time-dialog', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-arrival-time-dialog></ir-arrival-time-dialog>');

    const element = await page.find('ir-arrival-time-dialog');
    expect(element).toHaveClass('hydrated');
  });
});
