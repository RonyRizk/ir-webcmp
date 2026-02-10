import { newSpecPage } from '@stencil/core/testing';
import { IrAgentEditorForm } from '../ir-agent-editor-form';

describe('ir-agent-editor-form', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrAgentEditorForm],
      html: `<ir-agent-editor-form></ir-agent-editor-form>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-agent-editor-form>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-agent-editor-form>
    `);
  });
});
