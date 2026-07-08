import { newSpecPage } from '@stencil/core/testing';
import { IrPaymentAnalytics } from '../ir-payment-analytics';

describe('ir-payment-analytics', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrPaymentAnalytics],
      html: `<ir-payment-analytics></ir-payment-analytics>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-payment-analytics>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-payment-analytics>
    `);
  });
});
