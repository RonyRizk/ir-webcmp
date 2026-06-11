import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-cl-invoice-vat-pct-cell',
  styleUrl: 'ir-cl-invoice-vat-pct-cell.css',
  scoped: true,
})
export class IrClInvoiceVatPctCell {
  @Prop() vatPercent: number;

  render() {
    return <Host>{this.vatPercent}%</Host>;
  }
}
