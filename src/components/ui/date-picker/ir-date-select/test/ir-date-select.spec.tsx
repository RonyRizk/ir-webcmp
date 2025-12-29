import { newSpecPage } from '@stencil/core/testing';
import { IrDateSelect } from '../ir-date-select';

describe('ir-date-select', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrDateSelect],
      html: `<ir-date-select></ir-date-select>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-date-select>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-date-select>
    `);
  });
});
