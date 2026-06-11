import { newSpecPage } from '@stencil/core/testing';
import { IrAgentAssignmentForm } from '../ir-agent-assignment-form';

describe('ir-agent-assignment-form', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrAgentAssignmentForm],
      html: `<ir-agent-assignment-form></ir-agent-assignment-form>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-agent-assignment-form>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-agent-assignment-form>
    `);
  });
});
