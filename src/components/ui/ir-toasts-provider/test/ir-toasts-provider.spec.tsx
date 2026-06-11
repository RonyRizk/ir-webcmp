import { newSpecPage } from '@stencil/core/testing';
import { IrToastsProvider } from '../ir-toasts-provider';

describe('ir-toasts-provider', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrToastsProvider],
      html: `<ir-toasts-provider></ir-toasts-provider>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-toasts-provider>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-toasts-provider>
    `);
  });
});
