import { newSpecPage } from '@stencil/core/testing';
import { IrUnvoicedBookingsTable } from '../ir-unvoiced-bookings-table';

describe('ir-unvoiced-bookings-table', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrUnvoicedBookingsTable],
      html: `<ir-unvoiced-bookings-table></ir-unvoiced-bookings-table>`,
    });
    expect(page.root.querySelector('.uninvoiced-bookings-table')).not.toBeNull();
  });
});
