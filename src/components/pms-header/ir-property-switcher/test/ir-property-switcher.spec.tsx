import { newSpecPage } from '@stencil/core/testing';
import { IrPropertySwitcher } from '../ir-property-switcher';

describe('ir-property-switcher', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrPropertySwitcher],
      html: `<ir-property-switcher></ir-property-switcher>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-property-switcher>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-property-switcher>
    `);
  });
});
