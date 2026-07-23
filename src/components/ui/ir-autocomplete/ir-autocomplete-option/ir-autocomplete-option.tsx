import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-autocomplete-option',
  styleUrl: 'ir-autocomplete-option.css',
  shadow: true,
})
export class IrAutocompleteOption {
  @Prop({ reflect: true }) value: string;
  @Prop({ reflect: true }) label: string;
  @Prop({ reflect: true }) disabled: boolean = false;
  @Prop({ reflect: true, mutable: true }) current: boolean = false;
  @Prop({ reflect: true, mutable: true }) selected: boolean = false;

  private waOptionRef?: HTMLElement & { updateComplete?: Promise<unknown> };

  connectedCallback() {
    // wa-option re-asserts role="option" in its own connectedCallback, so the
    // demotion must run again every time this element is reconnected.
    this.demoteInnerOptionRole();
  }

  componentDidRender() {
    // wa-option re-asserts aria-selected in its updated() hook after prop changes.
    this.demoteInnerOptionRole();
  }

  /**
   * The host carries role="option" (referenced by the combobox via aria-activedescendant);
   * the inner wa-option must not expose a second, nested option to assistive tech.
   */
  private async demoteInnerOptionRole() {
    const waOption = this.waOptionRef;
    if (!waOption) return;
    await waOption.updateComplete;
    if (!waOption.isConnected) return;
    waOption.setAttribute('role', 'presentation');
    waOption.removeAttribute('aria-selected');
  }

  render() {
    return (
      <Host role="option" aria-selected={this.selected ? 'true' : 'false'} aria-disabled={this.disabled ? 'true' : 'false'}>
        <wa-option
          ref={el => (this.waOptionRef = el)}
          value={this.value}
          label={this.label}
          disabled={this.disabled}
          current={this.current}
          selected={this.selected}
          exportparts="checked-icon, label, start, end"
        >
          <slot></slot>
          <slot name="start" slot="start"></slot>
          <slot name="end" slot="end"></slot>
        </wa-option>
      </Host>
    );
  }
}
