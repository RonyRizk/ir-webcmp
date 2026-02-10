import { newSpecPage } from '@stencil/core/testing';
import { IrAgents } from '../ir-agents';

describe('ir-agents', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrAgents],
      html: `<ir-agents></ir-agents>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-agents>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-agents>
    `);
  });
});
