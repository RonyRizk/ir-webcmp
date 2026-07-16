import { formatAmount, getEntryValue } from '@/utils/utils';
import { flexRender, useTable } from '@/utils/useTable';
import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import type { ClFiscalDocumentPreviewRequest } from '@components/ir-city-ledger/ir-city-ledger-fiscal-documents/ir-cl-fiscal-document-preview/types';
import type { PaginationChangeEvent } from '@/components/ir-pagination/ir-pagination';
import { CellContext, createColumnHelper, getCoreRowModel, getSortedRowModel } from '@tanstack/table-core';
import type { ICurrency, IEntries } from '@/models/property';
import type { FiscalDocumentRow, FiscalFolioType } from '../types';
import type { GuestDocumentPreviewRequest } from '../ir-guest-document-preview/types';
import moment from 'moment';
import calendar_data from '@/stores/calendar-data';
import { FdTypes } from '@/types/enums';

const PAGE_SIZES = [20, 50, 100];
@Component({
  tag: 'ir-fiscal-documents-table',
  styleUrl: 'ir-fiscal-documents-table.css',
  scoped: true,
})
export class IrFiscalDocumentsTable {
  @Prop() rows: FiscalDocumentRow[] = [];
  @Prop() currencies: ICurrency[] = [];
  @Prop() isLoading: boolean = false;
  @Prop() hasDates: boolean = false;
  @Prop() ticket: string;
  @Prop() propertyId: number;
  @Prop() language: string = 'en';
  /** `_FD_TYPE` setup entries used to display the document type. */
  @Prop() fdTypes: IEntries[] = [];
  @Prop() fromDate: string | null = null;
  @Prop() toDate: string | null = null;
  @Prop() hasFetched: boolean = false;

  /** Folio scope driving which identity columns are shown. */
  @Prop() folioType: FiscalFolioType = 'all';
  @Prop() taxableOnly: boolean = false;
  /** Selected agent id (when a specific agent is chosen under the agent folio). */
  @Prop() agentId: number | null = null;
  /** Selected guest id (when a specific guest is chosen under the guest folio). */
  @Prop() guestId: number | null = null;

  // Pagination (server-side) — driven by the parent.
  @Prop() currentPage: number = 1;
  @Prop() pageSize: number = 20;
  @Prop() totalRecords: number = 0;
  @Prop() pageSizes: number[] = [20, 50, 100];

  @Event() clFiscalDocumentPreview: EventEmitter<ClFiscalDocumentPreviewRequest>;
  @Event() fetchRequested: EventEmitter<void>;
  @Event() requestPageChange: EventEmitter<PaginationChangeEvent>;
  @Event() requestPageSizeChange: EventEmitter<PaginationChangeEvent>;
  /** Emitted with the booking number when a booking link is clicked. */
  @Event() openBookingDetails: EventEmitter<string>;
  /** Emitted when a guest document link/action is clicked (caught by ir-guest-document-preview). */
  @Event() guestDocumentPreview: EventEmitter<GuestDocumentPreviewRequest>;

  private columnHelper = createColumnHelper<FiscalDocumentRow>();

  private emitGuestPreview(row: FiscalDocumentRow) {
    this.guestDocumentPreview.emit({
      documentNumber: row.DOC_NUMBER ?? '',
      fdTypeCode: row.FD_TYPE_CODE ?? '',
      bookingNumber: row.BOOKING_NUMBER ?? '',
    });
  }

  private handlePageChange(event: CustomEvent<PaginationChangeEvent>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.requestPageChange.emit(event.detail);
  }

  private handlePageSizeChange(event: CustomEvent<PaginationChangeEvent>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.requestPageSizeChange.emit(event.detail);
  }

  /** Agent column is hidden for the guest folio (those rows have no agent). */
  private get showAgentName(): boolean {
    return this.folioType !== 'guest' && !this.agentId;
  }

  /** Guest column is hidden for the agent folio (those rows have no guest). */
  private get showGuestName(): boolean {
    return this.folioType !== 'agent' && !this.guestId;
  }

  /** Maps each `_FD_TYPE` code to its localized display label. */
  private get fdTypeLabels(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const entry of this.fdTypes ?? []) {
      map[entry.CODE_NAME] = getEntryValue({ entry, language: this.language });
    }
    return map;
  }

  private emitPreview(row: FiscalDocumentRow, autoPrint = false) {
    this.clFiscalDocumentPreview.emit({
      fdTypeCode: row.FD_TYPE_CODE ?? '',
      documentNumber: row.DOC_NUMBER ?? '',
      agentId: row.AGENT_ID ?? this.agentId ?? 0,
      agentName: row.AGENT_NAME ?? '',
      fdId: row.DOC_ID ?? undefined,
      autoPrint,
      externalRef: '',
      fromDate: this.fromDate,
      toDate: this.toDate,
      bookingNbr: row.BOOKING_NUMBER ?? null,
    });
  }
  private getCredit(info: CellContext<FiscalDocumentRow, number>): number {
    const { FD_TYPE_CODE } = info.row.original;
    const value = info.getValue();

    switch (FD_TYPE_CODE) {
      case FdTypes.CreditReceipt:
        return -Math.abs(value);

      case FdTypes.Receipt:
        return Math.abs(value);

      default:
        return value;
    }
  }
  private get columns() {
    const base = [
      this.columnHelper.accessor('DOC_DATE', {
        header: 'Date',
        cell: info => moment(info.getValue(), 'YYYY-MM-DD').format('MMM DD, YYYY') ?? '',
        enableSorting: true,
      }),
      this.columnHelper.accessor('DOC_NUMBER', {
        header: 'Doc Number',
        cell: info => {
          const row = info.row.original;
          const value = info.getValue() ?? '';
          if (!value) return <span></span>;
          // Agent documents open the city-ledger fiscal-document preview; guest
          // documents open the invoice/credit-note PDF (ir-guest-billing flow).
          const onClick = row.TARGET_TYPE === 'GUEST' ? () => this.emitGuestPreview(row) : () => this.emitPreview(row);
          return (
            <wa-button onClick={onClick} variant="brand" appearance="plain" class="fiscal-table__doc-number">
              {value}
            </wa-button>
          );
        },
      }),
      this.columnHelper.accessor('DOC_TYPE', {
        id: 'type',
        header: 'Type',
        cell: info => {
          const code = info.row.original.FD_TYPE_CODE;
          // Display the localized `_FD_TYPE` label, falling back to the raw code.
          const label = (code && this.fdTypeLabels[code === 'RFND' ? FdTypes.CreditReceipt : code]) || code || '';
          return <span>{label}</span>;
        },
      }),
    ];

    // Identity / booking columns depend on the folio scope.
    const identityCols = [];
    if (this.showAgentName && this.rows.some(r => r.TARGET_TYPE === 'AGENT')) {
      identityCols.push(
        this.columnHelper.accessor('AGENT_NAME', {
          id: 'agentName',
          header: 'Agent',
          cell: info => <span>{info.getValue() ?? ''}</span>,
        }),
      );
    }

    if (this.showGuestName && this.rows.some(r => r.TARGET_TYPE === 'GUEST')) {
      identityCols.push(
        this.columnHelper.accessor('GUEST_NAME', {
          id: 'guestName',
          header: 'Guest',
          cell: info => <span>{info.getValue() ?? ''}</span>,
        }),
      );
    }
    identityCols.push(
      this.columnHelper.accessor('BOOKING_NUMBER', {
        id: 'bookingNumber',
        header: 'Booking #',
        cell: info => {
          const bookingNbr = info.getValue();
          if (!bookingNbr) return <span></span>;
          return (
            <wa-button onClick={() => this.openBookingDetails.emit(String(bookingNbr))} variant="brand" appearance="plain" class="fiscal-table__doc-number">
              {bookingNbr}
            </wa-button>
          );
        },
      }),
    );
    if (!this.taxableOnly) {
      identityCols.push(
        this.columnHelper.accessor('DEBIT', {
          header: 'Debit',
          cell: info => <span>{this.renderMoney(info.getValue())}</span>,
        }),
      );
      identityCols.push(
        this.columnHelper.accessor('CREDIT', {
          header: 'Credit',
          cell: info => <span>{this.renderMoney(this.getCredit(info))}</span>,
        }),
      );
    } else {
      identityCols.push(
        this.columnHelper.accessor('NET_AMOUNT', {
          header: 'Net amount',
          cell: info => <span>{this.renderMoney(info.getValue())}</span>,
        }),
      );
      identityCols.push(
        this.columnHelper.accessor('TAX_AMOUNT', {
          header: 'Tax amount',
          cell: info => <span>{this.renderMoney(info.getValue())}</span>,
        }),
      );
      identityCols.push(
        this.columnHelper.accessor('TOTAL_AMOUNT', {
          header: 'Total',
          cell: info => this.renderMoney(info.getValue()),
        }),
      );
    }

    return [
      ...base,
      ...identityCols,

      this.columnHelper.display({
        id: 'actions',
        header: 'Action',
        cell: info => {
          const row = info.row.original;
          return (
            <ir-custom-button
              appearance="plain"
              onClickHandler={() => {
                if (row.TARGET_TYPE === 'GUEST') {
                  this.emitGuestPreview(row);
                } else {
                  this.emitPreview(row);
                }
              }}
              variant="neutral"
            >
              <wa-icon name="eye"></wa-icon>
            </ir-custom-button>
          );
        },
        enableSorting: false,
      }),
    ];
  }

  private renderMoney(value: number | null | undefined) {
    if (!value) return <span class="fiscal-table__cell--zero"></span>;
    return <span>{formatAmount(calendar_data?.property?.currency?.symbol, value)}</span>;
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
                <ir-custom-button size="s" variant="brand" onClickHandler={() => this.fetchRequested.emit()}>
                  <wa-icon slot="start" name="magnifying-glass"></wa-icon>
                  Load Documents
                </ir-custom-button>
              </wa-animation>
            )}
          </div>
        </Host>
      );
    }

    const columns = this.columns;
    const table = useTable<FiscalDocumentRow>({
      data: this.rows,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
    });

    const numericColumnIds = ['TOTAL_AMOUNT', 'CREDIT', 'DEBIT', 'NET_AMOUNT', 'TAX_AMOUNT'];

    const totalPages = this.pageSize > 0 ? Math.ceil(this.totalRecords / this.pageSize) : 0;
    const showing = {
      from: this.totalRecords === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1,
      to: Math.min(this.currentPage * this.pageSize, this.totalRecords),
    };

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
                        'fiscal-table__heading--numeric': numericColumnIds.includes(header.column.id),
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
                <tr key={row.id} class="ir-table-row">
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      class={{
                        'fiscal-table__cell': true,
                        'fiscal-table__cell--numeric': numericColumnIds.includes(cell.column.id),
                        'fiscal-table__cell--actions': cell.column.id === 'actions',
                        'fiscal-table__cell--doc-number': cell.column.id === 'DOC_NUMBER' || cell.column.id === 'bookingNumber',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}

              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td class="empty-row" colSpan={columns.length}>
                    {this.isLoading ? <ir-spinner></ir-spinner> : 'No fiscal documents match the current filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {this.totalRecords > 0 && (
          <ir-pagination
            class="data-table--pagination"
            showing={showing}
            total={this.totalRecords}
            pages={totalPages}
            pageSize={this.pageSize}
            currentPage={this.currentPage}
            allowPageSizeChange={true}
            pageSizes={PAGE_SIZES}
            recordLabel="documents"
            onPageChange={event => this.handlePageChange(event as CustomEvent<PaginationChangeEvent>)}
            onPageSizeChange={event => this.handlePageSizeChange(event as CustomEvent<PaginationChangeEvent>)}
          ></ir-pagination>
        )}
      </Host>
    );
  }
}
