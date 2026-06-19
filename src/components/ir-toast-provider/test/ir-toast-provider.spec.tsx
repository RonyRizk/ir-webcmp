import { newSpecPage } from '@stencil/core/testing';
import { IrToastProvider } from '../ir-toast-provider';

describe('ir-toast-provider', () => {
  it('appends toast items to the document body', async () => {
    const page = await newSpecPage({
      components: [IrToastProvider],
      html: `<ir-toast-provider></ir-toast-provider>`,
    });

    await page.rootInstance.addToast({ title: 'Saved', description: 'Booking updated', type: 'success' });
    await page.waitForChanges();

    const layer = page.doc.body.querySelector('[data-ir-toast-layer]');
    expect(layer).not.toBeNull();
    expect(layer.getAttribute('popover')).toBe('manual');
    const item = layer.querySelector('ir-toast-item');
    expect(item).not.toBeNull();
    expect(item.textContent).toContain('Saved');
  });
});
