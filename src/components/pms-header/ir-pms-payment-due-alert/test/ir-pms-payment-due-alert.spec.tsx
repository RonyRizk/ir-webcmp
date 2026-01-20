import { newSpecPage } from '@stencil/core/testing';
import { IrPmsPaymentDueAlert } from '../ir-pms-payment-due-alert';

describe('ir-pms-payment-due-alert', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrPmsPaymentDueAlert],
      html: `<ir-pms-payment-due-alert></ir-pms-payment-due-alert>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-pms-payment-due-alert>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-pms-payment-due-alert>
    `);
  });
});
