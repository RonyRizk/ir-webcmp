import { formatAmount } from '@/utils/utils';
import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-cl-invoice-vat-amount-cell',
  styleUrl: 'ir-cl-invoice-vat-amount-cell.css',
  scoped: true,
})
export class IrClInvoiceVatAmountCell {
  @Prop() currencySymbol: string;
  @Prop() amount: number;

  render() {
    return <Host>{formatAmount(this.currencySymbol, this.amount)}</Host>;
  }
}
