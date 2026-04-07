import { newSpecPage } from '@stencil/core/testing';
import { IrHkUnassignedUnitsDrawerForm } from '../ir-hk-unassigned-units-drawer-form';

describe('ir-hk-unassigned-units-drawer-form', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrHkUnassignedUnitsDrawerForm],
      html: `<ir-hk-unassigned-units-drawer-form></ir-hk-unassigned-units-drawer-form>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-hk-unassigned-units-drawer-form>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-hk-unassigned-units-drawer-form>
    `);
  });
});
