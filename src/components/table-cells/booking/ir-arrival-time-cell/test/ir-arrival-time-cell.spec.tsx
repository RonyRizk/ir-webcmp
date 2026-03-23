import { newSpecPage } from '@stencil/core/testing';
import { IrArrivalTimeCell } from '../ir-arrival-time-cell';

describe('ir-arrival-time-cell', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrArrivalTimeCell],
      html: `<ir-arrival-time-cell></ir-arrival-time-cell>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-arrival-time-cell>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-arrival-time-cell>
    `);
  });
});
