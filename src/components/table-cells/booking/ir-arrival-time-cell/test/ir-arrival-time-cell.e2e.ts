import { newE2EPage } from '@stencil/core/testing';

describe('ir-arrival-time-cell', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-arrival-time-cell></ir-arrival-time-cell>');

    const element = await page.find('ir-arrival-time-cell');
    expect(element).toHaveClass('hydrated');
  });
});
