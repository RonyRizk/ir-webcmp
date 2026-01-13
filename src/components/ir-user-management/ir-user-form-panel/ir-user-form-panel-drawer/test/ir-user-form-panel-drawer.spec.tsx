import { newSpecPage } from '@stencil/core/testing';
import { IrUserFormPanelDrawer } from '../ir-user-form-panel-drawer';

describe('ir-user-form-panel-drawer', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrUserFormPanelDrawer],
      html: `<ir-user-form-panel-drawer></ir-user-form-panel-drawer>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-user-form-panel-drawer>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-user-form-panel-drawer>
    `);
  });
});
