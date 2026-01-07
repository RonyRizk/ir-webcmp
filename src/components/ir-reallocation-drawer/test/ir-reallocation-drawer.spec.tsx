import { newSpecPage } from '@stencil/core/testing';
import { IrReallocationDrawer } from '../ir-reallocation-drawer';

describe('ir-reallocation-drawer', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrReallocationDrawer],
      html: `<ir-reallocation-drawer></ir-reallocation-drawer>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-reallocation-drawer>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-reallocation-drawer>
    `);
  });
});
