import { newSpecPage } from '@stencil/core/testing';
import { IrToastItem } from '../ir-toast-item';

describe('ir-toast-item', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrToastItem],
      html: `<ir-toast-item></ir-toast-item>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-toast-item>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-toast-item>
    `);
  });
});
