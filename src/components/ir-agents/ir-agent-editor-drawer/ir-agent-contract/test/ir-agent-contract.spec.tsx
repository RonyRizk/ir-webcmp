import { newSpecPage } from '@stencil/core/testing';
import { IrAgentContract } from '../ir-agent-contract';

describe('ir-agent-contract', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrAgentContract],
      html: `<ir-agent-contract></ir-agent-contract>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-agent-contract>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-agent-contract>
    `);
  });
});
