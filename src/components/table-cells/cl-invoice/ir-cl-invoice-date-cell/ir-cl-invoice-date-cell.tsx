import { Component, Host, Prop, h } from '@stencil/core';
import { formatDate } from '@/utils/date';

@Component({
  tag: 'ir-cl-invoice-date-cell',
  styleUrl: 'ir-cl-invoice-date-cell.css',
  scoped: true,
})
export class IrClInvoiceDateCell {
  @Prop() date: string;

  render() {
    return <Host>{formatDate(this.date, { style: 'medium' })}</Host>;
  }
}
