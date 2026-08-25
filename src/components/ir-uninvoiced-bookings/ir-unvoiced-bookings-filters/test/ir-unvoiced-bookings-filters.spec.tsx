import { newSpecPage } from '@stencil/core/testing';
import { IrUnvoicedBookingsFilters } from '../ir-unvoiced-bookings-filters';

describe('ir-unvoiced-bookings-filters', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrUnvoicedBookingsFilters],
      html: `<ir-unvoiced-bookings-filters></ir-unvoiced-bookings-filters>`,
    });
    expect(page.root.querySelector('.uninvoiced-bookings-filters')).not.toBeNull();
  });
});
