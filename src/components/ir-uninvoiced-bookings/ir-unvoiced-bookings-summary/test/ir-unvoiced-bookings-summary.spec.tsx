import { newSpecPage } from '@stencil/core/testing';
import { IrUnvoicedBookingsSummary } from '../ir-unvoiced-bookings-summary';

describe('ir-unvoiced-bookings-summary', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrUnvoicedBookingsSummary],
      html: `<ir-unvoiced-bookings-summary></ir-unvoiced-bookings-summary>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-unvoiced-bookings-summary>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-unvoiced-bookings-summary>
    `);
  });
});
