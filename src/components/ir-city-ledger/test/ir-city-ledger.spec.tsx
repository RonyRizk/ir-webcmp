import { newSpecPage } from '@stencil/core/testing';
import { IrCityLedger } from '../ir-city-ledger';

describe('ir-city-ledger', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrCityLedger],
      html: `<ir-city-ledger></ir-city-ledger>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-city-ledger>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-city-ledger>
    `);
  });
});
