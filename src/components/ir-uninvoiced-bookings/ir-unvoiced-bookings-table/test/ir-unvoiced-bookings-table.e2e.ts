import { newE2EPage } from '@stencil/core/testing';

describe('ir-unvoiced-bookings-table', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<ir-unvoiced-bookings-table></ir-unvoiced-bookings-table>');

    const element = await page.find('ir-unvoiced-bookings-table');
    expect(element).toHaveClass('hydrated');
  });
});
