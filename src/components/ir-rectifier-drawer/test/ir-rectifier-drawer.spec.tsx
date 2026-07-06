import { newSpecPage } from '@stencil/core/testing';
import { IrRectifierDrawer } from '../ir-rectifier-drawer';

describe('ir-rectifier-drawer', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrRectifierDrawer],
      html: `<ir-rectifier-drawer></ir-rectifier-drawer>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-rectifier-drawer>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-rectifier-drawer>
    `);
  });
});
