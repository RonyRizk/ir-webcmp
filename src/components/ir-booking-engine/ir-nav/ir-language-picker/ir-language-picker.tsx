import { ICurrency, IExposedLanguages } from '@/models/common';
import app_store, { changeLocale, onAppDataChange, updateUserPreference } from '@/stores/app.store';
import { cn, matchLocale } from '@/utils/utils';
import { Component, h, Event, EventEmitter, Prop, State } from '@stencil/core';

@Component({
  tag: 'ir-language-picker',
  styleUrl: 'ir-language-picker.css',
  shadow: true,
})
export class IrLanguagePicker {
  @Prop() currencies: ICurrency[];
  @Prop() languages: IExposedLanguages[];

  @State() selectedOptions: {
    currency: ICurrency;
    language: IExposedLanguages;
  };

  @Event() closeDialog: EventEmitter<null>;
  @Event() resetBooking: EventEmitter<null>;

  langEl: HTMLButtonElement[] = [];
  selectedIndex: number = 0;

  async componentWillLoad() {
    await this.init();
    onAppDataChange('userPreferences', newValue => {
      this.selectedOptions = { language: this.languages.find(l => l.code === newValue.language_id), currency: this.currencies.find(l => l.code === newValue.currency_id) };
    });
  }
  componentDidLoad() {
    const index = this.languages.findIndex(l => l.code === this.selectedOptions.language.code);
    if (index !== -1) {
      this.langEl[index]?.focus();
    }
  }
  async init() {
    if (this.languages && this.currencies) {
      this.selectedOptions = {
        language: this.languages[0],
        currency: this.currencies[0],
      };
    }
  }

  handleLanguageChange(id: string) {
    this.selectedOptions = { ...this.selectedOptions, language: this.languages.find(l => l.code === id) };
  }
  handleCurrencyChange(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const id = e.detail;
    this.selectedOptions = { ...this.selectedOptions, currency: this.currencies.find(l => l.code === id) };
  }
  handleConfirm(e: MouseEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    changeLocale(this.selectedOptions.language.direction, matchLocale(this.selectedOptions.language.code));
    updateUserPreference({
      currency_id: this.selectedOptions.currency.code,
      language_id: this.selectedOptions.language.code,
    });
    localStorage.setItem(
      'user_prefernce',
      JSON.stringify({
        currency_id: this.selectedOptions.currency.code,
        language_id: this.selectedOptions.language.code,
        direction: this.selectedOptions.language.direction,
      }),
    );
    if (app_store.currentPage === 'checkout') {
      this.resetBooking.emit(null);
    }
    this.closeDialog.emit(null);
  }
  handleKeyDown(e: KeyboardEvent) {
    const index = this.selectedIndex;
    const lastIndex = this.languages.length - 1;
    let itemsPerRow = 4;
    if (window.innerWidth < 640) {
      itemsPerRow = 3;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = index === lastIndex ? 0 : index + 1;
      this.selectedIndex = nextIndex;
      this.langEl[nextIndex].focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = index === 0 ? lastIndex : index - 1;
      this.selectedIndex = prevIndex;
      this.langEl[prevIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = index < itemsPerRow ? lastIndex - (itemsPerRow - 1 - index) : index - itemsPerRow;
      if (prevIndex >= 0 && prevIndex <= lastIndex) {
        this.selectedIndex = prevIndex;
        this.langEl[prevIndex].focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = index + itemsPerRow > lastIndex ? (index + itemsPerRow) % itemsPerRow : index + itemsPerRow;
      if (nextIndex >= 0 && nextIndex <= lastIndex) {
        this.selectedIndex = nextIndex;
        this.langEl[nextIndex].focus();
      }
    }
  }

  render() {
    return (
      <div class="p-4 sm:px-6">
        <p class="title mb-5">Display settings</p>
        <div
          role="radiogroup"
          aria-required="false"
          aria-label="booking engine language"
          onKeyDown={e => this.handleKeyDown(e)}
          class="mb-6 grid grid-cols-3 gap-2.5 outline-none sm:grid-cols-4"
          tabIndex={0}
        >
          {this.languages.map((language, i) => (
            <button
              ref={el => (this.langEl[i] = el)}
              type="button"
              role="radio"
              tabIndex={0}
              value={language.code}
              aria-labelledby={language.description}
              aria-checked={this.selectedOptions?.language.code === language.code ? 'true' : 'false'}
              onClick={() => this.handleLanguageChange(language.code)}
              class={cn('flex items-center gap-3 rounded-sm px-2 py-2 pr-4 transition-colors duration-300 ease-in-out hover:bg-[hsla(var(--brand-100),13%)]', {
                'bg-[hsla(var(--brand-100),8%)]': this.selectedOptions?.language.code === language.code,
              })}
            >
              <img src={language['flag']} alt={language.code} class={'size-4 rounded-full'}></img>
              <span> {language.description}</span>

              <input
                type="radio"
                aria-hidden="true"
                tabindex="-1"
                checked={this.selectedOptions?.language.code === language.code ? true : false}
                value={language.code}
                class={'hidden'}
              ></input>
            </button>
          ))}
        </div>

        <ir-select
          variant="double-line"
          value={app_store.userPreferences.currency_id}
          onValueChange={this.handleCurrencyChange.bind(this)}
          label="Currency"
          select_id="currency_selector"
          data={this.currencies.map(currency => ({
            id: currency.code,
            value: `${currency.code} ${currency.symbol}`,
          }))}
        ></ir-select>
        <div class="mt-8 flex  w-full flex-col-reverse justify-end gap-4 sm:flex-row">
          <ir-button onButtonClick={() => this.closeDialog.emit(null)} size="md" label="Cancel" variants="outline" class="w-full sm:w-fit"></ir-button>
          <ir-button size="md" label="Confirm" class="w-full sm:w-fit" onClick={this.handleConfirm.bind(this)}></ir-button>
        </div>
      </div>
    );
  }
}
