import { newSpecPage } from '@stencil/core/testing';
import { IrQueueChart } from '../ir-queue-chart';

describe('ir-queue-chart', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrQueueChart],
      html: `<ir-queue-chart></ir-queue-chart>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-queue-chart>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-queue-chart>
    `);
  });
});
