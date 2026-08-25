import { newSpecPage } from '@stencil/core/testing';
import { IrFileUpload } from '../ir-file-upload';

describe('ir-file-upload', () => {
  it('renders the dropzone with label and hint', async () => {
    const page = await newSpecPage({
      components: [IrFileUpload],
      html: `<ir-file-upload label="Documents" hint="PDF only"></ir-file-upload>`,
    });
    const shadowRoot = page.root.shadowRoot;
    expect(shadowRoot.querySelector('[part="dropzone"]')).not.toBeNull();
    expect(shadowRoot.querySelector('[part~="label"]').textContent).toContain('Documents');
    expect(shadowRoot.querySelector('[part="hint"]').textContent).toContain('PDF only');
    expect(shadowRoot.querySelector('[part="file-list"]')).toBeNull();
  });

  it('lists selected files and emits filesChange', async () => {
    const page = await newSpecPage({
      components: [IrFileUpload],
      html: `<ir-file-upload multiple></ir-file-upload>`,
    });
    const filesChange = jest.fn();
    page.root.addEventListener('filesChange', filesChange);

    // The jest environment has no File constructor; a structural stand-in is enough for the component.
    const file = { name: 'hello.txt', size: 5, type: 'text/plain', lastModified: 1 } as File;
    (page.rootInstance as IrFileUpload)['addFiles']([file]);
    await page.waitForChanges();

    expect(filesChange).toHaveBeenCalledTimes(1);
    expect(page.root.shadowRoot.querySelectorAll('[part="file"]').length).toBe(1);
    expect(page.root.shadowRoot.querySelector('[part="file-name"]').textContent).toBe('hello.txt');
  });
});
