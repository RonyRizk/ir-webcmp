import { newSpecPage } from '@stencil/core/testing';
import { IrTaxServiceCategories } from '../ir-tax-service-categories';

describe('ir-tax-service-categories', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrTaxServiceCategories],
      html: `<ir-tax-service-categories></ir-tax-service-categories>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-tax-service-categories>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-tax-service-categories>
    `);
  });
});
