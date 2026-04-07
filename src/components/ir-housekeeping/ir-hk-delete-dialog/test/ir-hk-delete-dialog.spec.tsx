import { newSpecPage } from '@stencil/core/testing';
import { IrHkDeleteDialog } from '../ir-hk-delete-dialog';

describe('ir-hk-delete-dialog', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrHkDeleteDialog],
      html: `<ir-hk-delete-dialog></ir-hk-delete-dialog>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-hk-delete-dialog>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-hk-delete-dialog>
    `);
  });
});
