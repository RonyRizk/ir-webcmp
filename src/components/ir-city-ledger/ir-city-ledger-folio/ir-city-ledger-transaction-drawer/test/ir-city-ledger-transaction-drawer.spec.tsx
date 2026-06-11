import { newSpecPage } from '@stencil/core/testing';
import { IrCityLedgerTransactionDrawer } from '../ir-city-ledger-transaction-drawer';

describe('ir-city-ledger-transaction-drawer', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrCityLedgerTransactionDrawer],
      html: `<ir-city-ledger-transaction-drawer></ir-city-ledger-transaction-drawer>`,
    });
    expect(page.root).toHaveClass('hydrated');
  });
});
