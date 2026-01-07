import { newE2EPage } from '@stencil/core/testing';

describe('igl-housekeeping-dialog', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<igl-housekeeping-dialog></igl-housekeeping-dialog>');

    const element = await page.find('igl-housekeeping-dialog');
    expect(element).toHaveClass('hydrated');
  });
});
