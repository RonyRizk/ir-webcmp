import { newSpecPage } from '@stencil/core/testing';
import { IrBookingRooms } from '../ir-booking-rooms';

describe('ir-booking-rooms', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrBookingRooms],
      html: `<ir-booking-rooms></ir-booking-rooms>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-booking-rooms>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-booking-rooms>
    `);
  });
});
