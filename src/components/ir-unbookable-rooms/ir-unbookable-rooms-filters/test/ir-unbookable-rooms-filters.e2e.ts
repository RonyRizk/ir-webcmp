import { newE2EPage } from '@stencil/core/testing';

describe('ir-unbookable-rooms-filters', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-unbookable-rooms-filters></ir-unbookable-rooms-filters>');

    const element = await page.find('ir-unbookable-rooms-filters');
    expect(element).toHaveClass('hydrated');
  });
});
