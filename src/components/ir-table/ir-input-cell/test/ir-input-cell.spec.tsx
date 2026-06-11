import { newSpecPage } from '@stencil/core/testing';
import { IrInputCell } from '../ir-input-cell';

describe('ir-input-cell', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrInputCell],
      html: `<ir-input-cell></ir-input-cell>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-input-cell>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-input-cell>
    `);
  });
});
