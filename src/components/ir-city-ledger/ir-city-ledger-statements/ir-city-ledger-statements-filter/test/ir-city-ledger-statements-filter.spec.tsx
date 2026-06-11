import { newSpecPage } from '@stencil/core/testing';
import { IrCityLedgerStatementsFilter } from '../ir-city-ledger-statements-filter';

describe('ir-city-ledger-statements-filter', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrCityLedgerStatementsFilter],
      html: `<ir-city-ledger-statements-filter></ir-city-ledger-statements-filter>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-city-ledger-statements-filter>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-city-ledger-statements-filter>
    `);
  });
});
