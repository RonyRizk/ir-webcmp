import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-cl-invoice-description-cell',
  styleUrl: 'ir-cl-invoice-description-cell.css',
  scoped: true,
})
export class IrClInvoiceDescriptionCell {
  @Prop() description: string;

  render() {
    return (
      <Host>
        <span class="desc">{this.description}</span>
      </Host>
    );
  }
}
