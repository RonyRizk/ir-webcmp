import { newSpecPage } from '@stencil/core/testing';
import { IrCommon } from '../ir-common';

describe('ir-common Arabic font', () => {
  it('renders Arabic text in the Cairo font', async () => {
    const page = await newSpecPage({
      components: [IrCommon],
      html: `<ir-common disable-resource-injection></ir-common>`,
    });
    const head = page.doc.head;

    const fontLinks = Array.from(head.querySelectorAll('link[rel="stylesheet"]')).map(link => link.getAttribute('href'));
    expect(fontLinks).toContain('https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap');

    const arabicRule = head.querySelector('#ir-arabic-font').textContent;
    expect(arabicRule).toContain(':lang(ar)');
    expect(arabicRule).toContain('font-family: "Cairo", sans-serif');
  });
});
