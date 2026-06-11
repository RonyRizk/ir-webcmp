import { newSpecPage } from '@stencil/core/testing';
import { IrClInvoicePreview } from '../ir-cl-invoice-preview';

describe('ir-cl-invoice-preview', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrClInvoicePreview],
      html: `<ir-cl-invoice-preview></ir-cl-invoice-preview>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-cl-invoice-preview>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-cl-invoice-preview>
    `);
  });
});
