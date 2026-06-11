import { newSpecPage } from '@stencil/core/testing';
import { IrCityLedgerFolio } from '../ir-city-ledger-folio';

describe('ir-city-ledger-folio', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrCityLedgerFolio],
      html: `<ir-city-ledger-folio></ir-city-ledger-folio>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-city-ledger-folio>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-city-ledger-folio>
    `);
  });
});
