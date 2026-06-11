import { newSpecPage } from '@stencil/core/testing';
import { IrCityLedgerFiscalDocuments } from '../ir-city-ledger-fiscal-documents';
import { IrCityLedgerFiscalDocumentsFilters } from '../ir-city-ledger-fiscal-documents-filters/ir-city-ledger-fiscal-documents-filters';
import { IrCityLedgerFiscalDocumentsTable } from '../ir-city-ledger-fiscal-documents-table/ir-city-ledger-fiscal-documents-table';

describe('ir-city-ledger-fiscal-documents', () => {
  it('renders filters and table', async () => {
    const page = await newSpecPage({
      components: [IrCityLedgerFiscalDocuments, IrCityLedgerFiscalDocumentsFilters, IrCityLedgerFiscalDocumentsTable],
      html: `<ir-city-ledger-fiscal-documents></ir-city-ledger-fiscal-documents>`,
    });

    expect(page.root?.shadowRoot?.querySelector('ir-city-ledger-fiscal-documents-filters')).not.toBeNull();
    expect(page.root?.shadowRoot?.querySelector('ir-city-ledger-fiscal-documents-table')).not.toBeNull();
  });
});
