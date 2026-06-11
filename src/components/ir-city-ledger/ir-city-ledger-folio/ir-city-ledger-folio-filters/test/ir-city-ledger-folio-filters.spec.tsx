import { newSpecPage } from '@stencil/core/testing';
import { IrCityLedgerFolioFilters } from '../ir-city-ledger-folio-filters';

describe('ir-city-ledger-folio-filters', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrCityLedgerFolioFilters],
      html: `<ir-city-ledger-folio-filters></ir-city-ledger-folio-filters>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-city-ledger-folio-filters>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-city-ledger-folio-filters>
    `);
  });
});
