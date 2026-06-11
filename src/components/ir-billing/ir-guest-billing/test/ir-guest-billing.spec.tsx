import { newSpecPage } from '@stencil/core/testing';
import { IrGuestBilling } from '../ir-guest-billing';

describe('ir-guest-billing', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrGuestBilling],
      html: `<ir-guest-billing></ir-guest-billing>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-guest-billing>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-guest-billing>
    `);
  });
});
