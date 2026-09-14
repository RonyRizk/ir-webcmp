import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import { TranslationLanguage } from '../types';

export interface TranslationsSettingsSaved {
  usedTablesOnly: boolean;
  pinnedCodes: string[];
  showNotes: boolean;
}

/**
 * Settings for the entries grid — which tables the pickers offer, which
 * non-source languages show up as columns, and whether the notes column is
 * shown. Every control here edits a local draft only; nothing reaches the
 * parent (and nothing is persisted) until Save is clicked. Cancel — or
 * dismissing the dialog any other way — drops the draft entirely.
 */
@Component({
  tag: 'ir-translations-settings-dialog',
  styleUrl: 'ir-translations-settings-dialog.css',
  scoped: true,
})
export class IrTranslationsSettingsDialog {
  @Prop() open: boolean = false;
  /** Hides setup tables nothing in this codebase reads — the same filter the table pickers apply. */
  @Prop() usedTablesOnly: boolean = true;
  /** Every language this property exposes; the pin list only ever applies to the non-source ones. */
  @Prop() languages: TranslationLanguage[] = [];
  @Prop() sourceCode?: string;
  /** Non-source language codes currently shown as columns. */
  @Prop() pinnedCodes: string[] = [];
  @Prop() showNotes: boolean = true;

  /** Emitted once, only when Save is clicked. */
  @Event() saveSettings: EventEmitter<TranslationsSettingsSaved>;
  @Event() closeDialog: EventEmitter<void>;

  /** Working copies — edited freely, applied only on Save. */
  @State() draftUsedTablesOnly: boolean = true;
  @State() draftPinnedCodes: string[] = [];
  @State() draftShowNotes: boolean = true;

  private dialogRef: HTMLIrDialogElement;

  @Watch('open')
  handleOpenChange(open: boolean) {
    if (open) {
      // Re-seed the draft from the live values every time it opens, so a
      // cancelled edit never leaks into the next time the dialog is used.
      this.draftUsedTablesOnly = this.usedTablesOnly;
      this.draftPinnedCodes = [...this.pinnedCodes];
      this.draftShowNotes = this.showNotes;
      this.dialogRef?.openModal();
    } else {
      this.dialogRef?.closeModal();
    }
  }

  private get pinnableLanguages(): TranslationLanguage[] {
    return this.languages.filter(language => language.code !== this.sourceCode);
  }

  private toggleDraftLanguage(code: string, pinned: boolean) {
    const current = new Set(this.draftPinnedCodes);
    if (pinned) {
      current.add(code);
    } else {
      current.delete(code);
    }
    this.draftPinnedCodes = [...current];
  }

  private handleSave = () => {
    this.saveSettings.emit({ usedTablesOnly: this.draftUsedTablesOnly, pinnedCodes: this.draftPinnedCodes, showNotes: this.draftShowNotes });
  };

  private renderUsedTablesSection() {
    return (
      <section class="settings-dialog__section">
        <wa-checkbox
          defaultChecked={this.draftUsedTablesOnly}
          checked={this.draftUsedTablesOnly}
          onchange={(e: Event) => (this.draftUsedTablesOnly = (e.target as HTMLInputElement).checked)}
        >
          Only show tables used in the app
        </wa-checkbox>
      </section>
    );
  }

  private renderLanguagesSection() {
    const languages = this.pinnableLanguages;
    if (languages.length === 0) {
      return null;
    }
    const pinned = new Set(this.draftPinnedCodes);
    return (
      <section class="settings-dialog__section">
        <p class="settings-dialog__section-hint">Pin the languages you want shown in the table.</p>
        <ul class="settings-dialog__language-list">
          {languages.map(language => (
            <li key={language.code} class="settings-dialog__language-item">
              <wa-checkbox
                defaultChecked={pinned.has(language.code)}
                checked={pinned.has(language.code)}
                onchange={(e: Event) => this.toggleDraftLanguage(language.code, (e.target as HTMLInputElement).checked)}
              >
                {language.name} <span class="settings-dialog__language-code">({language.code.toUpperCase()})</span>
              </wa-checkbox>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  private renderNotesSection() {
    return (
      <section class="settings-dialog__section">
        <wa-checkbox defaultChecked={this.draftShowNotes} checked={this.draftShowNotes} onchange={(e: Event) => (this.draftShowNotes = (e.target as HTMLInputElement).checked)}>
          Show the notes column
        </wa-checkbox>
      </section>
    );
  }

  render() {
    return (
      <ir-dialog label="Table settings" ref={el => (this.dialogRef = el)} onIrDialogHide={() => this.closeDialog.emit()}>
        <div class="settings-dialog__body">
          {this.renderUsedTablesSection()}
          {this.renderLanguagesSection()}
          {this.renderNotesSection()}
        </div>

        <div slot="footer" class="ir-dialog__footer">
          <ir-custom-button appearance="filled" size="m" variant="neutral" onClickHandler={() => this.closeDialog.emit()}>
            Cancel
          </ir-custom-button>
          <ir-custom-button appearance="accent" size="m" variant="brand" onClickHandler={this.handleSave}>
            Save
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
