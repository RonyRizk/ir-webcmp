import { newSpecPage } from '@stencil/core/testing';
import { IrFiscalDocumentsTable } from '../ir-fiscal-documents-table';

describe('ir-fiscal-documents-table', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrFiscalDocumentsTable],
      html: `<ir-fiscal-documents-table></ir-fiscal-documents-table>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-fiscal-documents-table>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-fiscal-documents-table>
    `);
  });
});
