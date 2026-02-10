import { newSpecPage } from '@stencil/core/testing';
import { IrAgentEditorDrawer } from '../ir-agent-editor-drawer';

describe('ir-agent-editor-drawer', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrAgentEditorDrawer],
      html: `<ir-agent-editor-drawer></ir-agent-editor-drawer>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-agent-editor-drawer>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-agent-editor-drawer>
    `);
  });
});
