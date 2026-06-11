import { newSpecPage } from '@stencil/core/testing';
import { IrBookingSourceEditorDialog } from '../ir-booking-source-editor-dialog';

describe('ir-booking-source-editor-dialog', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrBookingSourceEditorDialog],
      html: `<ir-booking-source-editor-dialog></ir-booking-source-editor-dialog>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-booking-source-editor-dialog>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-booking-source-editor-dialog>
    `);
  });
});
