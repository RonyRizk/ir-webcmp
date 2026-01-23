import { newSpecPage } from '@stencil/core/testing';
import { IglBulkOperationsDrawer } from '../igl-bulk-operations-drawer';

describe('igl-bulk-operations-drawer', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IglBulkOperationsDrawer],
      html: `<igl-bulk-operations-drawer></igl-bulk-operations-drawer>`,
    });
    expect(page.root).toEqualHtml(`
      <igl-bulk-operations-drawer>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </igl-bulk-operations-drawer>
    `);
  });
});
