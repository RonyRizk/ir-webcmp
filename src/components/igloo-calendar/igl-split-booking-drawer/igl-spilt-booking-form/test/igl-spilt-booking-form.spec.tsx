import { newSpecPage } from '@stencil/core/testing';
import { IglSpiltBookingForm } from '../igl-spilt-booking-form';

describe('igl-spilt-booking-form', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IglSpiltBookingForm],
      html: `<igl-spilt-booking-form></igl-spilt-booking-form>`,
    });
    expect(page.root).toEqualHtml(`
      <igl-spilt-booking-form>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </igl-spilt-booking-form>
    `);
  });
});
