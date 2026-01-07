import { newSpecPage } from '@stencil/core/testing';
import { IrToastProvider } from '../ir-toast-provider';

describe('ir-toast-provider', () => {
  it('renders four toast viewports', async () => {
    const page = await newSpecPage({
      components: [IrToastProvider],
      html: `<ir-toast-provider></ir-toast-provider>`,
    });
    const viewports = page.root.shadowRoot.querySelectorAll('.toast-viewport');
    expect(viewports.length).toBe(4);
  });
});
