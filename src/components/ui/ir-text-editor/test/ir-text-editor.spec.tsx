import { newSpecPage } from '@stencil/core/testing';
import { IrTextEditor } from '../ir-text-editor';

describe('ir-text-editor', () => {
  it('renders the editor field', async () => {
    const page = await newSpecPage({
      components: [IrTextEditor],
      html: `<ir-text-editor label="Description" hint="Max 450 characters"></ir-text-editor>`,
    });
    const shadowRoot = page.root.shadowRoot;
    expect(shadowRoot.querySelector('.editor-wrapper')).not.toBeNull();
    expect(shadowRoot.querySelector('.field__label').textContent).toContain('Description');
    expect(shadowRoot.querySelector('.field__hint').textContent).toContain('Max 450 characters');
  });
});
