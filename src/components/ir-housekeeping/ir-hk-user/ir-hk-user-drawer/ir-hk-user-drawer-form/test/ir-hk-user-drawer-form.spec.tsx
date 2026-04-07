import { newSpecPage } from '@stencil/core/testing';
import { IrHkUserDrawerForm } from '../ir-hk-user-drawer-form';

describe('ir-hk-user-drawer-form', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrHkUserDrawerForm],
      html: `<ir-hk-user-drawer-form></ir-hk-user-drawer-form>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-hk-user-drawer-form>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-hk-user-drawer-form>
    `);
  });
});
