import { newSpecPage } from '@stencil/core/testing';
import { IrPage } from '../ir-page';

describe('ir-page', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrPage],
      html: `<ir-page></ir-page>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-page>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-page>
    `);
  });
});
