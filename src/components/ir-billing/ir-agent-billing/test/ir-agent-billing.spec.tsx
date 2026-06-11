import { newSpecPage } from '@stencil/core/testing';
import { IrAgentBilling } from '../ir-agent-billing';

describe('ir-agent-billing', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrAgentBilling],
      html: `<ir-agent-billing></ir-agent-billing>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-agent-billing>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-agent-billing>
    `);
  });
});
