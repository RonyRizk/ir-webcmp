import type WaTextarea from '@awesome.me/webawesome/dist/components/textarea/textarea';
import { AttachInternals, Component, Element, Event, EventEmitter, Host, Listen, Method, Prop, State, Watch, h } from '@stencil/core';
import type { TranslationInputDetail } from './ir-translation-editor/ir-translation-editor';
import type { TranslatableLanguage, TranslatableTextareaLabels, TranslatableValueChangeDetail, TranslationMap } from './types';
import { DEFAULT_LABELS, applyDraft, applyLanguageAttributes, findLanguage, format, isFilled, resolveDir, resolveLanguageName, targetLanguages } from './utils';

/**
 * A multilingual textarea modelled on Shopify's translation flow: the field itself is edited in the default
 * language (English unless overridden), which is required. Translations are made in a separate side-by-side
 * editor (`ir-translation-editor`, inside a dialog) and are only committed when the user saves.
 *
 * Value is a map keyed by BCP-47 code. Form-associated: submits `JSON.stringify(value)` under `name`, and
 * blocks submission while the default language is blank.
 */
@Component({
  tag: 'ir-translatable-textarea',
  styleUrl: 'ir-translatable-textarea.css',
  shadow: true,
  formAssociated: true,
})
export class IrTranslatableTextarea {
  @AttachInternals() internals: ElementInternals;

  @Element() el: HTMLIrTranslatableTextareaElement;

  /** Text per language, e.g. `{ en: '…', fr: '…' }`. Blank translations are never stored. */
  @Prop({ mutable: true }) value: TranslationMap = {};

  /** Languages the field can be translated into. The default language may be listed; it is skipped as a target. */
  @Prop() languages: TranslatableLanguage[] = [];

  /** The source language: edited inline and required. */
  @Prop() defaultLanguage: string = 'en';

  /** Field label. Also used in the translation editor's title. */
  @Prop() label: string;

  /** Help text under the inline textarea. */
  @Prop() hint: string;

  /** Placeholder for the inline textarea. */
  @Prop() placeholder: string;

  /** Form field name. The submitted value is the JSON-encoded translation map. */
  @Prop({ reflect: true }) name: string;

  @Prop() rows: number = 4;

  /** Maximum characters per language. */
  @Prop() maxlength: number;

  /** Shows a character count (remaining characters when `maxlength` is set). */
  @Prop() withCount: boolean = false;

  @Prop() resize: WaTextarea['resize'] = 'auto';

  @Prop() size: WaTextarea['size'] = 's';

  @Prop() appearance: WaTextarea['appearance'] = 'outlined';

  @Prop({ reflect: true, mutable: true }) disabled: boolean = false;

  @Prop({ reflect: true }) readonly: boolean = false;

  /** Locale used to display language names. Defaults to the nearest `lang` attribute, then the browser locale. */
  @Prop() displayLocale: string;

  /** Overrides for the built-in English UI strings. */
  @Prop() labels: Partial<TranslatableTextareaLabels> = {};

  @State() editorOpen = false;

  /** Unsaved translator edits, keyed by language. Only languages touched in the editor are present. */
  @State() draft: TranslationMap = {};

  @State() editingLanguage: string;

  @State() userInteracted = false;

  /** Emitted when the default-language text is edited, and when the translation editor is saved. */
  @Event() valueChange: EventEmitter<TranslatableValueChangeDetail>;

  private dialogEl?: HTMLIrDialogElement;
  private editorEl?: HTMLIrTranslationEditorElement;
  private sourceTextareaEl?: WaTextarea;
  private initialValue: TranslationMap = {};
  private silentCheck = false;

  componentWillLoad() {
    this.value = this.value ?? {};
    this.initialValue = { ...this.value };
  }

  componentDidLoad() {
    this.syncFormState();
  }

  @Watch('value')
  handleValueChange(next: TranslationMap) {
    if (!next) {
      this.value = {};
      return;
    }
    this.syncFormState();
  }

  @Watch('name')
  @Watch('defaultLanguage')
  @Watch('labels')
  handleConfigChange() {
    this.syncFormState();
  }

  /** Fired by the browser on form submit and by `checkValidity()`/`reportValidity()` when the default language is blank. */
  @Listen('invalid')
  handleInvalid() {
    if (!this.silentCheck) this.revealError();
  }

  /** Opens the translation editor, optionally on a specific language. */
  @Method()
  async openTranslations(code?: string) {
    this.openEditor(code);
  }

  @Method()
  async checkValidity(): Promise<boolean> {
    this.silentCheck = true;
    try {
      return this.internals.checkValidity();
    } finally {
      this.silentCheck = false;
    }
  }

  /** Like `checkValidity()`, but also shows the error and focuses the field. */
  @Method()
  async reportValidity(): Promise<boolean> {
    // checkValidity() dispatches `invalid`, which reveals the error via handleInvalid().
    return this.internals.checkValidity();
  }

  // Form-associated lifecycle callbacks.
  formResetCallback() {
    this.value = { ...this.initialValue };
    this.userInteracted = false;
    this.closeEditor();
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  private get text(): TranslatableTextareaLabels {
    return { ...DEFAULT_LABELS, ...this.labels };
  }

  private get targets(): TranslatableLanguage[] {
    return targetLanguages(this.languages ?? [], this.defaultLanguage);
  }

  private get uiLocale(): string | undefined {
    return this.displayLocale || this.el.closest('[lang]')?.getAttribute('lang') || undefined;
  }

  private languageName(code: string): string {
    return resolveLanguageName(code, findLanguage(this.languages, code).label, this.uiLocale);
  }

  private get isDirty(): boolean {
    return applyDraft(this.value ?? {}, this.draft, this.defaultLanguage).changed.length > 0;
  }

  private get isValid(): boolean {
    return isFilled(this.value?.[this.defaultLanguage]);
  }

  private get showError(): boolean {
    return this.userInteracted && !this.isValid;
  }

  private syncFormState() {
    if (!this.internals) return;
    this.internals.setFormValue(this.name ? JSON.stringify(this.value ?? {}) : null);
    if (this.isValid) {
      this.internals.setValidity({});
    } else {
      const message = format(this.text.required, { language: this.languageName(this.defaultLanguage) });
      this.internals.setValidity({ valueMissing: true }, message, this.sourceTextareaEl);
    }
    this.syncStates();
  }

  private syncStates() {
    try {
      // The bundled DOM lib types CustomStateSet without its Set methods.
      const states = this.internals.states as unknown as Set<string>;
      this.isValid ? states.delete('invalid') : states.add('invalid');
      this.showError ? states.add('user-invalid') : states.delete('user-invalid');
    } catch {
      // CustomStateSet unsupported — styling falls back to the internal classes.
    }
  }

  private revealError() {
    this.userInteracted = true;
    this.syncStates();
    this.sourceTextareaEl?.focus();
  }

  private handleSourceInput = (event: Event) => {
    const text = (event.target as WaTextarea).value ?? '';
    this.value = { ...this.value, [this.defaultLanguage]: text };
    this.valueChange.emit({ value: this.value, languages: [this.defaultLanguage] });
  };

  private handleSourceBlur = () => {
    if (this.userInteracted) return;
    this.userInteracted = true;
    this.syncStates();
  };

  private openEditor(code?: string) {
    const targets = this.targets;
    if (!targets.length) return;
    const requested = targets.find(language => language.code === code);
    // Start where there is work to do: the first language without a translation.
    const firstMissing = targets.find(language => !isFilled(this.value?.[language.code]));
    this.editingLanguage = (requested ?? firstMissing ?? targets[0]).code;
    this.draft = {};
    this.editorOpen = true;
  }

  private closeEditor() {
    this.draft = {};
    this.editorOpen = false;
  }

  private save = () => {
    const { next, changed } = applyDraft(this.value ?? {}, this.draft, this.defaultLanguage);
    if (changed.length) {
      this.value = next;
      this.valueChange.emit({ value: next, languages: changed });
    }
    this.closeEditor();
  };

  /** ir-dialog closes itself (Escape, close button) and cannot be vetoed — unsaved edits are discarded. */
  private handleDialogHide = (event: CustomEvent) => {
    if (event.target !== this.dialogEl) return;
    this.closeEditor();
  };

  private handleDialogAfterShow = (event: CustomEvent) => {
    if (event.target !== this.dialogEl) return;
    this.editorEl?.focusInput();
  };

  private handleTranslationInput = (event: CustomEvent<TranslationInputDetail>) => {
    const { language, text } = event.detail;
    this.draft = { ...this.draft, [language]: text };
  };

  private renderEditor() {
    if (!this.targets.length) return null;
    const dirty = this.isDirty;
    return (
      <ir-dialog
        ref={el => (this.dialogEl = el as HTMLIrDialogElement)}
        class="editor"
        label={format(this.text.editorTitle, { field: this.label ?? '' }).trim()}
        open={this.editorOpen}
        lightDismiss={false}
        onIrDialogHide={this.handleDialogHide}
        onIrDialogAfterShow={this.handleDialogAfterShow}
      >
        {this.editorOpen && (
          <ir-translation-editor
            ref={el => (this.editorEl = el as HTMLIrTranslationEditorElement)}
            value={{ ...this.value, ...this.draft }}
            languages={this.languages}
            defaultLanguage={this.defaultLanguage}
            language={this.editingLanguage}
            label={this.label}
            rows={Math.max(this.rows, 6)}
            maxlength={this.maxlength}
            withCount={this.withCount}
            size={this.size}
            appearance={this.appearance}
            readonly={this.readonly}
            displayLocale={this.uiLocale}
            labels={this.text}
            onTranslationInput={this.handleTranslationInput}
            onTranslationLanguageChange={(event: CustomEvent<string>) => (this.editingLanguage = event.detail)}
          ></ir-translation-editor>
        )}

        <wa-button slot="footer" appearance="outlined" variant="neutral" onClick={() => this.closeEditor()}>
          {dirty ? this.text.discard : this.text.cancel}
        </wa-button>
        <wa-button slot="footer" variant="brand" disabled={!dirty || this.readonly} onClick={this.save}>
          {this.text.save}
        </wa-button>
      </ir-dialog>
    );
  }

  render() {
    const defaultName = this.languageName(this.defaultLanguage);
    const errorMessage = this.showError ? format(this.text.required, { language: defaultName }) : null;
    return (
      <Host>
        <div class={{ 'field': true, 'field--invalid': this.showError }}>
          <div class="field__header">
            <span id="field-label" class="field__label" part="label">
              {this.label}
              <span class="field__required" aria-hidden="true">
                *
              </span>
            </span>
            {this.targets.length > 0 && (
              <wa-button class="translate-trigger" size="s" appearance="plain" variant="neutral" disabled={this.disabled} onClick={() => this.openEditor()}>
                <wa-icon slot="start" name="language"></wa-icon>
                {this.text.translate}
              </wa-button>
            )}
          </div>
          <wa-textarea
            ref={el => {
              this.sourceTextareaEl = el as WaTextarea;
              applyLanguageAttributes(el, this.defaultLanguage, resolveDir(this.defaultLanguage, findLanguage(this.languages, this.defaultLanguage).dir));
            }}
            class={errorMessage ? 'textarea textarea--source textarea--invalid' : 'textarea textarea--source'}
            label={this.label || defaultName}
            hint={errorMessage ?? this.hint ?? ''}
            value={this.value?.[this.defaultLanguage] ?? ''}
            placeholder={this.placeholder}
            rows={this.rows}
            maxlength={this.maxlength}
            withCount={this.withCount}
            resize={this.resize}
            size={this.size}
            appearance={this.appearance}
            disabled={this.disabled}
            readonly={this.readonly}
            onInput={this.handleSourceInput}
            onBlur={this.handleSourceBlur}
          ></wa-textarea>
        </div>
        {this.renderEditor()}
      </Host>
    );
  }
}
