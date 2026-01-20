import { newE2EPage } from '@stencil/core/testing';

describe('ir-unbookable-rooms-data', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-unbookable-rooms-data></ir-unbookable-rooms-data>');

    const element = await page.find('ir-unbookable-rooms-data');
    expect(element).toHaveClass('hydrated');
  });
});
