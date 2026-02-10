import { newSpecPage } from '@stencil/core/testing';
import { IrAgentsTable } from '../ir-agents-table';

describe('ir-agents-table', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrAgentsTable],
      html: `<ir-agents-table></ir-agents-table>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-agents-table>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-agents-table>
    `);
  });
});
