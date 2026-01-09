import { newSpecPage } from '@stencil/core/testing';
import { IrPmsSearch } from '../ir-pms-search';

describe('ir-pms-search', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrPmsSearch],
      html: `<ir-pms-search></ir-pms-search>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-pms-search>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-pms-search>
    `);
  });
});
