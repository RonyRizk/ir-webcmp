import { newSpecPage } from '@stencil/core/testing';
import { IrRectifier } from '../ir-rectifier';

describe('ir-rectifier', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrRectifier],
      html: `<ir-rectifier></ir-rectifier>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-rectifier>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-rectifier>
    `);
  });
});
