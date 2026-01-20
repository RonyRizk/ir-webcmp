import { newSpecPage } from '@stencil/core/testing';
import { IrUnbookableRoomsFilters } from '../ir-unbookable-rooms-filters';

describe('ir-unbookable-rooms-filters', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrUnbookableRoomsFilters],
      html: `<ir-unbookable-rooms-filters></ir-unbookable-rooms-filters>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-unbookable-rooms-filters>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-unbookable-rooms-filters>
    `);
  });
});
