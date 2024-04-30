import { newSpecPage } from '@stencil/core/testing';
import { IrDropdown } from '../ir-dropdown';

describe('ir-dropdown', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrDropdown],
      html: `<ir-dropdown></ir-dropdown>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-dropdown>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-dropdown>
    `);
  });
});
