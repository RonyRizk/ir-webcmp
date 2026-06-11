import { MaskProp } from '@/components/ui/ir-input/ir-input';
import { Component, Element, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';

@Component({
  tag: 'ir-input-cell',
  styleUrl: 'ir-input-cell.css',
  shadow: true,
})
export class IrInputCell {
  @Element() el: HTMLIrInputCellElement;
  /** The value of the input. */
  @Prop({ mutable: true }) value: string;
  /** Disables the input. */
  @Prop() disabled: boolean;
  /** Mask for the input field (optional) */
  @Prop() mask: MaskProp;

  @State() active: boolean = false;
  @State() private slotState = new Map<string, boolean>();

  @Event() cellValueChange: EventEmitter<string>;

  private inputRef: HTMLIrInputElement;

  private slotObserver: MutationObserver;

  private readonly SLOT_NAMES = ['label', 'start', 'end', 'clear-icon', 'hide-password-icon', 'show-password-icon', 'hint'] as const;

  componentWillLoad() {
    this.updateSlotState();
  }

  componentDidLoad() {
    this.setupSlotListeners();
  }

  disconnectedCallback() {
    this.removeSlotListeners();
  }

  @Watch('active')
  handleActiveChange() {
    if (this.active) {
      setTimeout(() => {
        this.inputRef?.focusInput();
      }, 100);
    }
  }
  private hasSlot(name: string): boolean {
    return !!this.el.querySelector(`[slot="${name}"]`);
  }
  private setupSlotListeners() {
    // Listen to slotchange events on the host element
    this.el.addEventListener('slotchange', this.handleSlotChange);

    // Also use MutationObserver as a fallback for browsers that don't fire slotchange reliably
    this.slotObserver = new MutationObserver(this.handleSlotChange);
    this.slotObserver.observe(this.el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['slot'],
    });
  }
  private removeSlotListeners() {
    this.el.removeEventListener('slotchange', this.handleSlotChange);
    this.slotObserver?.disconnect();
  }

  private handleSlotChange = () => {
    this.updateSlotState();
  };

  private updateSlotState() {
    const newState = new Map<string, boolean>();

    this.SLOT_NAMES.forEach(name => {
      newState.set(name, this.hasSlot(name));
    });

    this.slotState = newState;
  }

  render() {
    return (
      <div
        onDblClick={() => {
          if (this.disabled) {
            return;
          }
          if (!this.active) {
            this.active = true;
          }
        }}
        data-active={String(this.active)}
        class="input-cell__container"
      >
        {this.active ? (
          <ir-input
            ref={el => (this.inputRef = el)}
            mask={this.mask}
            class="cell-input"
            value={this.value}
            onText-change={e => {
              this.value = e.detail;
            }}
            onInput-blur={() => {
              this.active = false;
            }}
            onChange={() => {
              this.cellValueChange.emit(this.value);
            }}
          >
            {this.slotState.get('label') && <slot name="label" slot="label"></slot>}
            {this.slotState.get('start') && <slot name="start" slot="start"></slot>}
            {this.slotState.get('end') && <slot name="end" slot="end"></slot>}
            {this.slotState.get('clear-icon') && <slot name="clear-icon" slot="clear-icon"></slot>}
            {this.slotState.get('hide-password-icon') && <slot name="hide-password-icon" slot="hide-password-icon"></slot>}
            {this.slotState.get('show-password-icon') && <slot name="show-password-icon" slot="show-password-icon"></slot>}
            {this.slotState.get('hint') && <slot name="hint" slot="hint"></slot>}
          </ir-input>
        ) : (
          <slot></slot>
        )}
      </div>
    );
  }
}
