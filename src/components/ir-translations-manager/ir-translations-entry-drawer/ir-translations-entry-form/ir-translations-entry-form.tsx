import { SetupService } from '@/services/setup';
import { showToast } from '@/utils/utils';
import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import { buildEditSetupParams } from '../../setup-mapping';
import { TranslationEntry, TranslationLanguage } from '../../types';
import { getSourceLanguage, hasValue } from '../../utils';

/** Pulls a `{ "code": "translation" }` object out of an AI reply, tolerating markdown fences and surrounding prose. */
function extractTranslationObject(text: string): Record<string, unknown> | null {
  const trimmed = text?.trim();
  if (!trimmed) {
    return null;
  }
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    return null;
  }
  try {
    const parsed = JSON.parse(candidate.slice(start, end + 1));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Owns the create/edit draft for a single translation key and saves it directly —
 * the drawer around this form is a dumb open/close shell.
 */
@Component({
  tag: 'ir-translations-entry-form',
  styleUrl: 'ir-translations-entry-form.css',
  scoped: true,
})
export class IrTranslationsEntryForm {
  @Prop() formId: string;
  @Prop() languages: TranslationLanguage[] = [];
  /** The entry being edited. Null puts the form in create mode. */
  @Prop() entry: TranslationEntry | null = null;
  /** Keys already used in the active table, for duplicate detection. */
  @Prop() existingKeys: string[] = [];
  /** DISPLAY_ORDER a brand-new key should get — one past the highest order already in the table. */
  @Prop() nextDisplayOrder: number = 0;
  @Prop() tableName: string;
  @Prop() ownerId: number;
  @Prop() entryUserId: number;

  @Event() entrySaved: EventEmitter<void>;
  @Event() submitDisabledChange: EventEmitter<boolean>;
  @Event() isSubmittingChange: EventEmitter<boolean>;

  @State() key: string = '';
  @State() values: Record<string, string> = {};
  @State() isSubmitting: boolean = false;

  private keyInputRef?: HTMLIrInputElement;
  private setupService = new SetupService();

  componentWillLoad() {
    this.key = this.entry?.key ?? '';
    this.values = { ...(this.entry?.values ?? {}) };
    this.submitDisabledChange.emit(!this.isValid);
  }

  componentDidLoad() {
    requestAnimationFrame(() => this.keyInputRef?.focusInput());
  }

  private get isEditing(): boolean {
    return !!this.entry;
  }

  private get trimmedKey(): string {
    return this.key.trim();
  }

  private get isDuplicateKey(): boolean {
    if (!this.trimmedKey) {
      return false;
    }
    if (this.isEditing && this.trimmedKey === this.entry.key) {
      return false;
    }
    return this.existingKeys.includes(this.trimmedKey);
  }

  private get isValid(): boolean {
    return this.trimmedKey.length > 0 && !this.isDuplicateKey;
  }

  private get translatedCount(): number {
    return this.languages.filter(language => hasValue(this.values[language.code])).length;
  }

  private get sourceLanguage(): TranslationLanguage | undefined {
    return getSourceLanguage(this.languages);
  }

  private get targetLanguages(): TranslationLanguage[] {
    const sourceCode = this.sourceLanguage?.code;
    return this.languages.filter(language => language.code !== sourceCode);
  }

  private get missingLanguages(): TranslationLanguage[] {
    return this.targetLanguages.filter(language => !hasValue(this.values[language.code]));
  }

  private get canCopyPrompt(): boolean {
    return hasValue(this.values[this.sourceLanguage?.code]) && this.missingLanguages.length > 0;
  }

  private get canPasteTranslations(): boolean {
    return this.targetLanguages.length > 0;
  }

  private buildTranslationPrompt(): string {
    const source = this.sourceLanguage;
    const missing = this.missingLanguages;
    const targets = missing.map(language => `${language.name} (${language.code})`).join(', ');
    return [
      `Translate the following UI text from ${source.name} (${source.code}) into: ${targets}.`,
      '',
      'Text:',
      '"""',
      this.values[source.code],
      '"""',
      '',
      'Rules:',
      '- Preserve placeholders, variables, and HTML tags exactly (e.g. {0}, %s, {{name}}, <b>).',
      '- Keep the tone and length appropriate for a UI label, button, or short message.',
      '- Reply with ONLY a JSON object mapping each language code to its translation — no explanation, no markdown fences.',
      '',
      `Example shape: {${missing.map(language => `"${language.code}": "..."`).join(', ')}}`,
    ].join('\n');
  }

  private handleCopyPrompt = async () => {
    if (!this.canCopyPrompt) {
      return;
    }
    try {
      await navigator.clipboard.writeText(this.buildTranslationPrompt());
      showToast({ type: 'success', title: 'Prompt copied — paste it into your AI chatbot.' });
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Unable to copy prompt to clipboard.' });
    }
  };

  private handlePasteTranslations = async () => {
    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch (error) {
      console.error(error);
      showToast({ type: 'error', title: 'Unable to read clipboard — allow clipboard access and try again.' });
      return;
    }

    const parsed = extractTranslationObject(text);
    if (!parsed) {
      showToast({ type: 'error', title: "Couldn't find a translation JSON object in the clipboard." });
      return;
    }

    const targetCodes = new Set(this.targetLanguages.map(language => language.code));
    const next = { ...this.values };
    let filled = 0;
    for (const [code, value] of Object.entries(parsed)) {
      const normalizedCode = code.trim();
      if (!targetCodes.has(normalizedCode) || typeof value !== 'string' || !hasValue(value)) {
        continue;
      }
      next[normalizedCode] = value;
      filled++;
    }

    if (filled === 0) {
      showToast({ type: 'error', title: 'No matching language codes found in the clipboard text.' });
      return;
    }

    this.values = next;
    showToast({ type: 'success', title: `Filled ${filled} translation${filled === 1 ? '' : 's'} from clipboard.` });
  };

  private handleKeyChange(value: string) {
    this.key = value ?? '';
    this.submitDisabledChange.emit(!this.isValid);
  }

  private handleSubmit = async (event: Event) => {
    event.preventDefault();
    if (!this.isValid) {
      return;
    }

    const previous = this.entry;
    // CODE_NAME is the natural key Edit_Setup upserts on, so changing it
    // creates a brand-new row — the old one has to be soft-deleted explicitly,
    // otherwise it lingers behind as an orphaned duplicate.
    const keyChanged = !!previous && previous.key !== this.trimmedKey;
    // A brand-new row either way (fresh create, or the rename's replacement
    // row) — meta is dropped below for both, so it has no displayOrder to
    // inherit and would otherwise default to 0, jumping to the front.
    const isNewRow = !previous || keyChanged;

    this.isSubmitting = true;
    this.isSubmittingChange.emit(true);
    try {
      if (keyChanged) {
        await this.setupService.editSetup(
          buildEditSetupParams({
            ownerId: this.ownerId,
            entryUserId: this.entryUserId,
            tableName: this.tableName,
            key: previous.key,
            values: previous.values,
            meta: previous.meta,
            isDeleted: true,
            touch: true,
          }),
        );
      }
      await this.setupService.editSetup(
        buildEditSetupParams({
          ownerId: this.ownerId,
          entryUserId: this.entryUserId,
          tableName: this.tableName,
          key: this.trimmedKey,
          values: this.values,
          meta: keyChanged ? undefined : previous?.meta,
          touch: true,
          displayOrder: isNewRow ? this.nextDisplayOrder : undefined,
        }),
      );
      showToast({ type: 'success', title: previous ? 'Key updated' : 'Key created' });
      this.entrySaved.emit();
    } finally {
      this.isSubmitting = false;
      this.isSubmittingChange.emit(false);
    }
  };

  render() {
    const total = this.languages.length;
    const translated = this.translatedCount;

    return (
      <form id={this.formId} class="entry-form__body" onSubmit={this.handleSubmit} novalidate>
        <ir-input
          label="Key"
          readonly={this.isEditing}
          autocomplete="off"
          mask={{
            mask: '{Lcz_}TEXT',
            eager: true,
            blocks: {
              TEXT: {
                mask: '*', // Accept any character
                repeat: Infinity, // Unlimited characters
              },
            },
          }}
          spellcheck={false}
          class="entry-form__key-input"
          value={this.key}
          placeholder="e.g. Lcz_BookingConfirmed"
          onText-change={e => this.handleKeyChange(e.detail)}
          ref={el => (this.keyInputRef = el)}
        ></ir-input>
        {this.isDuplicateKey && (
          <p class="entry-form__error" role="alert">
            This key already exists in this table.
          </p>
        )}

        <div class="entry-form__section">
          <div class="entry-form__section-header">
            <h3 class="entry-form__section-title">Translations</h3>
            <span class="entry-form__section-meta">
              {translated} of {total} filled
            </span>
          </div>

          {this.targetLanguages.length > 0 && (
            <div class="entry-form__ai-actions">
              <ir-custom-button size="s" appearance="outlined" variant="neutral" disabled={!this.canCopyPrompt} onClickHandler={this.handleCopyPrompt}>
                <wa-icon name="copy" slot="start" aria-hidden="true"></wa-icon>
                Copy AI prompt
              </ir-custom-button>
              <ir-custom-button size="s" appearance="outlined" variant="neutral" disabled={!this.canPasteTranslations} onClickHandler={this.handlePasteTranslations}>
                <wa-icon name="clipboard" slot="start" aria-hidden="true"></wa-icon>
                Paste AI translations
              </ir-custom-button>
            </div>
          )}

          {total === 0 ? (
            <ir-empty-state message="No languages configured yet. Add one from Manage languages first."></ir-empty-state>
          ) : (
            <div class="entry-form__fields">
              {this.languages.map(language => (
                <wa-textarea
                  key={language.code}
                  class="entry-form__value-input"
                  size="s"
                  rows={2}
                  resize="auto"
                  value={this.values[language.code] ?? ''}
                  placeholder="Enter translation…"
                  oninput={(e: Event) => (this.values = { ...this.values, [language.code]: (e.target as HTMLTextAreaElement).value })}
                >
                  {/* Slotted so the source marker sits on the label line rather than below the field, where a hint would read as belonging to the next one. */}
                  <span slot="label" class="entry-form__field-label">
                    {language.name}
                    <span class="entry-form__field-code">{language.code.toUpperCase()}</span>
                    {language.isSource && <span class="entry-form__field-source">Source</span>}
                  </span>
                </wa-textarea>
              ))}
            </div>
          )}
        </div>
      </form>
    );
  }
}
