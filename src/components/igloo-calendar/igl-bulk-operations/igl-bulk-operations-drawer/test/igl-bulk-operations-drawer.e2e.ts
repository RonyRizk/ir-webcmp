import { newE2EPage } from '@stencil/core/testing';

describe('igl-bulk-operations-drawer', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<igl-bulk-operations-drawer></igl-bulk-operations-drawer>');

    const element = await page.find('igl-bulk-operations-drawer');
    expect(element).toHaveClass('hydrated');
  });
});
