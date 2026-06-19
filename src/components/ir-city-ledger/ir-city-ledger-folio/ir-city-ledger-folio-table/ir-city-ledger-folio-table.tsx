import { formatAmount } from '@/utils/utils';
import { flexRender, useTable } from '@/utils/useTable';
import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { type Cell, type TableState, type Updater, createColumnHelper, getCoreRowModel, getExpandedRowModel, getGroupedRowModel, getSortedRowModel } from '@tanstack/table-core';
import type { PaginationChangeEvent } from '@/components/ir-pagination/ir-pagination';
import moment from 'moment';
import { type FolioRow } from '../types';
import type { ICurrency } from '@/models/property';
import { actionableClTypes } from '@/services/city-ledger.service';
import { ClTxTypeCode } from '@/types/enums';

const DATE_DISPLAY_FORMAT = 'MMM DD, YYYY';
const DATE_INPUT_FORMAT = 'YYYY-MM-DD';

@Component({
  tag: 'ir-city-ledger-folio-table',
  styleUrl: 'ir-city-ledger-folio-table.css',
  scoped: true,
})
export class IrCityLedgerFolioTable {
  private handleAction(value: string, row: FolioRow) {
    switch (value) {
      case 'hold-transaction':
        this.holdTargetRow = row;
        this.holdDialogRef.openModal();
        break;
      case 'edit-transaction':
        this.editEntry.emit(row._raw);
        break;
      case 'delete-transaction':
        this.deleteEntry.emit(row._raw);
        break;
    }
  }
  // ─── Props ───────────────────────────────────────────────────────────────
  @Prop() agentId: number | null = null;
  @Prop() propertyId: number;
  @Prop() ticket: string;
  @Prop() language: string = 'en';
  @Prop() data: FolioRow[] = [];
  @Prop() isLoading: boolean = false;
  @Prop() startingBalance: number = 0;
  @Prop() closingBalance: number = 0;
  @Prop() totalCount: number = 0;
  @Prop() pageIndex: number = 0;
  @Prop() pageSize: number = 25;
  @Prop() fromDate: string = '';
  @Prop() toDate: string = '';
  @Prop() hasFetched: boolean = false;
  @Prop() currencySymbol: string = '$';
  @Prop() currencies: ICurrency[] = [];
  @Prop() hideBalanceInfo: boolean = false;

  // ─── State ───────────────────────────────────────────────────────────────
  @State() private tableState: Partial<TableState> = {};
  @State() private selectedRowIds: Set<string> = new Set();
  @State() private holdTargetRow: FolioRow | null = null;
  @State() private bookingDrawerOpen: boolean = false;
  @State() private selectedBookingNumber: string | null = null;

  // ─── Events ──────────────────────────────────────────────────────────────
  @Event() pageChange: EventEmitter<{ pageIndex: number; pageSize: number }>;
  @Event() generateInvoice: EventEmitter<FolioRow[]>;
  @Event() fetchRequested: EventEmitter<void>;
  @Event() editEntry: EventEmitter<FolioRow['_raw']>;
  @Event() deleteEntry: EventEmitter<FolioRow['_raw']>;

  // ─── Private fields ──────────────────────────────────────────────────────
  private columnHelper = createColumnHelper<FolioRow>();
  private pageSizes = [25, 50, 100];
  private holdDialogRef: HTMLIrHoldTransactionDialogElement;

  // ─── Utilities ───────────────────────────────────────────────────────────

  private formatDate(date: string): string {
    if (!date) return '';
    const m = moment(date, [DATE_INPUT_FORMAT, moment.ISO_8601], true);
    return m.isValid() ? m.format(DATE_DISPLAY_FORMAT) : date;
  }

  // ─── Selection ────────────────────────────────────────────────────────────

  private get selectedUnbilledRows(): FolioRow[] {
    return this.data.filter(row => this.selectedRowIds.has(row._rowId) && row.status?.label === 'Unbilled');
  }

  private handleHoldToggled(rowId: string, newIsHold: boolean) {
    // Note: optimistic local update — parent will re-fetch on next search
    const updatedData = this.data.map(row => {
      if (row._rowId !== rowId) return row;
      const updatedRaw: typeof row._raw = { ...row._raw, IS_HOLD: newIsHold };
      const status = newIsHold ? { id: 'held', label: 'Held', variant: 'warning', description: '' } : { id: 'unbilled', label: 'Unbilled', variant: 'neutral', description: '' };
      return { ...row, _raw: updatedRaw, status };
    });
    // Trigger re-render by reassigning (Stencil tracks Prop changes via reference)
    // Since data is a Prop we can't mutate it — we use a local state for optimistic UI
    this._localDataOverride = updatedData;
    this.holdTargetRow = null;
  }

  // Local override for optimistic hold/revert updates
  @State() private _localDataOverride: FolioRow[] | null = null;

  @Watch('data')
  onDataChange() {
    this._localDataOverride = null;
  }

  private get displayData(): FolioRow[] {
    return this._localDataOverride ?? this.data;
  }

  // ─── Currency helpers ─────────────────────────────────────────────────────

  private getSymbol(currencyId: number): string {
    const match = this.currencies.find(c => c.id === currencyId);
    return match?.symbol ?? this.currencySymbol;
  }

  // ─── Column definitions ──────────────────────────────────────────────────

  private columns = [
    this.columnHelper.accessor(row => row.status.label, {
      id: 'status',
      header: 'Status',
      size: 200,
      cell: info => {
        if (info?.row?.original?._raw?.CL_TX_TYPE_CODE === ClTxTypeCode.OpeningBalance) {
          return null;
        }
        return (
          <div class="folio-table__status-cell">
            <ir-cl-status-tag transaction={info.row.original}></ir-cl-status-tag>
          </div>
        );
      },
      enableGrouping: true,
      enableSorting: false,
    }),
    this.columnHelper.accessor('serviceDate', {
      enableSorting: false,
      header: 'Service Date',
      cell: info => this.formatDate(info.getValue()),
      aggregatedCell: info => this.formatDate(info.getValue()),
      enableGrouping: false,
      aggregationFn: (columnId, leafRows) => {
        if (!leafRows.length) return undefined;
        const dates = leafRows
          .map(row => row.getValue<string>(columnId))
          .filter(Boolean)
          .map(date => new Date(date));
        if (!dates.length) return undefined;
        const latest = new Date(Math.max(...dates.map(d => d.getTime())));
        return latest.toISOString().split('T')[0];
      },
    }),
    this.columnHelper.accessor('bookingNumber', {
      header: 'Booking #',
      cell: info => {
        const val = info.getValue();
        if (!val) return null;
        return (
          <ir-custom-button
            link
            onClickHandler={() => {
              this.selectedBookingNumber = val as any;
              this.bookingDrawerOpen = true;
            }}
          >
            {val}
          </ir-custom-button>
        );
      },
      enableGrouping: true,
      enableSorting: false,
    }),
    this.columnHelper.accessor('description', {
      header: 'Description',
      cell: info => <span class="folio-table__description">{info.getValue()}</span>,
      enableSorting: false,
      enableGrouping: true,
    }),
    this.columnHelper.accessor('docNumber', {
      header: 'Fiscal Doc',
      cell: info => <span>{info.getValue()}</span>,
      enableSorting: false,
      enableGrouping: true,
    }),
    this.columnHelper.accessor('debit', {
      header: 'Debit',
      cell: info => {
        const symbol = this.getSymbol(info.row.original._raw.CURRENCY_ID);
        return (
          <ir-input-cell disabled={true} mask={'price'} value={info.getValue().toString()}>
            <span slot="start">{symbol}</span>
            <span>{info.getValue() ? formatAmount(symbol, info.getValue()) : ''}</span>
          </ir-input-cell>
        );
      },
      aggregatedCell: info => <span style={{ padding: 'var(--ir-cell-padding)' }}>{formatAmount(this.currencySymbol, Number(info.getValue()))}</span>,
      aggregationFn: 'sum',
      enableGrouping: false,
      enableSorting: false,
    }),
    this.columnHelper.accessor('credit', {
      header: 'Credit',
      cell: info => {
        const symbol = this.getSymbol(info.row.original._raw.CURRENCY_ID);
        return (
          <ir-input-cell mask={'price'} disabled={true} value={info.getValue().toString()}>
            <span slot="start">{symbol}</span>
            <span>{info.getValue() ? formatAmount(symbol, info.getValue()) : ''}</span>
          </ir-input-cell>
        );
      },
      aggregatedCell: info => <span style={{ padding: 'var(--ir-cell-padding)' }}>{formatAmount(this.currencySymbol, Number(info.getValue()))}</span>,
      aggregationFn: 'sum',
      enableSorting: false,
      enableGrouping: false,
    }),
    this.columnHelper.accessor('balance', {
      header: 'Balance',
      cell: info => {
        const symbol = this.getSymbol(info.row.original._raw.CURRENCY_ID);
        return (
          <ir-input-cell disabled={true} mask={'price'} value={info.getValue().toString()}>
            <span slot="start">{symbol}</span>
            <span>{info.getValue() ? formatAmount(symbol, +info.getValue()) : ''}</span>
          </ir-input-cell>
        );
      },
      enableSorting: false,
      enableGrouping: false,
    }),
    this.columnHelper.display({
      id: 'actions',
      header: 'Actions',
      size: 48,
      cell: info => {
        const row = info.row.original;
        if (row._raw.IS_LOCKED || row._raw.CL_TX_TYPE_CODE === ClTxTypeCode.OpeningBalance) return <div class={'fiscal-table__action-trigger --placeholder'}></div>;
        const canEditOrDelete = actionableClTypes.has(row._raw.CL_TX_TYPE_CODE as any) && !row._raw.CATEGORY;
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
            <wa-button slot="trigger" size="s" variant="neutral" appearance="plain" class="fiscal-table__action-trigger">
              <wa-icon name="ellipsis-vertical" style={{ fontSize: '1rem' }}></wa-icon>
            </wa-button>
            <wa-dropdown-item value="hold-transaction">{row._raw.IS_HOLD ? 'Revert to Unbilled' : 'Hold entry'}</wa-dropdown-item>
            {canEditOrDelete && <wa-dropdown-item value="edit-transaction">Edit</wa-dropdown-item>}
            {canEditOrDelete && (
              <wa-dropdown-item value="delete-transaction" variant="danger">
                Delete
              </wa-dropdown-item>
            )}
          </wa-dropdown>
        );
      },
      enableSorting: false,
      enableGrouping: false,
    }),
  ];

  // ─── Table state ─────────────────────────────────────────────────────────

  private onTableStateChange = (updater: Updater<TableState>) => {
    const nextState = typeof updater === 'function' ? updater(this.tableState as TableState) : updater;
    if (JSON.stringify(this.tableState) === JSON.stringify(nextState)) return;
    this.tableState = nextState;
  };

  private renderCell = (cell: Cell<FolioRow, unknown>) => {
    if (cell.getIsGrouped()) {
      return (
        <wa-button appearance="plain" size="s" class="group-expander" onClick={() => cell.row.toggleExpanded()}>
          <wa-icon style={{ fontSize: '0.875rem' }} slot="start" name={cell.row.getIsExpanded() ? 'chevron-down' : 'chevron-up'}></wa-icon>
          {flexRender(cell.column.columnDef.cell, cell.getContext())} <span slot="end">({cell.row.subRows.length})</span>
        </wa-button>
      );
    }
    if (cell.getIsAggregated()) {
      return flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext());
    }
    if (cell.getIsPlaceholder()) return null;
    return flexRender(cell.column.columnDef.cell, cell.getContext());
  };

  // ─── Render helpers ──────────────────────────────────────────────────────

  private renderTableHead(table: ReturnType<typeof useTable<FolioRow>>) {
    return (
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => {
              const canSort = header.column.getCanSort();
              const canGroup = header.column.getCanGroup();
              // const isGrouped = header.column.getIsGrouped();
              // const sortDirection = header.column.getIsSorted();
              const isNumericCol = ['debit', 'credit', 'balance'].includes(header.column.id);
              return (
                <th
                  key={header.id}
                  class={{
                    'booking_heading': !header.isPlaceholder,
                    'cell--align-end': isNumericCol,
                    'cell--align-center': header.column.id === 'select',
                    'folio-table__heading--actions': header.column.id === 'actions',
                    'sticky-column': header.column.id === 'status',
                    'folio-table__select-col': header.column.id === 'select',
                  }}
                  style={header.column.id === 'bookingNumber' ? { paddingInline: '0' } : undefined}
                >
                  {!header.isPlaceholder && (
                    <div
                      class={{
                        'heading_container': true,
                        'heading_container--between': canSort || canGroup,
                        'heading_container--end': isNumericCol,
                      }}
                    >
                      <div
                        class={{
                          'folio-table__col-label': true,
                          'folio-table__col-label--end': isNumericCol,
                          'folio-table__col-label--center': header.column.id === 'select',
                        }}
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {/* {isGrouped && <wa-icon style={{ fontSize: '0.875rem', color: 'var(--wa-color-brand-fill-loud)' }} name="object-group"></wa-icon>}
                        {sortDirection && (
                          <wa-icon style={{ fontSize: '0.875rem', color: 'var(--wa-color-brand-fill-loud)' }} name={sortDirection === 'desc' ? 'arrow-up' : 'arrow-down'}></wa-icon>
                        )} */}
                      </div>

                      {/* {(canSort || canGroup) && (
                        <wa-dropdown
                          onwa-select={e => {
                            switch ((e.detail as any).item.value) {
                              case 'order-asc':
                                header.column.toggleSorting(true);
                                break;
                              case 'order-desc':
                                header.column.toggleSorting(false);
                                break;
                              case 'order-clear':
                                header.column.clearSorting();
                                break;
                              case 'group':
                                header.column.toggleGrouping();
                                break;
                            }
                          }}
                          style={{ fontWeight: '400' }}
                        >
                          <wa-button slot="trigger" size="s" variant="neutral" appearance="plain" class="header-button">
                            <wa-icon name="ellipsis-vertical"></wa-icon>
                          </wa-button>
                          {canSort && (
                            <Fragment>
                              {sortDirection !== 'desc' && (
                                <wa-dropdown-item value="order-asc">
                                  <wa-icon slot="icon" name="arrow-up"></wa-icon>
                                  Sort Ascending
                                </wa-dropdown-item>
                              )}
                              {sortDirection !== 'asc' && (
                                <wa-dropdown-item value="order-desc">
                                  <wa-icon slot="icon" name="arrow-down"></wa-icon>
                                  Sort Descending
                                </wa-dropdown-item>
                              )}
                              {sortDirection && (
                                <wa-dropdown-item value="order-clear">
                                  <wa-icon slot="icon" name="up-down"></wa-icon>
                                  Clear Sort
                                </wa-dropdown-item>
                              )}
                            </Fragment>
                          )}
                          {canGroup && (
                            <wa-dropdown-item value="group">
                              <wa-icon slot="icon" name={isGrouped ? 'object-ungroup' : 'object-group'}></wa-icon>
                              {isGrouped ? 'UnGroup' : 'Group'}
                            </wa-dropdown-item>
                          )}
                        </wa-dropdown>
                      )} */}
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
    );
  }

  private renderStartingBalanceRow() {
    return (
      <tr class="ir-table-row balance-row balance-row--start">
        <td class="sticky-column"></td>
        <td>{this.formatDate(this.fromDate)}</td>
        <td></td>
        <td>
          <wa-icon name="scale-balanced" style={{ marginRight: '0.375rem', fontSize: '0.875rem' }}></wa-icon>
          Starting Balance
        </td>
        <td></td>
        <td class="cell--align-end">{this.startingBalance >= 0 ? formatAmount(this.currencySymbol, this.startingBalance) : ''}</td>
        <td class="cell--align-end">{this.startingBalance < 0 ? formatAmount(this.currencySymbol, this.startingBalance) : ''}</td>
        <td class="cell--align-end">{formatAmount(this.currencySymbol, this.startingBalance)}</td>
        <td></td>
      </tr>
    );
  }

  private renderEndingBalanceRow() {
    return (
      <tr class="ir-table-row balance-row balance-row--end">
        <td class="sticky-column"></td>
        <td>{this.formatDate(this.toDate)}</td>
        <td></td>
        <td>
          <wa-icon name="scale-balanced" style={{ marginRight: '0.375rem', fontSize: '0.875rem' }}></wa-icon>
          Ending Balance
        </td>
        <td></td>
        <td class="cell--align-end">{this.closingBalance >= 0 ? formatAmount(this.currencySymbol, Math.abs(this.closingBalance)) : ''}</td>
        <td class="cell--align-end">{this.closingBalance < 0 ? formatAmount(this.currencySymbol, Math.abs(this.closingBalance)) : ''}</td>
        <td class="cell--align-end">
          {this.closingBalance < 0 ? '-' : ''}
          {formatAmount(this.currencySymbol, Math.abs(this.closingBalance))}
        </td>
        <td></td>
      </tr>
    );
  }

  private renderDataRows(table: ReturnType<typeof useTable<FolioRow>>) {
    const rows = table.getRowModel().rows;
    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={this.columns.length + 1} class="empty-row">
            <ir-empty-state></ir-empty-state>
          </td>
        </tr>
      );
    }
    return rows.map(row => {
      const isSelected = this.selectedRowIds.has(row.original._rowId);
      return (
        <tr key={row.id} class={{ 'ir-table-row': true, 'folio-table__row--selected': isSelected }}>
          {row.getVisibleCells().map(cell => (
            <td
              key={cell.id}
              class={{
                'cell--align-end': ['debit', 'credit', 'balance'].includes(cell.column.id),
                'cell--align-center': cell.column.id === 'select',
                'sticky-column': cell.column.id === 'status',
                'input-column': ['debit', 'credit', 'balance'].includes(cell.column.id),
                'grouped-cell': cell.getIsGrouped(),
                'folio-table__cell--actions': cell.column.id === 'actions',
                'folio-table__select-col': cell.column.id === 'select',
              }}
            >
              {this.renderCell(cell)}
            </td>
          ))}
        </tr>
      );
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  render() {
    if (!this.agentId) {
      return (
        <Host>
          <div class="folio-table__empty-state">
            <wa-icon name="building-columns" style={{ fontSize: '2.5rem', opacity: '0.3' }}></wa-icon>
            <p>Select an agent to view the folio ledger.</p>
          </div>
        </Host>
      );
    }

    if (!this.hasFetched) {
      const hasDate = !!(this.fromDate || this.toDate);
      return (
        <Host>
          <div class="folio-table__date-prompt">
            <div class="folio-table__date-prompt-icon">
              <wa-icon name="calendar-days"></wa-icon>
            </div>
            <p class="folio-table__date-prompt-title">Select a date range to get started</p>
            {hasDate && (
              <wa-animation play iterations={1} id="cleanAnimation" class="clean-button" name="rubberBand" easing="ease-in-out" duration={800}>
                <ir-custom-button size="s" variant="brand" onClickHandler={() => this.fetchRequested.emit()}>
                  <wa-icon slot="start" name="magnifying-glass"></wa-icon>
                  Load Transactions
                </ir-custom-button>
              </wa-animation>
            )}
          </div>
        </Host>
      );
    }

    if (this.isLoading) {
      return (
        <Host>
          <div class="folio-table__loading">
            <ir-spinner></ir-spinner>
          </div>
        </Host>
      );
    }

    const visibleColumns = this.hideBalanceInfo ? this.columns.filter(c => (c as any).accessorKey !== 'balance') : this.columns;

    const table = useTable<FolioRow>({
      data: this.displayData,
      columns: visibleColumns,
      state: this.tableState,
      enableGrouping: false,
      onStateChange: this.onTableStateChange,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getGroupedRowModel: getGroupedRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
    });

    const total = this.totalCount;
    const pageCount = Math.ceil(total / this.pageSize);
    const showingFrom = total ? this.pageIndex * this.pageSize + 1 : 0;
    const showingTo = total ? Math.min(this.pageIndex * this.pageSize + this.displayData.length, total) : 0;

    const hasUnbilledSelected = this.selectedUnbilledRows.length > 0;
    return (
      <Host>
        {hasUnbilledSelected && (
          <div class="folio-table__invoice-bar">
            <span class="folio-table__invoice-bar-text">
              <wa-icon name="file-invoice" style={{ marginRight: '0.375rem' }}></wa-icon>
              {this.selectedUnbilledRows.length} unbilled item{this.selectedUnbilledRows.length !== 1 ? 's' : ''} selected
            </span>
            <ir-custom-button size="s" variant="brand" onClickHandler={() => this.generateInvoice.emit(this.selectedUnbilledRows)}>
              <wa-icon slot="start" name="file-invoice-dollar"></wa-icon>
              Generate Invoice
            </ir-custom-button>
            <ir-custom-button size="s" variant="neutral" appearance="outlined" onClickHandler={() => (this.selectedRowIds = new Set())}>
              Clear Selection
            </ir-custom-button>
          </div>
        )}

        <div class="table--container">
          <table class="table data-table">
            {this.renderTableHead(table)}
            <tbody>
              {!this.hideBalanceInfo && this.renderStartingBalanceRow()}
              {this.renderDataRows(table)}
              {!this.hideBalanceInfo && this.renderEndingBalanceRow()}
            </tbody>
          </table>
        </div>

        <ir-pagination
          class="data-table--pagination"
          total={total}
          pages={pageCount}
          pageSize={this.pageSize}
          currentPage={this.pageIndex + 1}
          allowPageSizeChange={true}
          showing={{ from: showingFrom, to: showingTo }}
          pageSizes={this.pageSizes}
          recordLabel={''}
          onPageChange={(event: CustomEvent<PaginationChangeEvent>) => {
            event.stopPropagation();
            this.pageChange.emit({ pageIndex: event.detail.currentPage - 1, pageSize: this.pageSize });
          }}
          onPageSizeChange={(event: CustomEvent<PaginationChangeEvent>) => {
            event.stopPropagation();
            if (event.detail.pageSize) {
              this.pageChange.emit({ pageIndex: 0, pageSize: event.detail.pageSize });
            }
          }}
        ></ir-pagination>

        <ir-hold-transaction-dialog
          row={this.holdTargetRow}
          currencySymbol={this.currencySymbol}
          ref={el => (this.holdDialogRef = el as HTMLIrHoldTransactionDialogElement)}
          onHoldToggled={e => this.handleHoldToggled(e.detail.rowId, e.detail.newIsHold)}
        ></ir-hold-transaction-dialog>

        <ir-booking-details-drawer
          open={this.bookingDrawerOpen}
          propertyId={this.propertyId}
          ticket={this.ticket}
          language={this.language}
          bookingNumber={this.selectedBookingNumber}
          onBookingDetailsDrawerClosed={() => (this.bookingDrawerOpen = false)}
        ></ir-booking-details-drawer>
      </Host>
    );
  }
}
