import { formatAmount } from '@/utils/utils';
import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-cl-invoice-city-tax-amount-cell',
  styleUrl: 'ir-cl-invoice-city-tax-amount-cell.css',
  scoped: true,
})
export class IrClInvoiceCityTaxAmountCell {
  @Prop() currencySymbol: string;
  @Prop() amount: number;
  @Prop() cityTaxPercent: number;

  render() {
    return <Host>{this.cityTaxPercent > 0 ? formatAmount(this.currencySymbol, this.amount) : ''}</Host>;
  }
}
