import { newSpecPage } from '@stencil/core/testing';
import { IrHkUnassignedUnitsDrawer } from '../ir-hk-unassigned-units-drawer';

describe('ir-hk-unassigned-units-drawer', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrHkUnassignedUnitsDrawer],
      html: `<ir-hk-unassigned-units-drawer></ir-hk-unassigned-units-drawer>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-hk-unassigned-units-drawer>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-hk-unassigned-units-drawer>
    `);
  });
});
