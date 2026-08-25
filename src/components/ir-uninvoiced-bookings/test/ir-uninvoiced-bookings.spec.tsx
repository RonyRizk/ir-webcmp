import { newSpecPage } from '@stencil/core/testing';
import { IrUninvoicedBookings } from '../ir-uninvoiced-bookings';

describe('ir-uninvoiced-bookings', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrUninvoicedBookings],
      html: `<ir-uninvoiced-bookings></ir-uninvoiced-bookings>`,
    });
    expect(page.root.tagName).toBe('IR-UNINVOICED-BOOKINGS');
  });
});
