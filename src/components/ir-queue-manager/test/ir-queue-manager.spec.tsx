import { newSpecPage } from '@stencil/core/testing';
import { IrQueueManager } from '../ir-queue-manager';

describe('ir-queue-manager', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrQueueManager],
      html: `<ir-queue-manager></ir-queue-manager>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-queue-manager>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-queue-manager>
    `);
  });
});
