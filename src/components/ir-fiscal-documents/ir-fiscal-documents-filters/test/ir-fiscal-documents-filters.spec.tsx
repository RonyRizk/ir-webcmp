import { newSpecPage } from '@stencil/core/testing';
import { IrFiscalDocumentsFilters } from '../ir-fiscal-documents-filters';

describe('ir-fiscal-documents-filters', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrFiscalDocumentsFilters],
      html: `<ir-fiscal-documents-filters></ir-fiscal-documents-filters>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-fiscal-documents-filters>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-fiscal-documents-filters>
    `);
  });
});
