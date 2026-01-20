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

  render() {
    return (
      <Host role="option" aria-selected={this.selected ? 'true' : 'false'} aria-disabled={this.disabled ? 'true' : 'false'}>
        <wa-option
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
