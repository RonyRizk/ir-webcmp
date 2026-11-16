import { newSpecPage, SpecPage } from '@stencil/core/testing';
import { IrTranslatableTextarea } from '../ir-translatable-textarea';
import { IrTranslationEditor } from '../ir-translation-editor/ir-translation-editor';
import type { TranslatableLanguage, TranslatableValueChangeDetail, TranslationMap } from '../types';

/**
 * mock-doc's `attachInternals()` returns an empty Proxy, so form value and validity can't be observed. This fake
 * implements the subset the component uses and, like a browser, fires `invalid` on the host when a check fails.
 */
class FakeInternals {
  formValue: string | null | undefined;
  valid = true;
  valueMissing = false;
  validationMessage = '';
  anchor?: Element;
  states = new Set<string>();

  constructor(private host: HTMLElement) {}

  setFormValue(value: string | null) {
    this.formValue = value;
  }

  setValidity(flags: { valueMissing?: boolean } = {}, message = '', anchor?: Element) {
    this.valueMissing = !!flags.valueMissing;
    this.valid = !this.valueMissing;
    this.validationMessage = this.valid ? '' : message;
    this.anchor = anchor;
  }

  checkValidity() {
    if (!this.valid) {
      const win = this.host.ownerDocument.defaultView as any;
      this.host.dispatchEvent(new win.Event('invalid'));
    }
    return this.valid;
  }
}

const LANGUAGES: TranslatableLanguage[] = [{ code: 'en' }, { code: 'fr', label: 'French' }, { code: 'es', label: 'Spanish' }, { code: 'ar', label: 'Arabic' }];

interface SetupOptions {
  attrs?: string;
  value?: TranslationMap;
  languages?: TranslatableLanguage[];
  wrapper?: (html: string) => string;
}

interface Setup {
  page: SpecPage;
  root: HTMLIrTranslatableTextareaElement;
  instance: IrTranslatableTextarea;
  internals: FakeInternals;
  shadow: ShadowRoot;
  changes: TranslatableValueChangeDetail[];
}

async function setup({
  attrs = 'label="Description" name="description"',
  value = { en: 'Sea view room' },
  languages = LANGUAGES,
  wrapper = html => html,
}: SetupOptions = {}): Promise<Setup> {
  const page = await newSpecPage({ components: [IrTranslatableTextarea, IrTranslationEditor], html: '<div></div>' });

  // Patch the mock-doc instance the test window actually uses (it is not the one a test-file import would resolve).
  let proto = Object.getPrototypeOf(page.doc.createElement('div'));
  while (proto && !Object.prototype.hasOwnProperty.call(proto, 'attachInternals')) proto = Object.getPrototypeOf(proto);
  const original = proto.attachInternals;
  proto.attachInternals = function () {
    return new FakeInternals(this);
  };

  try {
    await page.setContent(wrapper(`<ir-translatable-textarea ${attrs}></ir-translatable-textarea>`));
  } finally {
    proto.attachInternals = original;
  }

  const root = page.doc.querySelector('ir-translatable-textarea') as HTMLIrTranslatableTextareaElement;
  const instance = page.rootInstance as IrTranslatableTextarea;
  root.languages = languages;
  root.value = value;
  await page.waitForChanges();

  const changes: TranslatableValueChangeDetail[] = [];
  root.addEventListener('valueChange', (event: CustomEvent<TranslatableValueChangeDetail>) => changes.push(event.detail));

  return { page, root, instance, internals: instance.internals as unknown as FakeInternals, shadow: root.shadowRoot, changes };
}

function event(page: SpecPage, type: string, detail?: unknown): Event {
  const win = page.win as any;
  return detail === undefined ? new win.Event(type) : new win.CustomEvent(type, { detail });
}

const sourceTextarea = (shadow: ShadowRoot) => shadow.querySelector('.textarea--source') as HTMLElement & { value: string; hint: string };
const trigger = (shadow: ShadowRoot) => shadow.querySelector('.translate-trigger') as HTMLElement | null;
const dialog = (shadow: ShadowRoot) => shadow.querySelector('ir-dialog') as HTMLElement | null;
const editor = (shadow: ShadowRoot) => shadow.querySelector('ir-translation-editor') as HTMLIrTranslationEditorElement | null;
const footerButtons = (shadow: ShadowRoot) => Array.from(shadow.querySelectorAll('wa-button[slot="footer"]')) as HTMLElement[];
// wa-* elements are not defined under mock-doc, so Stencil renders their string props as attributes.
const attr = (el: Element, name: string) => el.getAttribute(name) ?? (el as any)[name];
const isOpen = (el: Element) => (el as any).open === true || el.hasAttribute('open');
const isDisabled = (el: Element) => (el as any).disabled === true || el.hasAttribute('disabled');

async function typeSource(setup: Setup, text: string) {
  const textarea = sourceTextarea(setup.shadow);
  textarea.value = text;
  textarea.dispatchEvent(event(setup.page, 'input'));
  await setup.page.waitForChanges();
}

async function openEditor(setup: Setup) {
  trigger(setup.shadow).dispatchEvent(event(setup.page, 'click'));
  await setup.page.waitForChanges();
}

async function typeTranslation(setup: Setup, text: string) {
  const textarea = editor(setup.shadow).shadowRoot.querySelector('wa-textarea') as HTMLElement & { value: string };
  textarea.value = text;
  textarea.dispatchEvent(event(setup.page, 'input'));
  await setup.page.waitForChanges();
}

async function selectLanguage(setup: Setup, code: string) {
  const select = editor(setup.shadow).shadowRoot.querySelector('wa-select') as HTMLElement & { value: string };
  select.value = code;
  select.dispatchEvent(event(setup.page, 'change'));
  await setup.page.waitForChanges();
}

async function click(setup: Setup, el: HTMLElement) {
  el.dispatchEvent(event(setup.page, 'click'));
  await setup.page.waitForChanges();
}

describe('ir-translatable-textarea', () => {
  describe('rendering', () => {
    it('renders the label with a required marker and the default-language text inline', async () => {
      const { shadow } = await setup();
      expect(shadow.querySelector('.field__label').textContent).toBe('Description*');
      expect(shadow.querySelector('.field__required').getAttribute('aria-hidden')).toBe('true');
      expect(attr(sourceTextarea(shadow), 'value')).toBe('Sea view room');
    });

    it('sets lang and dir attributes on the inline textarea', async () => {
      const { shadow } = await setup({ attrs: 'label="Description" default-language="ar"', value: { ar: 'مرحبا' } });
      const textarea = sourceTextarea(shadow);
      expect(textarea.getAttribute('lang')).toBe('ar');
      expect(textarea.getAttribute('dir')).toBe('rtl');
      expect(attr(textarea, 'value')).toBe('مرحبا');
    });

    it('shows a plain Translate action without any progress count', async () => {
      const { shadow } = await setup();
      expect(trigger(shadow).textContent.trim()).toBe('Translate');
    });

    it('hides the Translate action and the editor when there is nothing to translate into', async () => {
      const { shadow } = await setup({ languages: [{ code: 'en' }] });
      expect(trigger(shadow)).toBeNull();
      expect(dialog(shadow)).toBeNull();
    });

    it('disables the Translate action when the field is disabled', async () => {
      const { shadow } = await setup({ attrs: 'label="Description" disabled' });
      expect(isDisabled(trigger(shadow))).toBe(true);
    });

    it('applies label overrides', async () => {
      const { root, shadow, page } = await setup();
      root.labels = { translate: 'Traduire' };
      await page.waitForChanges();
      expect(trigger(shadow).textContent.trim()).toBe('Traduire');
    });
  });

  describe('inline editing', () => {
    it('updates the default language and emits valueChange', async () => {
      const s = await setup({ value: { en: 'Sea view room', fr: 'Chambre vue mer' } });
      await typeSource(s, 'Garden view room');
      expect(s.root.value).toEqual({ en: 'Garden view room', fr: 'Chambre vue mer' });
      expect(s.changes).toEqual([{ value: { en: 'Garden view room', fr: 'Chambre vue mer' }, languages: ['en'] }]);
    });
  });

  describe('form association', () => {
    it('submits the JSON-encoded map under its name', async () => {
      const s = await setup({ value: { en: 'Sea view room', fr: 'Chambre vue mer' } });
      expect(JSON.parse(s.internals.formValue)).toEqual({ en: 'Sea view room', fr: 'Chambre vue mer' });
      await typeSource(s, 'Updated');
      expect(JSON.parse(s.internals.formValue)).toEqual({ en: 'Updated', fr: 'Chambre vue mer' });
    });

    it('submits nothing when it has no name', async () => {
      const s = await setup({ attrs: 'label="Description"' });
      expect(s.internals.formValue).toBeNull();
    });

    it('is valid only when the default language has non-blank text', async () => {
      const s = await setup({ value: { en: 'Sea view room' } });
      expect(await s.root.checkValidity()).toBe(true);

      s.root.value = { en: '   ', fr: 'Bonjour' };
      await s.page.waitForChanges();
      expect(await s.root.checkValidity()).toBe(false);
      expect(s.internals.valueMissing).toBe(true);
      expect(s.internals.validationMessage).toBe('English text is required.');
      expect(s.internals.anchor).toBe(sourceTextarea(s.shadow));
      expect(s.internals.states.has('invalid')).toBe(true);
    });

    it('checkValidity() does not reveal the error', async () => {
      const s = await setup({ value: {} });
      expect(await s.root.checkValidity()).toBe(false);
      await s.page.waitForChanges();
      expect(attr(sourceTextarea(s.shadow), 'hint')).toBe('');
      expect(sourceTextarea(s.shadow).classList.contains('textarea--invalid')).toBe(false);
      expect(s.internals.states.has('user-invalid')).toBe(false);
    });

    it('reportValidity() reveals the error and focuses the field', async () => {
      const s = await setup({ value: {} });
      const textarea = sourceTextarea(s.shadow);
      textarea.focus = jest.fn();
      expect(await s.root.reportValidity()).toBe(false);
      await s.page.waitForChanges();
      expect(attr(textarea, 'hint')).toBe('English text is required.');
      expect(textarea.classList.contains('textarea--invalid')).toBe(true);
      expect(textarea.focus).toHaveBeenCalled();
      expect(s.internals.states.has('user-invalid')).toBe(true);
    });

    it('reveals the error when the browser reports the field invalid on submit', async () => {
      const s = await setup({ value: {} });
      s.root.dispatchEvent(event(s.page, 'invalid'));
      await s.page.waitForChanges();
      expect(attr(sourceTextarea(s.shadow), 'hint')).toBe('English text is required.');
    });

    it('shows the error only after the user leaves the blank field, and clears it once filled', async () => {
      const s = await setup({ attrs: 'label="Description" hint="Shown to guests."', value: {} });
      expect(attr(sourceTextarea(s.shadow), 'hint')).toBe('Shown to guests.');

      sourceTextarea(s.shadow).dispatchEvent(event(s.page, 'blur'));
      await s.page.waitForChanges();
      expect(attr(sourceTextarea(s.shadow), 'hint')).toBe('English text is required.');

      await typeSource(s, 'Sea view room');
      expect(attr(sourceTextarea(s.shadow), 'hint')).toBe('Shown to guests.');
      expect(s.internals.valid).toBe(true);
      expect(s.internals.states.has('user-invalid')).toBe(false);
    });

    it('uses an overridden required message', async () => {
      const s = await setup({ value: {} });
      s.root.labels = { required: 'Please write the {language} version.' };
      await s.page.waitForChanges();
      await s.root.reportValidity();
      await s.page.waitForChanges();
      expect(attr(sourceTextarea(s.shadow), 'hint')).toBe('Please write the English version.');
    });

    it('names languages in the locale of the nearest lang attribute', async () => {
      const s = await setup({ value: {}, wrapper: html => `<div lang="fr">${html}</div>` });
      await s.root.reportValidity();
      await s.page.waitForChanges();
      expect(attr(sourceTextarea(s.shadow), 'hint')).toBe('Anglais text is required.');
    });

    it('formResetCallback restores the initial value, clears the error and closes the editor', async () => {
      const s = await setup({ value: {} });
      // The initial value is captured on load, before setup() assigned one.
      await openEditor(s);
      await s.root.reportValidity();
      await typeSource(s, 'Changed');
      s.instance.formResetCallback();
      await s.page.waitForChanges();
      expect(s.root.value).toEqual({});
      expect(attr(sourceTextarea(s.shadow), 'hint')).toBe('');
      expect(isOpen(dialog(s.shadow))).toBe(false);
    });

    it('formDisabledCallback mirrors the disabled state', async () => {
      const s = await setup();
      s.instance.formDisabledCallback(true);
      await s.page.waitForChanges();
      expect(s.root.disabled).toBe(true);
      expect(isDisabled(sourceTextarea(s.shadow))).toBe(true);
      expect(isDisabled(trigger(s.shadow))).toBe(true);
    });
  });

  describe('translation editor', () => {
    it('is closed until Translate is clicked', async () => {
      const s = await setup();
      expect(isOpen(dialog(s.shadow))).toBe(false);
      expect(editor(s.shadow)).toBeNull();
    });

    it('opens on the first language without a translation', async () => {
      const s = await setup({ value: { en: 'Sea view room', fr: 'Chambre vue mer' } });
      await openEditor(s);
      expect(isOpen(dialog(s.shadow))).toBe(true);
      expect(dialog(s.shadow).getAttribute('label')).toBe('Translate Description');
      expect(editor(s.shadow).language).toBe('es');
    });

    it('opens on the first language when everything is translated', async () => {
      const s = await setup({ value: { en: 'a', fr: 'b', es: 'c', ar: 'd' } });
      await openEditor(s);
      expect(editor(s.shadow).language).toBe('fr');
    });

    it('openTranslations() opens on the requested language', async () => {
      const s = await setup();
      await s.root.openTranslations('ar');
      await s.page.waitForChanges();
      expect(isOpen(dialog(s.shadow))).toBe(true);
      expect(editor(s.shadow).language).toBe('ar');
    });

    it('passes its configuration through to the editor', async () => {
      const s = await setup({ attrs: 'label="Description" rows="3" maxlength="200" with-count readonly display-locale="fr"' });
      await openEditor(s);
      const ed = editor(s.shadow);
      expect(ed.languages).toEqual(LANGUAGES);
      expect(ed.defaultLanguage).toBe('en');
      expect(ed.label).toBe('Description');
      expect(ed.rows).toBe(6);
      expect(ed.maxlength).toBe(200);
      expect(ed.withCount).toBe(true);
      expect(ed.readonly).toBe(true);
      expect(ed.displayLocale).toBe('fr');
    });

    it('focuses the translation input once the dialog has opened', async () => {
      const s = await setup();
      await openEditor(s);
      const input = editor(s.shadow).shadowRoot.querySelector('wa-textarea') as HTMLElement;
      input.focus = jest.fn();
      dialog(s.shadow).dispatchEvent(event(s.page, 'irDialogAfterShow', null));
      await s.page.waitForChanges();
      expect(input.focus).toHaveBeenCalled();
    });

    it('keeps edits as a draft until saved', async () => {
      const s = await setup();
      await openEditor(s);
      const [cancel, save] = footerButtons(s.shadow);
      expect(cancel.textContent).toBe('Cancel');
      expect(isDisabled(save)).toBe(true);

      await typeTranslation(s, 'Chambre vue mer');
      expect(s.root.value).toEqual({ en: 'Sea view room' });
      expect(s.changes).toEqual([]);
      expect(editor(s.shadow).value).toEqual({ en: 'Sea view room', fr: 'Chambre vue mer' });
      expect(cancel.textContent).toBe('Discard changes');
      expect(isDisabled(save)).toBe(false);
    });

    it('keeps drafts for several languages and saves them together', async () => {
      const s = await setup();
      await openEditor(s);
      await typeTranslation(s, 'Chambre vue mer');
      await selectLanguage(s, 'ar');
      expect(editor(s.shadow).language).toBe('ar');
      await typeTranslation(s, 'غرفة مطلة على البحر');

      await click(s, footerButtons(s.shadow)[1]);
      expect(s.root.value).toEqual({ en: 'Sea view room', fr: 'Chambre vue mer', ar: 'غرفة مطلة على البحر' });
      expect(s.changes).toEqual([{ value: s.root.value, languages: ['fr', 'ar'] }]);
      expect(isOpen(dialog(s.shadow))).toBe(false);
      expect(editor(s.shadow)).toBeNull();
      expect(JSON.parse(s.internals.formValue).ar).toBe('غرفة مطلة على البحر');
    });

    it('removes a translation cleared to blank on save', async () => {
      const s = await setup({ value: { en: 'Sea view room', fr: 'Chambre vue mer' } });
      await s.root.openTranslations('fr');
      await s.page.waitForChanges();
      await typeTranslation(s, '   ');
      await click(s, footerButtons(s.shadow)[1]);
      expect(s.root.value).toEqual({ en: 'Sea view room' });
      expect(s.changes).toEqual([{ value: { en: 'Sea view room' }, languages: ['fr'] }]);
    });

    it('treats an edit that restores the saved text as no change', async () => {
      const s = await setup({ value: { en: 'Sea view room', fr: 'Chambre vue mer' } });
      await s.root.openTranslations('fr');
      await s.page.waitForChanges();
      await typeTranslation(s, 'Chambre');
      await typeTranslation(s, 'Chambre vue mer');
      const [cancel, save] = footerButtons(s.shadow);
      expect(cancel.textContent).toBe('Cancel');
      expect(isDisabled(save)).toBe(true);
    });

    it('discards the draft on Cancel', async () => {
      const s = await setup();
      await openEditor(s);
      await typeTranslation(s, 'Chambre vue mer');
      await click(s, footerButtons(s.shadow)[0]);
      expect(s.root.value).toEqual({ en: 'Sea view room' });
      expect(s.changes).toEqual([]);
      expect(isOpen(dialog(s.shadow))).toBe(false);
    });

    it('discards the draft when the dialog closes itself, and reopens clean', async () => {
      const s = await setup();
      await openEditor(s);
      await typeTranslation(s, 'Chambre vue mer');
      dialog(s.shadow).dispatchEvent(event(s.page, 'irDialogHide', { source: dialog(s.shadow) }));
      await s.page.waitForChanges();
      expect(isOpen(dialog(s.shadow))).toBe(false);
      expect(s.root.value).toEqual({ en: 'Sea view room' });

      await openEditor(s);
      expect(isOpen(dialog(s.shadow))).toBe(true);
      expect(editor(s.shadow).value).toEqual({ en: 'Sea view room' });
      expect(footerButtons(s.shadow)[0].textContent).toBe('Cancel');
    });

    it('ignores irDialogHide events that do not come from its own dialog', async () => {
      const s = await setup();
      await openEditor(s);
      await typeTranslation(s, 'Chambre vue mer');
      const stray = s.page.doc.createElement('ir-dialog');
      editor(s.shadow).shadowRoot.appendChild(stray);
      stray.dispatchEvent(new (s.page.win as any).CustomEvent('irDialogHide', { detail: { source: stray }, bubbles: true, composed: true }));
      await s.page.waitForChanges();
      expect(isOpen(dialog(s.shadow))).toBe(true);
      expect(editor(s.shadow).value.fr).toBe('Chambre vue mer');
    });

    it('cannot save when readonly', async () => {
      const s = await setup({ attrs: 'label="Description" readonly' });
      await openEditor(s);
      await typeTranslation(s, 'Chambre vue mer');
      expect(isDisabled(footerButtons(s.shadow)[1])).toBe(true);
    });

    it('omits the field name from the title when there is no label', async () => {
      const s = await setup({ attrs: '' });
      await openEditor(s);
      expect(dialog(s.shadow).getAttribute('label')).toBe('Translate');
    });
  });
});
