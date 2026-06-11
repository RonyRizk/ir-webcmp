import { newSpecPage } from '@stencil/core/testing';
import { IglRateExtenderDrawer } from '../igl-rate-extender-drawer';

describe('igl-rate-extender-drawer', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IglRateExtenderDrawer],
      html: `<igl-rate-extender-drawer></igl-rate-extender-drawer>`,
    });
    expect(page.root).toEqualHtml(`
      <igl-rate-extender-drawer>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </igl-rate-extender-drawer>
    `);
  });
});
