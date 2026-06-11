import { formatAmount } from '@/utils/utils';
import { Component, Fragment, Host, Prop, h } from '@stencil/core';
import type { PhysicalRoom, RatePlan, RoomType } from '@/models/property';
import type { ClTx } from '@/services/city-ledger';
import moment from 'moment';
import { groupData, type BookingGroup, type GroupedItem, type UnitGroup } from './utils';
import calendar_data from '@/stores/calendar-data';

@Component({
  tag: 'ir-cl-fiscal-document-table',
  styleUrl: 'ir-cl-fiscal-document-table.css',
  shadow: true,
})
export class IrClFiscalDocumentTable {
  @Prop() transactions: ClTx[] = [];
  @Prop() currencySymbol: string = '$';
  /** When true all monetary amounts are negated — used for credit notes. */
  @Prop() invertAmounts: boolean = false;

  private applySign(value: number | null | undefined): number {
    return this.invertAmounts ? -(value ?? 0) : (value ?? 0);
  }

  private renderMoney(value: number | null | undefined): string {
    return formatAmount(this.currencySymbol, this.applySign(value));
  }

  private get prIdDict(): Map<number, PhysicalRoom> {
    const map = new Map<number, PhysicalRoom>();
    for (const rt of (calendar_data.property as any)?.roomtypes ?? []) {
      for (const room of rt.physicalrooms ?? []) {
        map.set(room.id, room);
      }
    }
    return map;
  }

  private get roomTypesDict(): Map<number, RoomType> {
    const map = new Map<number, RoomType>();
    for (const rt of (calendar_data.property as any)?.roomtypes ?? []) {
      map.set(rt.id, rt);
    }
    return map;
  }

  private get rateplanDict(): Map<number, RatePlan> {
    const map = new Map<number, RatePlan>();
    for (const rt of (calendar_data.property as any)?.roomtypes ?? []) {
      for (const rp of rt.rateplans ?? []) {
        map.set(rp.id, rp);
      }
    }
    return map;
  }

  private get showCityTax(): boolean {
    return this.transactions.some(tx => (tx.CITY_TAX_PERCENT ?? 0) > 0);
  }

  private get totals() {
    return this.transactions.reduce(
      (acc, tx) => ({
        net: acc.net + (tx.NET_AMOUNT ?? 0),
        tax: acc.tax + (tx.TAX_AMOUNT ?? 0),
        total: acc.total + (tx.TOTAL_AMOUNT ?? 0),
      }),
      { net: 0, tax: 0, total: 0 },
    );
  }

  private renderTxRow(tx: ClTx, indent: 0 | 1 | 2 = 0) {
    const cls = indent > 0 ? `invoice-items__row--indent-${indent}` : undefined;
    return (
      <tr key={String(tx.CL_TX_ID)} class={cls}>
        <td class="cl-td cl-td--muted cl-td--nowrap">
          <ir-cl-invoice-date-cell date={tx.ENTRY_DATE}></ir-cl-invoice-date-cell>
        </td>
        <td class="cl-td invoice-items__td--desc-cell">
          <ir-cl-invoice-description-cell description={tx.DESCRIPTION}></ir-cl-invoice-description-cell>
        </td>
        <td class="cl-td cl-td--num cl-td--bold">
          <ir-cl-invoice-net-price-cell currencySymbol={this.currencySymbol} amount={this.applySign(tx.NET_AMOUNT)}></ir-cl-invoice-net-price-cell>
        </td>
        <td class="cl-td cl-td--num cl-td--muted">
          <ir-cl-invoice-vat-pct-cell vatPercent={tx.VAT_PERCENT}></ir-cl-invoice-vat-pct-cell>
        </td>
        <td class="cl-td cl-td--num cl-td--muted">
          <ir-cl-invoice-vat-amount-cell currencySymbol={this.currencySymbol} amount={this.applySign(tx.VAT_AMOUNT)}></ir-cl-invoice-vat-amount-cell>
        </td>
        {this.showCityTax && (
          <td class="cl-td cl-td--num cl-td--muted">
            <ir-cl-invoice-city-tax-pct-cell cityTaxPercent={tx.CITY_TAX_PERCENT}></ir-cl-invoice-city-tax-pct-cell>
          </td>
        )}
        {this.showCityTax && (
          <td class="cl-td cl-td--num cl-td--muted">
            <ir-cl-invoice-city-tax-amount-cell
              currencySymbol={this.currencySymbol}
              amount={this.applySign(tx.CITY_TAX_AMOUNT)}
              cityTaxPercent={tx.CITY_TAX_PERCENT}
            ></ir-cl-invoice-city-tax-amount-cell>
          </td>
        )}
        <td class="cl-td cl-td--num cl-td--bold">
          <ir-cl-invoice-total-cell currencySymbol={this.currencySymbol} amount={this.applySign(tx.TOTAL_AMOUNT)}></ir-cl-invoice-total-cell>
        </td>
      </tr>
    );
  }

  private renderUnitGroup(group: UnitGroup) {
    const roomName = this.prIdDict.get(group.PR_ID)?.name ?? '';
    const description = `${this.roomTypesDict.get(group.ROOM_CATEGORY_ID)?.name} - ${this.rateplanDict.get(group.ROOM_TYPE_ID)?.short_name}`;
    return (
      <Fragment>
        <tr key={`unit-hdr-${group.PR_ID}`} class="invoice-items__unit-row">
          <td colSpan={this.showCityTax ? 8 : 6}>
            <span>
              {`${roomName} - ${group.GUEST_FIRST_NAME} ${group.GUEST_LAST_NAME} (${group.occupancy} pax)`}
              <span innerHTML="&nbsp&nbsp&nbsp&nbsp"></span>
              {moment(group.FROM_DATE, 'YYYY-MM-DD').format('MMM, DD YYYY')} - {moment(group.TO_DATE, 'YYYY-MM-DD').format('MMM, DD YYYY')}
            </span>
          </td>
        </tr>
        {group.subRows.map(tx => this.renderTxRow({ ...tx, DESCRIPTION: description }, 2))}
      </Fragment>
    );
  }

  private renderBookingGroup(group: BookingGroup) {
    return (
      <Fragment>
        {group.subRows.length > 1 && (
          <tr key={`booking-hdr-${group.BOOK_NBR}`} class="invoice-items__booking-row">
            <td colSpan={this.showCityTax ? 8 : 6}>
              <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>#{group.BOOK_NBR}</span>
            </td>
          </tr>
        )}
        {group.subRows.map(item => {
          const asAny = item as any;
          if ('subRows' in asAny && !('BOOK_NBR' in asAny)) {
            return this.renderUnitGroup(asAny as UnitGroup);
          }
          return this.renderTxRow(asAny as ClTx, 1);
        })}
      </Fragment>
    );
  }

  private renderTopLevelItem(item: GroupedItem) {
    const asAny = item as any;
    if ('subRows' in asAny && 'BOOK_NBR' in asAny) {
      return this.renderBookingGroup(asAny as BookingGroup);
    }
    return this.renderTxRow(asAny as ClTx);
  }

  private renderTotals() {
    const t = this.totals;
    return (
      <tr class="cl-balance-row">
        <td class="cl-td"></td>
        <td class="cl-td cl-td--num"></td>
        <td class="cl-td cl-td--num">
          <span style={{ fontSize: '1rem' }}>{this.renderMoney(t.net)}</span> <br></br>Net Price
        </td>
        <td class="cl-td cl-td--num"></td>
        <td class="cl-td cl-td--num">
          <span style={{ fontSize: '1rem' }}>{this.renderMoney(t.tax)}</span>
          <br></br>Taxes
        </td>
        {this.showCityTax && <td class="cl-td cl-td--num"></td>}
        {this.showCityTax && <td class="cl-td cl-td--num"></td>}
        <td class="cl-td cl-td--num">
          <span style={{ fontSize: '1rem' }}>{this.renderMoney(t.total)}</span>
          <br></br>Total
        </td>
      </tr>
    );
  }

  render() {
    return (
      <Host>
        <section class="invoice-items">
          <table class="cl-table">
            <thead>
              <tr>
                <th class="cl-th">Date</th>
                <th class="cl-th" style={{ width: '100%' }}>
                  Description
                </th>
                <th class="cl-th cl-th--num">Net Price</th>
                <th class="cl-th">VAT</th>
                <th class="cl-th cl-th--num">VAT Amount</th>
                {this.showCityTax && (
                  <th class="cl-th">
                    City <br />
                    Tax
                  </th>
                )}
                {this.showCityTax && (
                  <th class="cl-th cl-th--num">
                    City Tax
                    <br /> Amount
                  </th>
                )}
                <th class="cl-th cl-th--num">Total</th>
              </tr>
            </thead>
            <tbody>
              {this.transactions.length === 0 ? (
                <tr>
                  <td class="cl-td cl-td--empty" colSpan={this.showCityTax ? 8 : 6}>
                    No transactions found for this document.
                  </td>
                </tr>
              ) : (
                <Fragment>
                  {(groupData(this.transactions) as unknown as GroupedItem[]).map(item => this.renderTopLevelItem(item))}
                  {this.renderTotals()}
                </Fragment>
              )}
            </tbody>
          </table>
        </section>
      </Host>
    );
  }
}
