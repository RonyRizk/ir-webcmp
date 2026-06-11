import { newSpecPage } from '@stencil/core/testing';
import { IrFiscalDocuments } from '../ir-fiscal-documents';

describe('ir-fiscal-documents', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrFiscalDocuments],
      html: `<ir-fiscal-documents></ir-fiscal-documents>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-fiscal-documents>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-fiscal-documents>
    `);
  });
});
