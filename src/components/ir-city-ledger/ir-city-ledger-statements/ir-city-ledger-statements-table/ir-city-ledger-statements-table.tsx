import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { CellContext, createColumnHelper, getCoreRowModel, getSortedRowModel } from '@tanstack/table-core';
import { flexRender, useTable } from '@/utils/useTable';
import { formatAmount } from '@/utils/utils';
import type { ICurrency } from '@/models/property';
import type { FiscalDocument } from '@/services/city-ledger';
import moment from 'moment';
import { ClFiscalDocumentPreviewRequest } from '../../ir-city-ledger-fiscal-documents/ir-cl-fiscal-document-preview/types';
import { FdTypes } from '@/types/enums';
import { debitFdTypeCode } from '@/services/city-ledger.service';

const NUMERIC_COLS = new Set(['debit', 'credit', 'balance']);
const DATE_INPUT_FORMAT = 'YYYY-MM-DD';
const DATE_DISPLAY_FORMAT = 'MMM DD, YYYY';

@Component({
  tag: 'ir-city-ledger-statements-table',
  styleUrl: 'ir-city-ledger-statements-table.css',
  scoped: true,
})
export class IrCityLedgerStatementsTable {
  @Prop() rows: FiscalDocument[] = [];
  @Prop() agentId: number;
  @Prop() startingBalance: number = 0;
  @Prop() endingBalance: number = 0;
  @Prop() currencySymbol: string = '$';
  @Prop() currencies: ICurrency[] = [];
  @Prop() isLoading: boolean = false;
  @Prop() hasFetched: boolean = false;
  @Prop() fromDate: string | null = null;
  @Prop() toDate: string | null = null;

  @Event() clFiscalDocumentPreview: EventEmitter<ClFiscalDocumentPreviewRequest>;
  private columnHelper = createColumnHelper<FiscalDocument>();

  private formatDate(date: string | null | undefined): string {
    if (!date) return '';
    const m = moment(date, [DATE_INPUT_FORMAT, moment.ISO_8601], true);
    return m.isValid() ? m.format(DATE_DISPLAY_FORMAT) : date;
  }

  private getSymbol(currencyId: number | null | undefined): string {
    if (!currencyId) return this.currencySymbol;
    const match = this.currencies.find(c => c.id === currencyId);
    return match?.symbol ?? this.currencySymbol;
  }

  private renderMoney(value: number | null | undefined, currencyId: number | null | undefined) {
    if (value == null || value === 0 || isNaN(value)) return <span class="stmt-table__cell--zero"></span>;
    return <span class="stmt-table__cell--money">{formatAmount(this.getSymbol(currencyId), value)}</span>;
  }

  private get runningBalances(): number[] {
    let balance = this.startingBalance;
    return this.rows.map(doc => {
      if (debitFdTypeCode.has(doc.FD_TYPE_CODE as any)) {
        balance += doc.DEBIT ?? 0;
      } else {
        balance -= Math.abs(doc.CREDIT ?? 0);
      }
      return balance;
    });
  }
  //Before Credit receipt change
  // private get runningBalances(): number[] {
  //   let balance = this.startingBalance;
  //   return this.rows.map(doc => {
  //     balance += Math.abs(doc.DEBIT ?? 0) - Math.abs(doc.CREDIT ?? 0);
  //     return balance;
  //   });
  // }
  private getCredit(info: CellContext<FiscalDocument, number>): number {
    const { FD_TYPE_CODE, DEBIT } = info.row.original;
    const value = info.getValue();

    switch (FD_TYPE_CODE) {
      case FdTypes.CreditReceipt:
        return -DEBIT;

      case FdTypes.Receipt:
        return Math.abs(value);

      default:
        return value;
    }
  }
  private get columns() {
    const balances = this.runningBalances;
    return [
      this.columnHelper.accessor('ISSUE_DATE_DISPLAY', {
        id: 'date',
        header: 'Date',
        cell: info => info.getValue() || this.formatDate(info.row.original.ISSUE_DATE),
      }),
      this.columnHelper.accessor('DOC_NUMBER', {
        header: 'Doc Number',
        cell: info => (
          <wa-button
            onClick={() => {
              const row = info.row.original;
              this.clFiscalDocumentPreview.emit({
                fdTypeCode: row.FD_TYPE_CODE,
                documentNumber: row.DOC_NUMBER,
                agentId: this.agentId,
                agentName: row.AGENCY_NAME,
                fdId: row.FD_ID,
                externalRef: row.EXTERNAL_REF,
                fromDate: row.FD_TYPE_CODE === FdTypes.Proforma ? row.FROM_DATE : this.fromDate,
                toDate: row.FD_TYPE_CODE === FdTypes.Proforma ? row.TO_DATE : this.toDate,
                bookingNbr: row.FD_TYPE_CODE === FdTypes.Proforma ? row.BOOK_NBR : null,
              });
            }}
            variant="brand"
            appearance="plain"
            class="stmt-table__doc-number"
          >
            {info.getValue() ?? ''}
          </wa-button>
        ),
      }),
      this.columnHelper.accessor('FD_TYPE_NAME', {
        id: 'type',
        header: 'Type',
        cell: info => info.getValue() ?? '',
      }),
      this.columnHelper.accessor('DEBIT', {
        id: 'debit',
        header: 'Debit',
        cell: info => (info.row.original.FD_TYPE_CODE === FdTypes.CreditReceipt ? '' : this.renderMoney(info.getValue(), info.row.original.CURRENCY_ID)),
      }),
      this.columnHelper.accessor('CREDIT', {
        id: 'credit',
        header: 'Credit',
        cell: info => this.renderMoney(this.getCredit(info), info.row.original.CURRENCY_ID),
      }),
      this.columnHelper.display({
        id: 'balance',
        header: 'Balance',
        cell: info => this.renderMoney(balances[info.row.index], info.row.original.CURRENCY_ID),
      }),
    ];
  }

  private renderStartingBalanceRow() {
    const bal = this.startingBalance;
    return (
      <tr class="ir-table-row balance-row balance-row--start">
        <td>{this.formatDate(this.fromDate)}</td>
        <td></td>
        <td class="balance-row__label">
          <wa-icon name="scale-balanced" style={{ marginRight: '0.375rem', fontSize: '0.875rem' }}></wa-icon>
          Starting Balance
        </td>
        <td class="cell--align-end"></td>
        <td class="cell--align-end"></td>
        <td class="cell--align-end">{formatAmount(this.currencySymbol, bal)}</td>
      </tr>
    );
  }

  private renderEndingBalanceRow() {
    const bal = this.runningBalances[this.runningBalances.length - 1];
    return (
      <tr class="ir-table-row balance-row balance-row--end">
        <td>{this.formatDate(this.toDate)}</td>
        <td></td>
        <td class="balance-row__label">
          <wa-icon name="scale-balanced" style={{ marginRight: '0.375rem', fontSize: '0.875rem' }}></wa-icon>
          Ending Balance
        </td>
        <td class="cell--align-end"></td>
        <td class="cell--align-end"></td>
        <td class="cell--align-end">{formatAmount(this.currencySymbol, bal)}</td>
      </tr>
    );
  }

  render() {
    if (!this.hasFetched) {
      return (
        <Host>
          <div class="stmt-table__date-prompt">
            <div class="stmt-table__date-prompt-icon">
              <wa-icon name="calendar-days"></wa-icon>
            </div>
            <p class="stmt-table__date-prompt-title">Select a date range and click "Create Statement"</p>
          </div>
        </Host>
      );
    }

    if (this.isLoading) {
      return (
        <Host>
          <div class="stmt-table__loading">
            <ir-spinner></ir-spinner>
          </div>
        </Host>
      );
    }

    const table = useTable<FiscalDocument>({
      data: this.rows,
      columns: this.columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
    });

    const colCount = this.columns.length;

    return (
      <Host>
        <div class="table--container">
          <table class="table data-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} class={{ 'cell--align-end': NUMERIC_COLS.has(header.column.id) }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            <tbody>
              {this.renderStartingBalanceRow()}

              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td class="empty-row" colSpan={colCount}>
                    No fiscal documents in this period.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} class="ir-table-row">
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        class={{
                          'stmt-table__cell': true,
                          'cell--align-end': NUMERIC_COLS.has(cell.column.id),
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}

              {this.renderEndingBalanceRow()}
            </tbody>
          </table>
        </div>
      </Host>
    );
  }
}
