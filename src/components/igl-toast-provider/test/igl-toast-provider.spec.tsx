import { newSpecPage } from '@stencil/core/testing';
import { IglToastProvider } from '../igl-toast-provider';

describe('igl-toast-provider', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IglToastProvider],
      html: `<igl-toast-provider></igl-toast-provider>`,
    });
    expect(page.root).toEqualHtml(`
      <igl-toast-provider>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </igl-toast-provider>
    `);
  });
});
