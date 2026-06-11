import { formatAmount } from '@/utils/utils';
import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-cl-invoice-total-cell',
  styleUrl: 'ir-cl-invoice-total-cell.css',
  scoped: true,
})
export class IrClInvoiceTotalCell {
  @Prop() currencySymbol: string;
  @Prop() amount: number;

  render() {
    return <Host>{formatAmount(this.currencySymbol, this.amount)}</Host>;
  }
}
