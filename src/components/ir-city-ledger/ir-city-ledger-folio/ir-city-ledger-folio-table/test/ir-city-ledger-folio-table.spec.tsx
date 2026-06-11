import { newSpecPage } from '@stencil/core/testing';
import { IrCityLedgerFolioTable } from '../ir-city-ledger-folio-table';

describe('ir-city-ledger-folio-table', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrCityLedgerFolioTable],
      html: `<ir-city-ledger-folio-table></ir-city-ledger-folio-table>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-city-ledger-folio-table>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-city-ledger-folio-table>
    `);
  });
});
