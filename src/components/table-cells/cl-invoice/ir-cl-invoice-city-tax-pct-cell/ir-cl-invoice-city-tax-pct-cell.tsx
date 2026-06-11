import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-cl-invoice-city-tax-pct-cell',
  styleUrl: 'ir-cl-invoice-city-tax-pct-cell.css',
  scoped: true,
})
export class IrClInvoiceCityTaxPctCell {
  @Prop() cityTaxPercent: number;

  render() {
    return <Host>{this.cityTaxPercent > 0 ? `${this.cityTaxPercent}%` : ''}</Host>;
  }
}
