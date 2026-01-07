import { newSpecPage } from '@stencil/core/testing';
import { IglHousekeepingDialog } from '../igl-housekeeping-dialog';

describe('igl-housekeeping-dialog', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IglHousekeepingDialog],
      html: `<igl-housekeeping-dialog></igl-housekeeping-dialog>`,
    });
    expect(page.root).toEqualHtml(`
      <igl-housekeeping-dialog>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </igl-housekeeping-dialog>
    `);
  });
});
