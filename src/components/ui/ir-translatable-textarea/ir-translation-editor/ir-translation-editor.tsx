import type WaTextarea from '@awesome.me/webawesome/dist/components/textarea/textarea';
import { Component, Event, EventEmitter, Host, Method, Prop, h } from '@stencil/core';
import type { TranslatableLanguage, TranslatableTextareaLabels, TranslationMap } from '../types';
import { DEFAULT_LABELS, applyLanguageAttributes, findLanguage, isFilled, resolveDir, resolveLanguageName, targetLanguages } from '../utils';

export interface TranslationInputDetail {
  language: string;
  text: string;
}

/**
 * Side-by-side translation editor: a language selector, the default-language text as a read-only reference,
 * and a textarea for the selected language. Stateless about edits — it shows `value` and reports keystrokes
 * through `translationInput`; the owner decides when to save.
 */
@Component({
  tag: 'ir-translation-editor',
  styleUrl: 'ir-translation-editor.css',
  shadow: true,
})
export class IrTranslationEditor {
  /** Text per language to display (saved text merged with any unsaved edits). */
  @Prop() value: TranslationMap = {};

  /** All languages; the default language is shown as the reference and excluded from the selector. */
  @Prop() languages: TranslatableLanguage[] = [];

  @Prop() defaultLanguage: string = 'en';

  /** The language being edited. Updated when the user picks another one. */
  @Prop({ mutable: true }) language: string;

  /** Field label, used in the textarea's accessible name. */
  @Prop() label: string;

  @Prop() rows: number = 6;

  @Prop() maxlength: number;

  @Prop() withCount: boolean = false;

  @Prop() size: WaTextarea['size'] = 's';

  @Prop() appearance: WaTextarea['appearance'] = 'outlined';

  @Prop() readonly: boolean = false;

  /** Locale used to display language names. */
  @Prop() displayLocale: string;

  @Prop() labels: Partial<TranslatableTextareaLabels> = {};

  /** Emitted on every keystroke in the translation textarea. */
  @Event() translationInput: EventEmitter<TranslationInputDetail>;

  /** Emitted when the user selects another language. */
  @Event() translationLanguageChange: EventEmitter<string>;

  private textareaEl?: WaTextarea;

  /** Focuses the translation textarea. */
  @Method()
  async focusInput() {
    this.textareaEl?.focus();
  }

  private get text(): TranslatableTextareaLabels {
    return { ...DEFAULT_LABELS, ...this.labels };
  }

  private languageName(code: string): string {
    return resolveLanguageName(code, findLanguage(this.languages, code).label, this.displayLocale);
  }

  private languageDir(code: string) {
    return resolveDir(code, findLanguage(this.languages, code).dir);
  }

  private handleLanguageChange = (event: Event) => {
    const code = (event.target as HTMLSelectElement).value;
    if (!code || code === this.language) return;
    this.language = code;
    this.translationLanguageChange.emit(code);
  };

  private handleInput = (event: Event) => {
    this.translationInput.emit({ language: this.language, text: (event.target as WaTextarea).value ?? '' });
  };

  render() {
    const targets = targetLanguages(this.languages ?? [], this.defaultLanguage);
    const code = this.language ?? targets[0]?.code;
    const source = this.value?.[this.defaultLanguage] ?? '';
    return (
      <Host>
        <wa-select class="language" size="s" label={this.text.language} value={code} onChange={this.handleLanguageChange}>
          {targets.map(language => {
            const name = this.languageName(language.code);
            return (
              <wa-option key={language.code} value={language.code} label={name}>
                {name}
              </wa-option>
            );
          })}
        </wa-select>

        <div class="columns">
          <section class="column" aria-labelledby="reference-heading">
            <header class="column-header">
              <h3 id="reference-heading" class="column-title">
                {this.text.reference}
              </h3>
              <span class="column-language">{this.languageName(this.defaultLanguage)}</span>
            </header>
            <div class={{ 'reference': true, 'reference--empty': !isFilled(source) }} lang={this.defaultLanguage} dir={this.languageDir(this.defaultLanguage)}>
              {isFilled(source) ? source : this.text.emptyReference}
            </div>
          </section>

          {code && (
            <section class="column" aria-labelledby="target-heading">
              <header class="column-header">
                <h3 id="target-heading" class="column-title">
                  {this.languageName(code)}
                </h3>
              </header>
              <wa-textarea
                key={`translation-${code}`}
                ref={el => {
                  this.textareaEl = el as WaTextarea;
                  applyLanguageAttributes(el, code, this.languageDir(code));
                }}
                class="textarea"
                label={this.label ? `${this.label} (${this.languageName(code)})` : this.languageName(code)}
                value={this.value?.[code] ?? ''}
                rows={this.rows}
                maxlength={this.maxlength}
                withCount={this.withCount}
                resize="vertical"
                size={this.size}
                appearance={this.appearance}
                readonly={this.readonly}
                onInput={this.handleInput}
              ></wa-textarea>
            </section>
          )}
        </div>
      </Host>
    );
  }
}
