import { newSpecPage } from '@stencil/core/testing';
import { IglSplitBookingDrawer } from '../igl-split-booking-drawer';

describe('igl-split-booking-drawer', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IglSplitBookingDrawer],
      html: `<igl-split-booking-drawer></igl-split-booking-drawer>`,
    });
    expect(page.root).toEqualHtml(`
      <igl-split-booking-drawer>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </igl-split-booking-drawer>
    `);
  });
});
