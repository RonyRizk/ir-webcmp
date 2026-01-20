import { newE2EPage } from '@stencil/core/testing';

describe('ir-unbookable-rooms', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-unbookable-rooms></ir-unbookable-rooms>');

    const element = await page.find('ir-unbookable-rooms');
    expect(element).toHaveClass('hydrated');
  });
});
