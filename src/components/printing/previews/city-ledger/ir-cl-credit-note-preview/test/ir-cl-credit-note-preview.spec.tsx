import { newSpecPage } from '@stencil/core/testing';
import { IrClCreditNotePreview } from '../ir-cl-credit-note-preview';

describe('ir-cl-credit-note-preview', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrClCreditNotePreview],
      html: `<ir-cl-credit-note-preview></ir-cl-credit-note-preview>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-cl-credit-note-preview>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-cl-credit-note-preview>
    `);
  });
});
