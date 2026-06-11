import { formatAmount } from '@/utils/utils';
import { flexRender, useTable } from '@/utils/useTable';
import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import type { ClFiscalDocumentPreviewRequest } from '../ir-cl-fiscal-document-preview/types';
import { CellContext, createColumnHelper, getCoreRowModel, getSortedRowModel } from '@tanstack/table-core';
import { CityLedgerService, type FiscalDocument } from '../../../../services/city-ledger';
import type { ICurrency } from '@/models/property';
import { FdStatus, FdTypes } from '@/types/enums';

@Component({
  tag: 'ir-city-ledger-fiscal-documents-table',
  styleUrl: 'ir-city-ledger-fiscal-documents-table.css',
  scoped: true,
})
export class IrCityLedgerFiscalDocumentsTable {
  @Prop() rows: FiscalDocument[] = [];
  @Prop() currencySymbol: string = '$';
  @Prop() currencies: ICurrency[] = [];
  @Prop() taxableOnly: boolean = false;
  @Prop() isLoading: boolean = false;
  @Prop() hasDates: boolean = false;
  @Prop() ticket: string;
  @Prop() propertyId: number;
  @Prop() agentId: number | null = null;
  @Prop() fromDate: string | null = null;
  @Prop() toDate: string | null = null;

  @Prop() hasFetched: boolean = false;

  @Event() clFiscalDocumentPreview: EventEmitter<ClFiscalDocumentPreviewRequest>;
  @Event() fetchRequested: EventEmitter<void>;

  @State() private pendingAction: { action: 'void' | 'delete-draft' | 'convert-to-invoice'; row: FiscalDocument } | null = null;
  @State() private isConfirming = false;

  private columnHelper = createColumnHelper<FiscalDocument>();
  private cityLedgerService = new CityLedgerService();

  private handleAction(action: string, row: FiscalDocument) {
    switch (action) {
      case 'view':
      case 'preview':
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
        break;
      case 'print':
        this.clFiscalDocumentPreview.emit({
          fdTypeCode: row.FD_TYPE_CODE,
          documentNumber: row.DOC_NUMBER,
          agentId: this.agentId,
          agentName: row.AGENCY_NAME,
          fdId: row.FD_ID,
          autoPrint: true,
          externalRef: row.EXTERNAL_REF,
          fromDate: row.FD_TYPE_CODE === FdTypes.Proforma ? row.FROM_DATE : this.fromDate,
          toDate: row.FD_TYPE_CODE === FdTypes.Proforma ? row.TO_DATE : this.toDate,
          bookingNbr: row.FD_TYPE_CODE === FdTypes.Proforma ? row.BOOK_NBR : null,
        });
        break;
      case 'download':
        console.log('download', row);
        break;
      case 'send-reminder':
        console.log('send-reminder', row);
        break;
      case 'apply-payment':
        console.log('apply-payment', row);
        break;
      case 'mark-paid':
        console.log('mark-paid', row);
        break;
      case 'void':
      case 'delete-draft':
      case 'convert-to-invoice':
        this.pendingAction = { action: action as 'void' | 'delete-draft' | 'convert-to-invoice', row };
        break;
    }
  }

  private async confirmPendingAction() {
    if (!this.pendingAction) return;
    const { action, row } = this.pendingAction;
    this.isConfirming = true;
    try {
      if (action === 'void') {
        switch (row.FD_TYPE_CODE) {
          case FdTypes.Invoice:
            await this.cityLedgerService.voidInvoiceByCreditNote({ FD_ID: row.FD_ID });
            break;
          case FdTypes.Receipt:
            await this.cityLedgerService.voidReceiptByCreditReceipt({ FD_ID: row.FD_ID });
            break;
          default:
            console.warn(row.FD_TYPE_CODE + ' not implemented');
            break;
        }
      } else if (action === 'delete-draft') {
        await this.cityLedgerService.deleteDraftFiscalDocument({ FD_ID: row.FD_ID });
      } else if (action === 'convert-to-invoice') {
        await this.cityLedgerService.issueInvoiceFromDraft({ FD_ID: row.FD_ID });
      }
      this.fetchRequested.emit();
    } finally {
      this.isConfirming = false;
      this.pendingAction = null;
    }
  }

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
    const base = [
      this.columnHelper.accessor('FD_STATUS_CODE', {
        header: 'Status',
        cell: info => <ir-cl-status-tag transaction={info.row.original}></ir-cl-status-tag>,
      }),
      this.columnHelper.accessor('ISSUE_DATE_DISPLAY', {
        header: 'Date',
        cell: info => info.getValue(),
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
            class="fiscal-table__doc-number"
          >
            {info.getValue() ?? ''}
          </wa-button>
        ),
      }),
      this.columnHelper.accessor('FD_TYPE_NAME', {
        id: 'type',
        header: 'Type',
        cell: info => (
          <div>
            <p class="m-0 p-0">{info.getValue()}</p>
            {/* {[FdTypes.CreditNote, FdTypes.CreditReceipt].includes(info.row.original.FD_TYPE_CODE as any) && <p class="fd_ss">for {info.row.original.EXTERNAL_REF}</p>} */}
            {info.row.original.EXTERNAL_REF && (
              <p class="fd_ss">
                {[FdTypes.CreditNote, FdTypes.CreditReceipt].includes(info.row.original.FD_TYPE_CODE as any) ? 'for' : 'voided by'} {info.row.original.EXTERNAL_REF}
              </p>
            )}
          </div>
        ),
      }),
    ];

    const amountCols = this.taxableOnly
      ? [
          this.columnHelper.accessor('NET_AMOUNT', {
            header: 'Net Amount',
            cell: info => this.renderMoney(info.getValue(), info.row.original.CURRENCY_ID),
          }),
          this.columnHelper.accessor('TAX_AMOUNT', {
            header: 'Taxes',
            cell: info => this.renderMoney(info.getValue(), info.row.original.CURRENCY_ID),
          }),
        ]
      : [];
    // : [
    //     this.columnHelper.accessor('TOTAL_AMOUNT', {
    //       id: 'amount',
    //       header: 'Amount (incl. taxes)',
    //       cell: info => this.renderMoney(info.getValue(), info.row.original.CURRENCY_ID),
    //     }),
    //   ];

    return [
      ...base,
      ...amountCols,
      this.columnHelper.accessor('DEBIT', {
        header: 'Debit',
        cell: info => (info.row.original.FD_TYPE_CODE === FdTypes.CreditReceipt ? '' : this.renderMoney(info.getValue(), info.row.original.CURRENCY_ID)),
      }),
      this.columnHelper.accessor('CREDIT', {
        header: 'Credit',
        cell: info => this.renderMoney(this.getCredit(info), info.row.original.CURRENCY_ID),
      }),
      this.columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: info => {
          const row = info.row.original;
          const isDraft = row.FD_TYPE_CODE === FdTypes.Draft;
          // const isPaid = row.FD_STATUS_CODE === 'INV';
          const isInvoice = row.FD_TYPE_CODE === FdTypes.Invoice;
          const isReceipt = row.FD_TYPE_CODE === FdTypes.Receipt;
          return (
            <wa-dropdown
              onwa-hide={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
              }}
              onwa-select={(e: CustomEvent<{ item: { value: string } }>) => {
                this.handleAction(e.detail.item.value, row);
              }}
            >
              <wa-button slot="trigger" size="small" variant="neutral" appearance="plain" class="fiscal-table__action-trigger">
                <wa-icon name="ellipsis-vertical" style={{ fontSize: '1.2rem' }}></wa-icon>
              </wa-button>

              {isDraft
                ? [
                    <wa-dropdown-item value="preview">Preview</wa-dropdown-item>,
                    <wa-dropdown-item value="convert-to-invoice">Convert to invoice</wa-dropdown-item>,
                    <wa-dropdown-item value="delete-draft" variant="danger">
                      Delete
                    </wa-dropdown-item>,
                  ]
                : [
                    <wa-dropdown-item value="view">View document</wa-dropdown-item>,

                    <wa-dropdown-item value="print">Print</wa-dropdown-item>,

                    // <wa-dropdown-item value="download">Download PDF</wa-dropdown-item>,

                    // (!isPaid || !isInvoice) && <wa-divider></wa-divider>,

                    // !isPaid && <wa-dropdown-item value="send-reminder">Send Reminder</wa-dropdown-item>,

                    // !isPaid && isInvoice && <wa-dropdown-item value="apply-payment">Apply Payment</wa-dropdown-item>,

                    // !isPaid && <wa-dropdown-item value="mark-paid">Mark as Paid</wa-dropdown-item>,

                    // <wa-divider></wa-divider>,

                    isInvoice && info.row.original.FD_STATUS_CODE !== FdStatus.Voided && (
                      <wa-dropdown-item value="void">
                        <span class="fiscal-table__action-danger">Void with credit note</span>
                      </wa-dropdown-item>
                    ),
                    isReceipt && info.row.original.FD_STATUS_CODE !== FdStatus.Voided && (
                      <wa-dropdown-item value="void">
                        <span class="fiscal-table__action-danger">Void with credit receipt</span>
                      </wa-dropdown-item>
                    ),
                  ]}
            </wa-dropdown>
          );
        },
        enableSorting: false,
      }),
    ];
  }

  private getSymbol(currencyId: number): string {
    const match = this.currencies.find(c => c.id === currencyId);
    return match?.symbol ?? this.currencySymbol;
  }

  private renderMoney(value: number, currencyId: number) {
    if (!value) return <span class="fiscal-table__cell--zero"></span>;
    return <span>{formatAmount(this.getSymbol(currencyId), value)}</span>;
  }

  render() {
    if (!this.hasFetched) {
      const hasDate = !!(this.fromDate || this.toDate);
      return (
        <Host>
          <div class="fiscal-table__date-prompt">
            <div class="fiscal-table__date-prompt-icon">
              <wa-icon name="calendar-days"></wa-icon>
            </div>
            <p class="fiscal-table__date-prompt-title">Select a date range to get started</p>
            {hasDate && (
              <wa-animation iterations={1} play id="cleanAnimation" class="clean-button" name="rubberBand" easing="ease-in-out" duration={800}>
                <ir-custom-button size="small" variant="brand" onClickHandler={() => this.fetchRequested.emit()}>
                  <wa-icon slot="start" name="magnifying-glass"></wa-icon>
                  Load Documents
                </ir-custom-button>
              </wa-animation>
            )}
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

    return (
      <Host>
        <div class="table--container">
          <table class="table data-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      class={{
                        'fiscal-table__heading--numeric': ['NET_AMOUNT', 'TAX_AMOUNT', 'amount', 'DEBIT', 'CREDIT'].includes(header.column.id),
                        'fiscal-table__heading--actions': header.column.id === 'actions',
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} class={{ 'ir-table-row': true, '--is-draft': row.original.FD_TYPE_CODE === FdTypes.Draft }}>
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      class={{
                        'fiscal-table__cell': true,
                        'fiscal-table__cell--numeric': ['NET_AMOUNT', 'TAX_AMOUNT', 'amount', 'DEBIT', 'CREDIT'].includes(cell.column.id),
                        'fiscal-table__cell--actions': cell.column.id === 'actions',
                        'fiscal-table__cell--doc-number': cell.column.id === 'DOC_NUMBER',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}

              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td class="empty-row" colSpan={this.columns.length}>
                    {this.isLoading ? <ir-spinner></ir-spinner> : 'No fiscal documents match the current filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <ir-fd-confirm-dialog
          open={this.pendingAction !== null}
          action={this.pendingAction?.action ?? null}
          docNumber={this.pendingAction?.row.DOC_NUMBER ?? 'this document'}
          isConfirming={this.isConfirming}
          onConfirmed={() => this.confirmPendingAction()}
          onCancelled={() => (this.pendingAction = null)}
        ></ir-fd-confirm-dialog>
      </Host>
    );
  }
}
