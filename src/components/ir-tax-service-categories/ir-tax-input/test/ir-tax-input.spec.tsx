import { newSpecPage } from '@stencil/core/testing';
import { IrTaxInput } from '../ir-tax-input';

describe('ir-tax-input', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrTaxInput],
      html: `<ir-tax-input></ir-tax-input>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-tax-input>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-tax-input>
    `);
  });
});
