import { newSpecPage } from '@stencil/core/testing';
import { IrUnbookableRoomsData } from '../ir-unbookable-rooms-data';

describe('ir-unbookable-rooms-data', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrUnbookableRoomsData],
      html: `<ir-unbookable-rooms-data></ir-unbookable-rooms-data>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-unbookable-rooms-data>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-unbookable-rooms-data>
    `);
  });
});
