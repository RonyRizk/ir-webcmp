import { newSpecPage } from '@stencil/core/testing';
import { IrFilterCard } from '../ir-filter-card';

describe('ir-filter-card', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrFilterCard],
      html: `<ir-filter-card></ir-filter-card>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-filter-card>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-filter-card>
    `);
  });
});
