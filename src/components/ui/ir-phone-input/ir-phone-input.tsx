import { Component, h, State, Element, Fragment, Event, EventEmitter, Prop } from '@stencil/core';
import { createPopper } from '@popperjs/core';
import localization_store from '@/stores/app.store';
import { CommonService } from '@/services/api/common.service';
import app_store from '@/stores/app.store';
import { ICountry } from '@/models/common';
import { updateUserFormData } from '@/stores/checkout.store';

@Component({
  tag: 'ir-phone-input',
  styleUrl: 'ir-phone-input.css',
  shadow: true,
})
export class IrPhoneInput {
  @Prop() error: boolean;
  @Prop() mobile_number: string = '';

  @State() isVisible: boolean = false;
  @State() currentHighlightedIndex: number = -1;
  @State() selectedItem: ICountry;
  @State() filteredCountries: ICountry[] = [];
  @State() inputValue: string = '';

  @Element() el: HTMLElement;

  private popoverInstance = null;
  private triggerElement: HTMLElement;
  private contentElement: HTMLElement;
  private debounceTimeout: NodeJS.Timeout;

  private commonService = new CommonService();

  @Event() textChange: EventEmitter<{ phone_prefix: string; mobile: string }>;

  private countries: ICountry[] = [];
  searchInput: HTMLInputElement;
  phoneInput: HTMLInputElement;

  async componentWillLoad() {
    this.commonService.setToken(app_store.app_data.token);
    await this.initializeCountries();
    this.inputValue = this.mobile_number;
  }
  componentDidLoad() {
    this.initializePopover();
  }
  async initializeCountries() {
    const [user_country, countries] = await Promise.all([this.commonService.getUserDefaultCountry(), await this.commonService.getCountries(app_store.userPreferences.language_id)]);
    this.countries = countries;
    if (user_country) {
      const selectedCountry = this.countries.find(c => c.id === user_country.COUNTRY_ID);
      if (selectedCountry) {
        updateUserFormData('country_id', selectedCountry.id);
        this.selectedItem = selectedCountry;
        this.textChange.emit({ phone_prefix: this.selectedItem.phone_prefix, mobile: '' });
      }
    }
    this.filteredCountries = this.countries;
  }
  initializePopover() {
    if (this.triggerElement && this.contentElement) {
      this.popoverInstance = createPopper(this.triggerElement, this.contentElement, {
        placement: localization_store.dir === 'LTR' ? 'bottom-start' : 'bottom-end',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 3],
            },
          },
        ],
      });
    }
  }
  handleOutsideClick = (event: MouseEvent) => {
    const outsideClick = typeof event.composedPath === 'function' && !event.composedPath().includes(this.el);
    if (outsideClick && this.isVisible) {
      this.toggleVisibility();
    }
  };
  handleKeyboardPress = (e: KeyboardEvent) => {
    if (!this.isVisible) {
      return;
    }
    if (e.key === 'Escape') {
      this.toggleVisibility();
    }
    return;
  };
  async toggleVisibility() {
    this.isVisible = !this.isVisible;
    this.filteredCountries = this.countries;
    if (this.isVisible && this.popoverInstance) {
      setTimeout(() => this.searchInput.focus(), 20);
      const currentDir = localization_store.dir.toLowerCase() || 'ltr';
      if (
        (this.popoverInstance.state.options.placement === 'bottom-start' && currentDir === 'rtl') ||
        (this.popoverInstance.state.options.placement === 'bottom-end' && currentDir === 'ltr')
      ) {
        let newPlacement = this.popoverInstance.state.options.placement;
        if (currentDir === 'rtl') {
          newPlacement = newPlacement.replace('bottom-start', 'bottom-end');
        } else {
          newPlacement = newPlacement.replace('bottom-end', 'bottom-start');
        }
        this.popoverInstance
          .setOptions({
            placement: newPlacement,
          })
          .then(() => {
            this.popoverInstance.update();
          });
      } else {
        this.popoverInstance.update();
      }
    }
    if (this.isVisible) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('click', this.handleOutsideClick, true);
      document.addEventListener('keydown', this.handleKeyboardPress, true);
    } else {
      document.body.style.overflow = 'visible';
      document.removeEventListener('click', this.handleOutsideClick, true);
      document.removeEventListener('keydown', this.handleKeyboardPress, true);
    }
  }
  disconnectedCallback() {
    document.removeEventListener('click', this.handleOutsideClick, true);
    document.removeEventListener('keydown', this.handleKeyboardPress, true);
    if (this.popoverInstance) {
      this.popoverInstance.destroy();
    }
  }
  synchroniseSuggestionsBox() {
    const item = this.el.shadowRoot?.querySelector(`li:nth-of-type(${this.currentHighlightedIndex + 1})`) as HTMLLIElement;
    item?.scrollIntoView({ block: 'center' });
  }
  handleAutoCompleteKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.currentHighlightedIndex = (this.currentHighlightedIndex + 1 + this.filteredCountries.length) % this.filteredCountries.length;
      this.synchroniseSuggestionsBox();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.currentHighlightedIndex = (this.currentHighlightedIndex - 1 + this.filteredCountries.length) % this.filteredCountries.length;
      this.synchroniseSuggestionsBox();
    } else if (e.key === 'Enter') {
      this.selectItem(this.currentHighlightedIndex);
    }
  }
  selectItem(index: number) {
    this.currentHighlightedIndex = index;
    this.selectedItem = this.filteredCountries[index];
    this.filteredCountries = this.countries;
    this.phoneInput.focus();
    this.toggleVisibility();
  }
  filterData(str: string) {
    if (str === '') {
      return (this.filteredCountries = [...this.countries]);
    }
    this.filteredCountries = [...this.countries.filter(d => d.name.toLowerCase().startsWith(str.trim()))];
  }
  handleFilterInputChange(e: InputEvent) {
    e.stopPropagation();
    const value = (e.target as HTMLInputElement).value;
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(() => {
      this.filterData(value);
    }, 300);
  }
  handleInputChange(e: InputEvent) {
    let inputElement = e.target as HTMLInputElement;
    let inputValue = inputElement.value;
    inputValue = inputValue.replace(/[^+\d]+/g, '');
    inputElement.value = inputValue;
    this.inputValue = inputValue;
    this.textChange.emit({ phone_prefix: this.selectedItem?.phone_prefix, mobile: this.inputValue });
  }
  render() {
    return (
      <div ref={el => (this.triggerElement = el)} class="w-full bg-white">
        <div class={`input-trigger ${this.error ? 'error' : ''}  rounded-md border text-[var(--gray-600)] border-[var(--gray-300,#D0D5DD)] w-full bg-white flex  text-sm`}>
          <div class={'flex flex-col px-4'}>
            <label htmlFor="country_picker">Country</label>
            <div
              id="country_picker"
              onClick={() => {
                this.toggleVisibility();
              }}
              class="flex items-center gap-2  input-subtrigger"
            >
              {this.selectedItem ? (
                <Fragment>
                  <img src={this.selectedItem?.flag} alt={this.selectedItem?.name} class="h-4 rounded" />
                  <span>{this.selectedItem?.phone_prefix}</span>
                </Fragment>
              ) : (
                <span>Select</span>
              )}

              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.35753 11.9939 7.64245 11.9939 7.81819 11.8182L10.0682 9.56819Z"
                  fill="currentColor"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </div>
          </div>
          <div class={'flex flex-col flex-1'}>
            <label htmlFor="phone_number">Mobile number</label>
            <input type="phone" ref={el => (this.phoneInput = el)} onInput={e => this.handleInputChange(e)} id="phone_number" value={this.inputValue} class="input-subtrigger" />
          </div>
        </div>

        <div ref={el => (this.contentElement = el)} class={'z-50'}>
          {this.isVisible && (
            <ul class="dropdown-content w-full">
              <li class="filter-container">
                <ir-icons name="search" svgClassName="h-4 w-4"></ir-icons>
                <input
                  placeholder="Search..."
                  ref={el => (this.searchInput = el)}
                  type="text"
                  onInput={this.handleFilterInputChange.bind(this)}
                  class="filter-input"
                  onKeyDown={this.handleAutoCompleteKeyDown.bind(this)}
                />
              </li>
              {this.filteredCountries.map((value, index) => (
                <li
                  data-state={this.currentHighlightedIndex === index ? 'checked' : 'unchecked'}
                  data-highlighted={this.currentHighlightedIndex === index ? 'true' : 'false'}
                  class="combobox-item"
                  key={index}
                  role="option"
                  // aria-disabled={item.disabled ? 'true' : 'false'}
                  // aria-selected={this.selectedItemName === item.item ? 'true' : 'false'}
                  onClick={() => {
                    this.selectItem(index);
                    // this.disableKeyboardPriority();
                  }}
                  onMouseOver={() => {
                    this.currentHighlightedIndex = index;
                  }}
                >
                  <div class="flex items-center gap-2">
                    <img src={value.flag} alt={value.name} class="h-5 rounded" />
                    <span>{value.name}</span>
                    <span>({value.phone_prefix})</span>
                  </div>
                  {this.selectedItem && this.selectedItem.id === value.id && <ir-icons name="check" svgClassName="size-4"></ir-icons>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
}
