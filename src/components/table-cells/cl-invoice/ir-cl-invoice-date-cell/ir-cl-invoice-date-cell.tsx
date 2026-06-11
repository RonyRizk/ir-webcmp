import { Component, Host, Prop, h } from '@stencil/core';
import moment from 'moment';

@Component({
  tag: 'ir-cl-invoice-date-cell',
  styleUrl: 'ir-cl-invoice-date-cell.css',
  scoped: true,
})
export class IrClInvoiceDateCell {
  @Prop() date: string;

  render() {
    return <Host>{moment(this.date, 'YYYY-MM-DD').format('MMM DD, YYYY')}</Host>;
  }
}
