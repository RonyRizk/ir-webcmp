import { newSpecPage } from '@stencil/core/testing';
import { IrPmsPage } from '../ir-pms-page';

describe('ir-pms-page', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrPmsPage],
      html: `<ir-pms-page></ir-pms-page>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-pms-page>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-pms-page>
    `);
  });
});
