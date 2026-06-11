import { newSpecPage } from '@stencil/core/testing';
import { IrAgentAssignmentDialog } from '../ir-agent-assignment-dialog';

describe('ir-agent-assignment-dialog', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrAgentAssignmentDialog],
      html: `<ir-agent-assignment-dialog></ir-agent-assignment-dialog>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-agent-assignment-dialog>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-agent-assignment-dialog>
    `);
  });
});
