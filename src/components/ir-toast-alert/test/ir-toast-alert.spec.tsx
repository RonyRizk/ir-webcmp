import { newSpecPage } from '@stencil/core/testing';
import { IrToastAlert } from '../ir-toast-alert';

describe('ir-toast-alert', () => {
  it('renders title and description', async () => {
    const page = await newSpecPage({
      components: [IrToastAlert],
      html: `<ir-toast-alert toast-id="toast-1" title="Saved" description="All changes applied."></ir-toast-alert>`,
    });
    const title = page.root.shadowRoot.querySelector('.toast__title');
    const description = page.root.shadowRoot.querySelector('.toast__description');

    expect(title.textContent).toBe('Saved');
    expect(description.textContent).toBe('All changes applied.');
  });
});
