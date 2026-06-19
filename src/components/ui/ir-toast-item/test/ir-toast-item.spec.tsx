import { newSpecPage } from '@stencil/core/testing';
import { IrToastItem } from '../ir-toast-item';

describe('ir-toast-item', () => {
  it('renders slotted content and a close button', async () => {
    const page = await newSpecPage({
      components: [IrToastItem],
      html: `<ir-toast-item duration="0">Saved successfully</ir-toast-item>`,
    });

    expect(page.root.shadowRoot.querySelector('.toast-item')).not.toBeNull();
    const closeButton = page.root.shadowRoot.querySelector('.close-button');
    expect(closeButton).not.toBeNull();
    expect(closeButton.getAttribute('aria-label')).toBe('Close notification');
  });

  it('hides the close button when not dismissible', async () => {
    const page = await newSpecPage({
      components: [IrToastItem],
      html: `<ir-toast-item duration="0" dismissible="false">Persistent</ir-toast-item>`,
    });

    expect(page.root.shadowRoot.querySelector('.close-button')).toBeNull();
  });
});
