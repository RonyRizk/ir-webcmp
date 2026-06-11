import { newSpecPage } from '@stencil/core/testing';
import { IrClStatementPreview } from '../ir-cl-statement-preview';

describe('ir-cl-statement-preview', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrClStatementPreview],
      html: `<ir-cl-statement-preview></ir-cl-statement-preview>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-cl-statement-preview>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-cl-statement-preview>
    `);
  });
});
