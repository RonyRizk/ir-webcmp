import { newSpecPage } from '@stencil/core/testing';
import { IrCityLedgerStatements } from '../ir-city-ledger-steatments';

describe('ir-city-ledger-statements', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrCityLedgerStatements],
      html: `<ir-city-ledger-statements></ir-city-ledger-statements>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-city-ledger-statements>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-city-ledger-statements>
    `);
  });
});
