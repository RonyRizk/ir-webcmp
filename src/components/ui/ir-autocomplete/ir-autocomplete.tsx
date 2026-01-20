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

type AutocompletePopupElement = WaPopup

@Component({
  tag: 'ir-autocomplete',
  styleUrl: 'ir-autocomplete.css',
  shadow: true,
})
export class IrAutocomplete {

  @Element() el: HTMLIrAutocompleteElement;

  @Prop({ reflect: true, mutable: true }) open: boolean = false;
  @Prop({ reflect: true }) placement: AutocompletePopupElement["placement"] = "bottom"
  @Prop() name: string;
  /** The value of the input. */
  @Prop({ reflect: true, mutable: true }) value: string = '';

  /**
   * The type of input. Works the same as a native `<input>` element, but only a subset of types are supported. Defaults
   * to `text`.
   */
  @Prop({ reflect: true }) type: NativeWaInput['type'] = 'text';

  /** The default value of the form control. Primarily used for resetting the form control. */
  @Prop({ reflect: true }) defaultValue: NativeWaInput['defaultValue'];

  /** The input's size. */
  @Prop({ reflect: true }) size: NativeWaInput['size'] = 'small';

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
   * Custom CSS classes applied to the inner `<ir-input>` element.
   *
   * You can also target the exposed parts `::part(input)` and `::part(base)`
   * for deeper styling of the native input and container.
   */
  @Prop() inputClass: string;

  @State() private options: AutocompleteOptionElement[] = [];
  @State() private slotStateVersion = 0;

  @Event({ bubbles: true, composed: true, eventName: 'text-change' }) textChange: EventEmitter<string>;
  @Event({ bubbles: true, composed: true, eventName: 'combobox-change' }) comboboxChange: EventEmitter<string>;

  private currentOption?: AutocompleteOptionElement;
  private listboxRef?: HTMLElement;
  private inputRef?: HTMLIrInputElement;
  private readonly SLOT_NAMES = [
    "label",
    "start",
    "end",
    "clear-icon",
    "hint",
  ] as const;

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
    this.syncSelectedFromValue(this.value);
  }

  componentDidLoad() {
    this.slotManager.setupListeners();
    this.listboxRef?.addEventListener('click', this.handleOptionClick);
  }

  disconnectedCallback() {
    this.slotManager.destroy();
    this.listboxRef?.removeEventListener('click', this.handleOptionClick);
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
  }

  @Watch('open')
  handleOpenChange(newValue: boolean) {
    if (!this.listboxRef) return;

    this.listboxRef.hidden = !newValue;

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
  private scrollIntoView(
    element: HTMLElement,
    container: HTMLElement,
    direction: 'horizontal' | 'vertical' | 'both' = 'vertical',
    behavior: 'smooth' | 'auto' = 'smooth',
  ) {
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
    this.syncSelectedFromValue(newValue);
  }

  private getAllOptions(): AutocompleteOptionElement[] {
    return this.options;
  }

  private updateOptionsFromSlot(slotEl?: HTMLSlotElement) {
    const slot = slotEl ?? (this.listboxRef?.querySelector('slot') as HTMLSlotElement | null);
    if (!slot) {
      this.options = Array.from(this.el.querySelectorAll('ir-autocomplete-option')) as AutocompleteOptionElement[];
      return;
    }

    const assigned = slot.assignedElements({ flatten: true }) as Element[];
    this.options = assigned.filter(el => el.tagName.toLowerCase() === 'ir-autocomplete-option') as AutocompleteOptionElement[];
  }

  private clearCurrentOption() {
    const allOptions = this.getAllOptions();
    allOptions.forEach(el => {
      el.current = false;
      el.tabIndex = -1;
    });
    this.currentOption = undefined;
  }
  private ensureCurrentOption() {
    const allOptions = this.getAllOptions().filter(option => !option.disabled);
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
    const allOptions = this.getAllOptions();

    // Clear selection
    allOptions.forEach(el => {
      el.current = false;
      el.tabIndex = -1;
    });

    // Select the target option
    this.currentOption = option;
    option.current = true;
    option.tabIndex = 0;

    if (options.scroll && this.listboxRef) {
      this.scrollIntoView(option, this.listboxRef, 'vertical', 'auto');
    }
  }
  private getOptionLabel(option: AutocompleteOptionElement): string {
    if (option.label) return option.label;
    return option.textContent?.trim() ?? '';
  }
  private getOptionValue(option: AutocompleteOptionElement): string {
    return option.value ?? this.getOptionLabel(option);
  }
  private syncSelectedFromValue(value: string) {
    const allOptions = this.getAllOptions();
    let selectedOption: AutocompleteOptionElement | undefined;

    allOptions.forEach(option => {
      const optionValue = this.getOptionValue(option);
      option.selected = optionValue === value;
      if (option.selected) {
        selectedOption = option;
      }
    });

    if (selectedOption) {
      this.currentOption = selectedOption;
    } else if (this.currentOption && this.getOptionValue(this.currentOption) !== value) {
      this.currentOption = undefined;
    }
  }
  private selectOption(option: AutocompleteOptionElement) {
    if (!option || option.disabled) return;
    const allOptions = this.getAllOptions();
    allOptions.forEach(el => {
      el.selected = false;
    });
    option.selected = true;
    this.currentOption = option;

    const nextValue = this.getOptionValue(option);
    if (nextValue !== this.value) {
      this.value = nextValue;
      this.comboboxChange.emit(nextValue);
    }
    this.hide();
    requestAnimationFrame(() => this.inputRef?.focusInput());
  }
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
    if (!this.open && this.getAllOptions().length) {
      this.show();
    }
  };
  private handleOptionsSlotChange = (event: Event) => {
    this.updateOptionsFromSlot(event.target as HTMLSlotElement);
    this.syncSelectedFromValue(this.value);
    if (this.open) {
      this.ensureCurrentOption();
    }
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
      const allOptions = this.getAllOptions().filter(option => !option.disabled);
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
  }

  render() {
    return (
      <Host>
        <wa-popup
          active={this.open}
          flip
          shift
          sync="width"
          auto-size="vertical"
          auto-size-padding={10}
          placement={this.placement}
          exportparts="popup, arrow, hover-bridge"
        >
          <ir-input
            slot="anchor"
            ref={el => (this.inputRef = el)}
            onKeyDown={this.handleKeydownChange}
            onText-change={this.handleTextChange}
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
            autocorrect={this.autocorrect}
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
            {this.slotManager.hasSlot('label') && <slot name="label" slot="label"></slot>}
            {this.slotManager.hasSlot('start') && <slot name="start" slot="start"></slot>}
            {this.slotManager.hasSlot('end') && <slot name="end" slot="end"></slot>}
            {this.slotManager.hasSlot('clear-icon') && <slot name="clear-icon" slot="clear-icon"></slot>}
            {this.slotManager.hasSlot('hint') && <slot name="hint" slot="hint"></slot>}
          </ir-input>
          <div id="listbox"
            ref={el => (this.listboxRef = el)}
            role="listbox"
            aria-expanded={this.open ? 'true' : 'false'}
            aria-multiselectable={'false'}
            aria-labelledby="label"
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
