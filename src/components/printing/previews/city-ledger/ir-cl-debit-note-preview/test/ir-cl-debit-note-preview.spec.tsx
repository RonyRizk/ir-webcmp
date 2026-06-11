import { newSpecPage } from '@stencil/core/testing';
import { IrClDebitNotePreview } from '../ir-cl-debit-note-preview';

describe('ir-cl-debit-note-preview', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [IrClDebitNotePreview],
      html: `<ir-cl-debit-note-preview></ir-cl-debit-note-preview>`,
    });
    expect(page.root).toEqualHtml(`
      <ir-cl-debit-note-preview>
        <mock:shadow-root>
          <slot></slot>
        </mock:shadow-root>
      </ir-cl-debit-note-preview>
    `);
  });
});
