import { newSpecPage } from '@stencil/core/testing';
import { IrCityLedgerTransactionForm } from '../ir-city-ledger-transaction-form';

describe('ir-city-ledger-transaction-form', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrCityLedgerTransactionForm],
      html: `<ir-city-ledger-transaction-form></ir-city-ledger-transaction-form>`,
    });
    expect(page.root).toHaveClass('hydrated');
  });
});
