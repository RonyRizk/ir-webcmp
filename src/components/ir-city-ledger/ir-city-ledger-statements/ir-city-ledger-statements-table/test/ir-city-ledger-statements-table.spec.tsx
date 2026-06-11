import { newSpecPage } from '@stencil/core/testing';
import { IrCityLedgerStatementsTable } from '../ir-city-ledger-statements-table';

describe('ir-city-ledger-statements-table', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrCityLedgerStatementsTable],
      html: `<ir-city-ledger-statements-table></ir-city-ledger-statements-table>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-city-ledger-statements-table>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-city-ledger-statements-table>
    `);
  });
});
