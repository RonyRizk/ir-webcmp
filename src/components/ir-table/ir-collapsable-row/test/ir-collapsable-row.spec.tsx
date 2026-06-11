import { newSpecPage } from '@stencil/core/testing';
import { IrCollapsableRow } from '../ir-collapsable-row';

describe('ir-collapsable-row', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrCollapsableRow],
      html: `<ir-collapsable-row></ir-collapsable-row>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-collapsable-row>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-collapsable-row>
    `);
  });
});
