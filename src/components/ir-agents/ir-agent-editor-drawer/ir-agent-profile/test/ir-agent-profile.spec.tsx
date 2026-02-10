import { newSpecPage } from '@stencil/core/testing';
import { IrAgentProfile } from '../ir-agent-profile';

describe('ir-agent-profile', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrAgentProfile],
      html: `<ir-agent-profile></ir-agent-profile>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-agent-profile>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-agent-profile>
    `);
  });
});
