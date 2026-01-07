import { newSpecPage } from '@stencil/core/testing';
import { IrBookingNewForm } from '../ir-booking-new-form';

describe('ir-booking-new-form', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrBookingNewForm],
      html: `<ir-booking-new-form></ir-booking-new-form>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-booking-new-form>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-booking-new-form>
    `);
  });
});
