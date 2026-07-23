import { ClickOutside } from '@/decorators/ClickOutside';
import { MaskProp, NativeWaInput } from '../ir-input/ir-input';
import { Component, Element, Event, EventEmitter, Host, Method, Prop, State, Watch, h } from '@stencil/core';
import WaPopup from '@awesome.me/webawesome/dist/components/popup/popup';
import { createSlotManager } from '@/utils/slot';

type AutocompleteOptionElement = HTMLIrAutocompleteOptionElement & {
  current: boolean;
  selected: boolean;
  disabled: boolean;
  value?: string;
  label?: string;
};

type AutocompletePopupElement = WaPopup;

@Component({
  tag: 'ir-autocomplete',
  styleUrl: 'ir-autocomplete.css',
  shadow: true,
})
export class IrAutocomplete {
  @Element() el: HTMLIrAutocompleteElement;

  /**
   * Emits `combobox-change` even when the selected value does not change.
   *
   * @default true
   */
  @Prop() emitOnSameValue: boolean = true;

  /** Whether the autocomplete dropdown is open. */
  @Prop({ reflect: true, mutable: true }) open: boolean = false;

  /** Placement of the autocomplete dropdown relative to the input. */
  @Prop({ reflect: true }) placement: AutocompletePopupElement['placement'] = 'bottom';

  /** Name attribute forwarded to the underlying input element. */
  @Prop() name: string;

  /** The value of the input. Not reflected to the host attribute — reflection would rewrite the DOM on every keystroke. */
  @Prop({ mutable: true }) value: string = '';

  /**
   * The type of input. Works the same as a native `<input>` element, but only a subset of types are supported. Defaults
   * to `text`.
   */
  @Prop({ reflect: true }) type: NativeWaInput['type'] = 'text';

  /** The default value of the form control. Primarily used for resetting the form control. */
  @Prop({ reflect: true }) defaultValue: NativeWaInput['defaultValue'];

  /** The input's size. */
  @Prop({ reflect: true }) size: NativeWaInput['size'] = 's';

  /** The input's visual appearance. */
  @Prop({ reflect: true }) appearance: NativeWaInput['appearance'];

  /** Draws a pill-style input with rounded edges. */
  @Prop({ reflect: true }) pill: NativeWaInput['pill'];

  @Prop({ mutable: true }) returnMaskedValue: boolean = false;

  /** The input's label. If you need to display HTML, use the `label` slot instead. */
  @Prop({ reflect: true }) label: NativeWaInput['label'];

  /** The input's hint. If you need to display HTML, use the `hint` slot instead. */
  @Prop({ reflect: true }) hint: NativeWaInput['hint'];

  /** Adds a clear button when the input is not empty. */
  @Prop({ reflect: true }) withClear: NativeWaInput['withClear'];

  /** Placeholder text to show as a hint when the input is empty. */
  @Prop({ reflect: true }) placeholder: NativeWaInput['placeholder'];

  /** Makes the input readonly. */
  @Prop({ reflect: true }) readonly: NativeWaInput['readonly'];

  /** Adds a button to toggle the password's visibility. Only applies to password types. */
  @Prop({ reflect: true }) passwordToggle: NativeWaInput['passwordToggle'];

  /** Determines whether or not the password is currently visible. Only applies to password input types. */
  @Prop({ reflect: true }) passwordVisible: NativeWaInput['passwordVisible'];

  /** Hides the browser's built-in increment/decrement spin buttons for number inputs. */
  @Prop({ reflect: true }) withoutSpinButtons: NativeWaInput['withoutSpinButtons'];

  /**
   * Enables selection of multiple options.
   * When `true`, users can select more than one option at a time.
   * Defaults to `false`.
   */
  @Prop() multiple: boolean = false;

  /**
   * By default, form controls are associated with the nearest containing `<form>` element. This attribute allows you
   * to place the form control outside of a form and associate it with the form that has this `id`. The form must be in
   * the same document or shadow root for this to work.
   */
  @Prop({ reflect: true }) form: NativeWaInput['form'];

  /** Makes the input a required field. */
  @Prop({ reflect: true }) required: NativeWaInput['required'];

  /** A regular expression pattern to validate input against. */
  @Prop() pattern: NativeWaInput['pattern'];

  /** The minimum length of input that will be considered valid. */
  @Prop() minlength: NativeWaInput['minlength'];

  /** The maximum length of input that will be considered valid. */
  @Prop() maxlength: NativeWaInput['maxlength'];

  /** The input's minimum value. Only applies to date and number input types. */
  @Prop() min: NativeWaInput['min'];

  /** The input's maximum value. Only applies to date and number input types. */
  @Prop() max: NativeWaInput['max'];

  /**
   * Specifies the granularity that the value must adhere to, or the special value `any` which means no stepping is
   * implied, allowing any numeric value. Only applies to date and number input types.
   */
  @Prop() step: NativeWaInput['step'];

  /** Controls whether and how text input is automatically capitalized as it is entered by the user. */
  @Prop() autocapitalize: NativeWaInput['autocapitalize'];

  /** Indicates whether the browser's autocorrect feature is on or off. */
  @Prop() autocorrect: NativeWaInput['autocorrect'];

  /**
   * Specifies what permission the browser has to provide assistance in filling out form field values. Refer to
   * [this page on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete) for available values.
   */
  @Prop() autocomplete: NativeWaInput['autocomplete'] = 'off';

  /** Indicates that the input should receive focus on page load. */
  @Prop() autofocus: NativeWaInput['autofocus'];

  /** Used to customize the label or icon of the Enter key on virtual keyboards. */
  @Prop() enterkeyhint: NativeWaInput['enterkeyhint'];

  /** Enables spell checking on the input. */
  @Prop() spellcheck: NativeWaInput['spellcheck'];

  /**
   * Tells the browser what type of data will be entered by the user, allowing it to display the appropriate virtual
   * keyboard on supportive devices.
   */
  @Prop() inputmode: NativeWaInput['inputmode'];

  /**
   * Used for SSR. Will determine if the SSRed component will have the label slot rendered on initial paint.
   */
  @Prop() withLabel: NativeWaInput['withLabel'];

  /**
   * Used for SSR. Will determine if the SSRed component will have the hint slot rendered on initial paint.
   */
  @Prop() withHint: NativeWaInput['withHint'];

  /** Mask for the input field (optional) */
  @Prop() mask: MaskProp;

  /** Disables the input. */
  @Prop({ reflect: true }) disabled: boolean;

  /**
   * When `true`, renders a chevron button on the trailing edge of the input
   * that toggles the dropdown open and closed — matching the visual pattern of
   * `<wa-select>`.
   *
   * Set to `true` when the autocomplete is used as a pure select (fixed option
   * list, no free-text filtering) so users have a clear affordance to open the
   * listbox. Leave at the default `false` for search-as-you-type inputs where
   * the dropdown opens automatically as the user types.
   */
  @Prop({ reflect: true }) withExpandIcon: boolean = false;

  /**
   * Custom CSS classes applied to the inner `<ir-input>` element.
   *
   * You can also target the exposed parts `::part(input)` and `::part(base)`
   * for deeper styling of the native input and container.
   */
  @Prop() inputClass: string;

  /**
   * In `multiple` mode, the maximum number of selected-option tags shown inside the input.
   * Any further selections collapse into a single "+N" overflow tag. Set to `0` to always
   * show every tag.
   */
  @Prop() maxTagsVisible: number = 3;

  @State() private options: AutocompleteOptionElement[] = [];
  @State() private slotStateVersion = 0;
  @State() private selectedOptions: AutocompleteOptionElement[] = [];

  @Event({ bubbles: true, composed: true, eventName: 'text-change' }) textChange: EventEmitter<string>;
  @Event({ bubbles: true, composed: true, eventName: 'combobox-change' }) comboboxChange: EventEmitter<string | string[]>;

  private currentOption?: AutocompleteOptionElement;
  // The active typed query; null means no filtering (all options visible).
  private filterQuery: string | null = null;
  private listboxRef?: HTMLElement;
  private inputRef?: HTMLIrInputElement;
  // Native <input> inside ir-input → wa-input; combobox ARIA lives here because
  // string IDREFs (aria-activedescendant/aria-controls) cannot resolve across shadow roots.
  private nativeInput?: HTMLInputElement;
  // Per-option search metadata, built lazily. Reading textContent walks the option's whole
  // subtree, so it must happen once per option — not on every keystroke.
  private optionMeta = new WeakMap<AutocompleteOptionElement, { label: string; value: string; haystack: string }>();
  private optionContentObserver?: MutationObserver;
  private readonly SLOT_NAMES = ['label', 'start', 'end', 'clear-icon', 'hint'] as const;

  private slotManager = createSlotManager(
    null as any, // Will be set in componentWillLoad
    this.SLOT_NAMES,
    () => {
      // Trigger re-render when slot state changes
      this.slotStateVersion++;
    },
  );

  componentWillLoad() {
    this.slotManager = createSlotManager(this.el as any, this.SLOT_NAMES, () => {
      this.slotStateVersion++;
    });
    this.slotManager.initialize();
    this.updateOptionsFromSlot();
    if (!this.multiple) {
      this.syncSelectedFromValue(this.value);
    }
    this.refreshSelectedOptions();
  }

  componentDidLoad() {
    this.slotManager.setupListeners();
    this.listboxRef?.addEventListener('click', this.handleOptionClick);
    this.setupInputAria();
    this.observeOptionContent();
  }

  disconnectedCallback() {
    this.slotManager.destroy();
    this.listboxRef?.removeEventListener('click', this.handleOptionClick);
    this.optionContentObserver?.disconnect();
  }

  /**
   * Slot changes rebuild the option list, but consumers can also rewrite an option's
   * label/value or inner text in place without a slotchange firing. Drop the metadata
   * cache when that happens; it rebuilds lazily on the next access.
   */
  private observeOptionContent() {
    this.optionContentObserver = new MutationObserver(() => {
      this.optionMeta = new WeakMap();
    });
    this.optionContentObserver.observe(this.el, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['label', 'value'],
    });
  }

  @Method()
  async show() {
    if (this.disabled) return;
    this.open = true;
  }

  @Method()
  async focusInput() {
    if (this.disabled) return;
    this.inputRef?.focusInput();
  }

  @ClickOutside()
  @Method()
  async hide() {
    this.open = false;
    // Reset the filter so the full option list shows the next time the dropdown opens.
    this.clearFilter();
  }

  /**
   * Applies the WAI-ARIA combobox pattern to the native input. String IDREFs like
   * `aria-activedescendant` are dangling across shadow roots, so the active option and
   * listbox are wired through ARIA element reflection where supported — never both
   * mechanisms, since setting the IDL property resets the string attribute per spec.
   */
  private async setupInputAria() {
    const input = await this.inputRef?.getNativeInput();
    if (!input || !input.isConnected) return;
    this.nativeInput = input;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-haspopup', 'listbox');
    input.setAttribute('aria-expanded', this.open ? 'true' : 'false');
    if ('ariaControlsElements' in input && this.listboxRef) {
      (input as any).ariaControlsElements = [this.listboxRef];
    }
    this.syncActiveDescendant();
  }

  private syncAriaExpanded() {
    this.nativeInput?.setAttribute('aria-expanded', this.open ? 'true' : 'false');
  }

  private syncActiveDescendant() {
    const input = this.nativeInput;
    if (!input || !('ariaActiveDescendantElement' in input)) return;
    (input as any).ariaActiveDescendantElement = this.open && this.currentOption ? this.currentOption : null;
  }

  @Watch('open')
  handleOpenChange(newValue: boolean) {
    if (!this.listboxRef) return;

    this.listboxRef.hidden = !newValue;
    this.syncAriaExpanded();

    if (!newValue) {
      this.clearCurrentOption();
      return;
    }

    this.ensureCurrentOption();
    if (this.currentOption) {
      requestAnimationFrame(() => {
        if (this.currentOption) {
          this.scrollIntoView(this.currentOption, this.listboxRef!, 'vertical', 'auto');
        }
      });
    }
  }
  private getOffset(element: HTMLElement, parent: HTMLElement) {
    return {
      top: Math.round(element.getBoundingClientRect().top - parent.getBoundingClientRect().top),
      left: Math.round(element.getBoundingClientRect().left - parent.getBoundingClientRect().left),
    };
  }
  private scrollIntoView(element: HTMLElement, container: HTMLElement, direction: 'horizontal' | 'vertical' | 'both' = 'vertical', behavior: 'smooth' | 'auto' = 'smooth') {
    const offset = this.getOffset(element, container);
    const offsetTop = offset.top + container.scrollTop;
    const offsetLeft = offset.left + container.scrollLeft;
    const minX = container.scrollLeft;
    const maxX = container.scrollLeft + container.offsetWidth;
    const minY = container.scrollTop;
    const maxY = container.scrollTop + container.offsetHeight;

    if (direction === 'horizontal' || direction === 'both') {
      if (offsetLeft < minX) {
        container.scrollTo({ left: offsetLeft, behavior });
      } else if (offsetLeft + element.clientWidth > maxX) {
        container.scrollTo({ left: offsetLeft - container.offsetWidth + element.clientWidth, behavior });
      }
    }

    if (direction === 'vertical' || direction === 'both') {
      if (offsetTop < minY) {
        container.scrollTo({ top: offsetTop, behavior });
      } else if (offsetTop + element.clientHeight > maxY) {
        container.scrollTo({ top: offsetTop - container.offsetHeight + element.clientHeight, behavior });
      }
    }
  }
  @Watch('value')
  handleValueChange(newValue: string) {
    if (this.multiple) return;
    this.syncSelectedFromValue(newValue);
  }

  private refreshSelectedOptions() {
    this.selectedOptions = this.getAllOptions().filter(option => option.selected);
  }

  private emitChange() {
    if (this.multiple) {
      this.comboboxChange.emit(this.selectedOptions.map(option => this.getOptionValue(option)));
    }
  }

  private getAllOptions(): AutocompleteOptionElement[] {
    return this.options;
  }

  private getVisibleOptions(): AutocompleteOptionElement[] {
    return this.options.filter(option => !option.hidden);
  }

  private getOptionMeta(option: AutocompleteOptionElement) {
    let meta = this.optionMeta.get(option);
    if (!meta) {
      const label = option.label || (option.textContent?.trim() ?? '');
      const value = option.value ?? label;
      meta = { label, value, haystack: `${label} ${value} ${option.textContent ?? ''}`.toLowerCase() };
      this.optionMeta.set(option, meta);
    }
    return meta;
  }

  private applyFilter() {
    // Normalize once per pass, not once per option.
    const query = this.filterQuery?.trim().toLowerCase() || null;
    this.getAllOptions().forEach(option => {
      const shouldHide = query !== null && !this.getOptionMeta(option).haystack.includes(query);
      if (option.hidden !== shouldHide) {
        option.hidden = shouldHide;
      }
    });

    if (this.currentOption?.hidden) {
      this.clearCurrentOption();
    }
    if (this.open) {
      this.ensureCurrentOption();
    }
  }

  private clearFilter() {
    if (this.filterQuery === null) return;
    this.filterQuery = null;
    this.getAllOptions().forEach(option => {
      if (option.hidden) {
        option.hidden = false;
      }
    });
  }

  private updateOptionsFromSlot(slotEl?: HTMLSlotElement) {
    const slot = slotEl ?? (this.listboxRef?.querySelector('slot') as HTMLSlotElement | null);
    if (!slot) {
      this.options = Array.from(this.el.querySelectorAll('ir-autocomplete-option')) as AutocompleteOptionElement[];
      return;
    }

    const assigned = slot.assignedElements({ flatten: true }) as Element[];
    this.options = assigned.filter(el => el.tagName.toLowerCase() === 'ir-autocomplete-option') as AutocompleteOptionElement[];
    // Options are never tab stops (combobox pattern); set once at registration
    // instead of re-writing tabIndex on every keystroke or arrow key.
    this.options.forEach(option => (option.tabIndex = -1));
  }

  /**
   * Reassigns the currentOption pointer, clearing the highlight flag on the element it
   * previously pointed at. Keeps highlight updates O(1) instead of sweeping all options.
   */
  private setCurrentPointer(option?: AutocompleteOptionElement) {
    if (this.currentOption && this.currentOption !== option) {
      this.currentOption.current = false;
    }
    this.currentOption = option;
  }

  private clearCurrentOption() {
    this.setCurrentPointer(undefined);
    this.syncActiveDescendant();
  }
  private ensureCurrentOption() {
    const allOptions = this.getVisibleOptions().filter(option => !option.disabled);
    if (!allOptions.length) {
      this.clearCurrentOption();
      return;
    }

    const selected = allOptions.find(option => option.selected);
    const nextOption = selected ?? this.currentOption ?? allOptions[0];
    if (nextOption) {
      this.setCurrentOption(nextOption, { scroll: false });
    }
  }
  private setCurrentOption(option: AutocompleteOptionElement, options: { scroll?: boolean } = {}) {
    if (!option || option.disabled) return;

    // DOM focus stays on the input (combobox pattern); the highlight moves by clearing
    // the previous option and flagging the new one — two writes, regardless of list size.
    this.setCurrentPointer(option);
    option.current = true;
    this.syncActiveDescendant();

    if (options.scroll && this.listboxRef) {
      this.scrollIntoView(option, this.listboxRef, 'vertical', 'auto');
    }
  }
  private getOptionLabel(option: AutocompleteOptionElement): string {
    return this.getOptionMeta(option).label;
  }
  private getOptionValue(option: AutocompleteOptionElement): string {
    return this.getOptionMeta(option).value;
  }
  private syncSelectedFromValue(value: string) {
    let selectedOption: AutocompleteOptionElement | undefined;

    this.getAllOptions().forEach(option => {
      const meta = this.getOptionMeta(option);
      const matches = meta.value === value || meta.label === value;
      if (option.selected !== matches) {
        option.selected = matches;
      }
      if (matches) {
        selectedOption = option;
      }
    });

    if (selectedOption) {
      this.setCurrentPointer(selectedOption);
    } else if (this.currentOption) {
      const meta = this.getOptionMeta(this.currentOption);
      if (meta.value !== value && meta.label !== value) {
        this.setCurrentPointer(undefined);
      }
    }
  }

  private selectOption(option: AutocompleteOptionElement) {
    if (!option || option.disabled) return;

    if (this.multiple) {
      // Toggle selection without affecting the other options and keep the popup open.
      option.selected = !option.selected;
      this.setCurrentPointer(option);
      this.refreshSelectedOptions();

      // Clear the typed search text so the user can immediately filter for the next option.
      if (this.value !== '') {
        this.value = '';
        this.textChange.emit('');
      }
      this.clearFilter();

      this.emitChange();
      requestAnimationFrame(() => this.inputRef?.focusInput());
      return;
    }

    this.getAllOptions().forEach(el => {
      if (el.selected && el !== option) {
        el.selected = false;
      }
    });
    option.selected = true;
    this.setCurrentPointer(option);

    const emitValue = this.getOptionValue(option);
    const displayValue = this.getOptionLabel(option);
    if (this.emitOnSameValue || (!this.emitOnSameValue && emitValue !== this.value)) {
      this.value = displayValue;
      this.comboboxChange.emit(emitValue);
    }
    this.hide();
    requestAnimationFrame(() => this.inputRef?.focusInput());
  }

  private removeOption = (option: AutocompleteOptionElement) => {
    if (!option) return;
    option.selected = false;
    this.refreshSelectedOptions();
    this.emitChange();
    requestAnimationFrame(() => this.inputRef?.focusInput());
  };

  private handleOptionClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const option = target?.closest('ir-autocomplete-option') as AutocompleteOptionElement | null;
    if (!option) return;

    event.preventDefault();
    event.stopPropagation();
    this.selectOption(option);
  };

  private handleTextChange = (event: CustomEvent<string>) => {
    event.stopImmediatePropagation();
    event.stopPropagation();
    const nextValue = event.detail ?? '';
    if (nextValue === this.value) {
      if (!this.open && this.getAllOptions().length) {
        this.show();
      }
      return;
    }
    this.value = nextValue;
    this.textChange.emit(nextValue);
    this.filterQuery = nextValue;
    this.applyFilter();
    if (!this.open && this.getAllOptions().length) {
      this.show();
    }
  };

  private handleOptionsSlotChange = (event: Event) => {
    this.updateOptionsFromSlot(event.target as HTMLSlotElement);
    if (!this.multiple) {
      this.syncSelectedFromValue(this.value);
    }
    this.refreshSelectedOptions();
    // applyFilter re-runs ensureCurrentOption itself when the dropdown is open.
    this.applyFilter();
  };

  private handleKeydownChange = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.open) {
      event.preventDefault();
      event.stopPropagation();
      this.hide();
      return;
    }

    if (event.key === 'Enter') {
      if (this.open && this.currentOption) {
        event.preventDefault();
        event.stopPropagation();
        this.selectOption(this.currentOption);
      }
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      const allOptions = this.getVisibleOptions().filter(option => !option.disabled);
      if (!allOptions.length) return;

      const baseOption = this.currentOption && allOptions.includes(this.currentOption) ? this.currentOption : allOptions[0];
      const currentIndex = allOptions.indexOf(baseOption);
      let newIndex = Math.max(0, currentIndex);

      // Prevent scrolling
      event.preventDefault();

      // Open it
      if (!this.open) {
        this.show();

        // If an option is already selected, stop here because we want that one to remain highlighted when the listbox
        // opens for the first time
        if (this.currentOption || allOptions.some(option => option.selected)) {
          return;
        }
      }

      if (event.key === 'ArrowDown') {
        newIndex = currentIndex + 1;
        if (newIndex > allOptions.length - 1) newIndex = 0;
      } else if (event.key === 'ArrowUp') {
        newIndex = currentIndex - 1;
        if (newIndex < 0) newIndex = allOptions.length - 1;
      } else if (event.key === 'Home') {
        newIndex = 0;
      } else if (event.key === 'End') {
        newIndex = allOptions.length - 1;
      }

      this.setCurrentOption(allOptions[newIndex], { scroll: true });
    }
  };

  private handleClick = () => {
    if (!this.open) this.show();
  };

  private renderSelectedTags() {
    const limit = this.maxTagsVisible > 0 ? this.maxTagsVisible : this.selectedOptions.length;
    const visibleTags = this.selectedOptions.slice(0, limit);
    const overflow = this.selectedOptions.slice(limit);

    return (
      <div slot="start" class="selected-tags" part="tags">
        {visibleTags.map(option => (
          <wa-tag
            key={this.getOptionValue(option)}
            size="s"
            with-remove
            onwa-remove={(e: Event) => {
              e.stopPropagation();
              this.removeOption(option);
            }}
          >
            {this.getOptionLabel(option)}
          </wa-tag>
        ))}
        {overflow.length > 0 && (
          <wa-tag key="overflow" size="s" class="selected-tags__overflow" title={overflow.map(option => this.getOptionLabel(option)).join(', ')}>
            +{overflow.length}
          </wa-tag>
        )}
      </div>
    );
  }

  private handleExpandIconClick = (e: MouseEvent) => {
    e.stopPropagation();
    this.open ? this.hide() : this.show();
  };

  render() {
    return (
      <Host>
        <wa-popup active={this.open} flip shift sync="width" auto-size="vertical" auto-size-padding={10} placement={this.placement} exportparts="popup, arrow, hover-bridge">
          <ir-input
            slot="anchor"
            ref={el => (this.inputRef = el)}
            onKeyDown={this.handleKeydownChange}
            onText-change={this.handleTextChange}
            onClick={this.handleClick}
            name={this.name}
            value={this.value}
            type={this.type}
            defaultValue={this.defaultValue}
            size={this.size}
            appearance={this.appearance}
            pill={this.pill}
            label={this.label}
            hint={this.hint}
            withClear={this.withClear}
            placeholder={this.placeholder}
            readonly={this.readonly}
            passwordToggle={this.passwordToggle}
            passwordVisible={this.passwordVisible}
            withoutSpinButtons={this.withoutSpinButtons}
            form={this.form}
            required={this.required}
            pattern={this.pattern}
            minlength={this.minlength}
            maxlength={this.maxlength}
            min={this.min}
            max={this.max}
            step={this.step}
            inputClass={this.inputClass}
            autocapitalize={this.autocapitalize}
            // autocorrect={this.autocorrect}
            autocomplete={this.autocomplete}
            autofocus={this.autofocus}
            enterkeyhint={this.enterkeyhint}
            spellcheck={this.spellcheck}
            inputmode={this.inputmode}
            withLabel={this.withLabel}
            withHint={this.withHint}
            mask={this.mask}
            returnMaskedValue={this.returnMaskedValue}
            disabled={this.disabled}
            exportparts="base, hint, label, input, start, end, clear-button, password-toggle-button"
          >
            {this.multiple && this.selectedOptions.length > 0 && this.renderSelectedTags()}
            {this.withExpandIcon && (
              <div slot="end" class={`expand-icon${this.open ? ' expand-icon--open' : ''}`} aria-hidden="true" onClick={this.handleExpandIconClick}>
                <wa-icon library="system" variant="solid" name="chevron-down"></wa-icon>
              </div>
            )}
            {this.slotManager.hasSlot('label') && <slot name="label" slot="label"></slot>}
            {this.slotManager.hasSlot('start') && <slot name="start" slot="start"></slot>}
            {this.slotManager.hasSlot('end') && <slot name="end" slot="end"></slot>}
            {this.slotManager.hasSlot('clear-icon') && <slot name="clear-icon" slot="clear-icon"></slot>}
            {this.slotManager.hasSlot('hint') && <slot name="hint" slot="hint"></slot>}
          </ir-input>

          <div
            id="listbox"
            ref={el => (this.listboxRef = el)}
            role="listbox"
            aria-multiselectable={this.multiple ? 'true' : 'false'}
            aria-label={this.label || this.placeholder}
            part="listbox"
            class="listbox"
            tabindex="-1"
            hidden={!this.open}
            onKeyDown={this.handleKeydownChange}
          >
            <slot onSlotchange={this.handleOptionsSlotChange}></slot>
          </div>
        </wa-popup>
      </Host>
    );
  }
}
