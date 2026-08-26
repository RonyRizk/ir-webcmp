import { Component, Event, EventEmitter, Fragment, Prop, State, Watch, h } from '@stencil/core';
import { TranslationEntry, TranslationLanguage } from '../types';
import { completionFor } from '../utils';

@Component({
  tag: 'ir-translations-language-dialog',
  styleUrl: 'ir-translations-language-dialog.css',
  scoped: true,
})
export class IrTranslationsLanguageDialog {
  @Prop() open: boolean = false;
  @Prop() languages: TranslationLanguage[] = [];
  /** Every language this property exposes and Setup can persist — the picker offers whichever of these aren't already shown. */
  @Prop() catalog: TranslationLanguage[] = [];
  /** Every entry across every table, used to report per-language coverage. */
  @Prop() entries: TranslationEntry[] = [];

  @Event() addLanguage: EventEmitter<TranslationLanguage>;
  /** Hides a language from this manager's view. Every CODE_VALUE_* column always exists in Setup, so nothing is deleted. */
  @Event() removeLanguage: EventEmitter<string>;
  @Event() setSourceLanguage: EventEmitter<string>;
  @Event() closeDialog: EventEmitter<void>;

  @State() pendingCode: string = '';

  private dialogRef: HTMLIrDialogElement;

  @Watch('open')
  handleOpenChange(open: boolean) {
    if (open) {
      this.pendingCode = '';
      this.dialogRef?.openModal();
    } else {
      this.dialogRef?.closeModal();
    }
  }

  private get availableLanguages(): TranslationLanguage[] {
    return this.catalog.filter(language => !this.languages.some(shown => shown.code === language.code));
  }

  private handleAdd = () => {
    const language = this.catalog.find(item => item.code === this.pendingCode);
    if (!language) {
      return;
    }
    this.addLanguage.emit({ code: language.code, name: language.name });
    this.pendingCode = '';
  };

  private renderLanguageRow(language: TranslationLanguage) {
    const percent = completionFor(this.entries, language.code);
    const isSource = !!language.isSource;

    return (
      <li key={language.code} class="language-dialog__item">
        <span class="language-dialog__code">{language.code.toUpperCase()}</span>
        <span class="language-dialog__name">
          {language.name}
          {isSource && <span class="language-dialog__source-tag">Source</span>}
        </span>
        <span class="language-dialog__coverage">
          <wa-progress-bar class="language-dialog__bar" value={percent} label={`${language.name} coverage`}></wa-progress-bar>
          <span class="language-dialog__percent">{percent}%</span>
        </span>
        <wa-dropdown
          onwa-select={(e: CustomEvent<any>) => {
            if (e.detail.item.value === 'source') {
              this.setSourceLanguage.emit(language.code);
            } else if (e.detail.item.value === 'remove') {
              this.removeLanguage.emit(language.code);
            }
          }}
        >
          <ir-custom-button slot="trigger" appearance="plain" variant="neutral" iconBtn>
            <wa-icon name="ellipsis" label={`Actions for ${language.name}`}></wa-icon>
          </ir-custom-button>
          <wa-dropdown-item value="source" disabled={isSource}>
            <wa-icon slot="icon" name="star"></wa-icon>
            Set as source
          </wa-dropdown-item>
          <wa-dropdown-item value="remove" disabled={isSource}>
            <wa-icon slot="icon" name="eye-slash"></wa-icon>
            Hide from view
          </wa-dropdown-item>
        </wa-dropdown>
      </li>
    );
  }

  render() {
    const availableLanguages = this.availableLanguages;

    return (
      <ir-dialog label="Languages" ref={el => (this.dialogRef = el)} onIrDialogHide={() => this.closeDialog.emit()}>
        <div class="language-dialog__body">
          {this.languages.length === 0 ? (
            <ir-empty-state message="No languages shown. Add one below."></ir-empty-state>
          ) : (
            <ul class="language-dialog__list">{this.languages.map(language => this.renderLanguageRow(language))}</ul>
          )}

          <div class="language-dialog__add">
            {availableLanguages.length === 0 ? (
              <p class="language-dialog__hint">All exposed languages are shown.</p>
            ) : (
              <Fragment>
                <h3 class="language-dialog__add-title">Show a language</h3>
                <div class="language-dialog__add-row">
                  <wa-select
                    label="Language"
                    size="s"
                    class="language-dialog__select"
                    value={this.pendingCode}
                    onchange={(e: Event) => (this.pendingCode = (e.target as HTMLSelectElement).value)}
                  >
                    {availableLanguages.map(language => (
                      <wa-option key={language.code} value={language.code}>
                        {language.name} ({language.code.toUpperCase()})
                      </wa-option>
                    ))}
                  </wa-select>
                  <ir-custom-button appearance="filled" variant="brand" disabled={!this.pendingCode} onClickHandler={this.handleAdd}>
                    Add
                  </ir-custom-button>
                </div>
              </Fragment>
            )}
          </div>
        </div>

        <div slot="footer" class="language-dialog__footer">
          <ir-custom-button appearance="filled" variant="neutral" onClickHandler={() => this.closeDialog.emit()}>
            Done
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
