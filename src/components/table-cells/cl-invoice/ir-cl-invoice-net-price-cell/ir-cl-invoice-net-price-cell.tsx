import { formatAmount } from '@/utils/utils';
import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-cl-invoice-net-price-cell',
  styleUrl: 'ir-cl-invoice-net-price-cell.css',
  scoped: true,
})
export class IrClInvoiceNetPriceCell {
  @Prop() currencySymbol: string;
  @Prop() amount: number;

  render() {
    return <Host>{formatAmount(this.currencySymbol, this.amount)}</Host>;
  }
}
