import { newSpecPage } from '@stencil/core/testing';
import { IrTranslationEditor } from '../ir-translation-editor';

const LANGUAGES = [{ code: 'en' }, { code: 'fr', label: 'French' }, { code: 'ar', label: 'Arabic' }];

async function render(value: Record<string, string>, language = 'fr') {
  const page = await newSpecPage({ components: [IrTranslationEditor], html: `<ir-translation-editor></ir-translation-editor>` });
  page.root.languages = LANGUAGES;
  page.root.value = value;
  page.root.language = language;
  await page.waitForChanges();
  return page;
}

const attrOrProp = (el: Element, name: string) => el.getAttribute(name) ?? (el as any)[name];

describe('ir-translation-editor', () => {
  it('offers every language except the default one', async () => {
    const page = await render({ en: 'Sea view room' });
    const options = Array.from(page.root.shadowRoot.querySelectorAll('wa-option')).map(option => attrOrProp(option, 'value'));
    expect(options).toEqual(['fr', 'ar']);
  });

  it('shows the default-language text as the reference and the selected language as the target', async () => {
    const page = await render({ en: 'Sea view room', fr: 'Chambre vue mer' });
    const shadow = page.root.shadowRoot;
    expect(shadow.querySelector('.reference').textContent).toBe('Sea view room');
    expect(shadow.querySelector('#target-heading').textContent).toBe('French');
    expect(attrOrProp(shadow.querySelector('wa-textarea'), 'value')).toBe('Chambre vue mer');
  });

  it('shows a placeholder message when the reference is blank', async () => {
    const page = await render({ en: '   ' });
    const reference = page.root.shadowRoot.querySelector('.reference');
    expect(reference.classList.contains('reference--empty')).toBe(true);
    expect(reference.textContent).toBe('No text in the default language yet.');
  });

  it('sets lang and dir attributes on the translation textarea', async () => {
    const page = await render({ en: 'Hi' }, 'ar');
    const textarea = page.root.shadowRoot.querySelector('wa-textarea');
    expect(textarea.getAttribute('lang')).toBe('ar');
    expect(textarea.getAttribute('dir')).toBe('rtl');
  });

  it('reports keystrokes for the selected language', async () => {
    const page = await render({ en: 'Hi' });
    const onInput = jest.fn();
    page.root.addEventListener('translationInput', (event: CustomEvent) => onInput(event.detail));
    const textarea = page.root.shadowRoot.querySelector('wa-textarea') as HTMLElement & { value: string };
    textarea.value = 'Bonjour';
    // Use the mock window's Event: under `stencil test --spec`, globalThis and window are different objects.
    textarea.dispatchEvent(new (page.win as any).Event('input'));
    expect(onInput).toHaveBeenCalledWith({ language: 'fr', text: 'Bonjour' });
  });
});
