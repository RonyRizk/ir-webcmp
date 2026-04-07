import { newSpecPage } from '@stencil/core/testing';
import { IrHkUserDrawer } from '../ir-hk-user-drawer';

describe('ir-hk-user-drawer', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrHkUserDrawer],
      html: `<ir-hk-user-drawer></ir-hk-user-drawer>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-hk-user-drawer>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-hk-user-drawer>
    `);
  });
});
