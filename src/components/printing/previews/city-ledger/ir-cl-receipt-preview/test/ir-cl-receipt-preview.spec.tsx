import { newSpecPage } from '@stencil/core/testing';
import { IrClReceiptPreview } from '../ir-cl-receipt-preview';

describe('ir-cl-receipt-preview', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrClReceiptPreview],
      html: `<ir-cl-receipt-preview></ir-cl-receipt-preview>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-cl-receipt-preview>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-cl-receipt-preview>
    `);
  });
});
