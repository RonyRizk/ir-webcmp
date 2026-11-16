import { newSpecPage } from '@stencil/core/testing';
import { IglSplitBookingForm } from '../igl-split-booking-form';

describe('igl-split-booking-form', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IglSplitBookingForm],
      html: `<igl-split-booking-form></igl-split-booking-form>`,
    });
    expect(page.root).toEqualHtml(`
      <igl-split-booking-form>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </igl-split-booking-form>
    `);
  });
});
