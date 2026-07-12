import { Component, h } from '@stencil/core';
import { createColumnHelper, getCoreRowModel } from '@tanstack/table-core';
import { flexRender, useTable } from '@/utils/useTable';
import type { PaginationChangeEvent } from '@/components/ir-pagination/ir-pagination';
import dp_report, { setDpReportTablePage, setDpReportTablePageSize } from '@/stores/dp_report.store';
import { formatAmount } from '@/utils/utils';
import { DpReportRow } from '../types';

@Component({
  tag: 'ir-dp-report-table',
  styleUrls: ['ir-dp-report-table.css', '../../../common/table.css'],
  scoped: true,
})
export class IrDpReportTable {
  private pageSizes = [20, 50, 100];
  private columnHelper = createColumnHelper<DpReportRow>();

  private columns = [
    this.columnHelper.display({
      id: 'booking_nbr',
      header: 'Booking #',
      cell: info => {
        const row = info.row.original;
        return <ir-booking-number-cell class="dp-report__booking-nbr-cell" bookingNumber={row.booking_nbr} origin={row.raw.origin}></ir-booking-number-cell>;
      },
    }),
    this.columnHelper.display({
      id: 'booked_on',
      header: 'Booked on',
      cell: info => <ir-booked-on-cell showTime={false} bookedOn={info.row.original.raw.booked_on}></ir-booked-on-cell>,
    }),
    this.columnHelper.display({
      id: 'booked_by',
      header: 'Booked by',
      cell: info => {
        const row = info.row.original;
        return <ir-booked-by-cell guest={row.raw.guest} identifier={row.booking_nbr} clickableGuest></ir-booked-by-cell>;
      },
    }),
    this.columnHelper.display({
      id: 'dates',
      header: 'Dates',
      cell: info => <ir-dates-cell display="inline" showArrow checkIn={info.row.original.raw.from_date} checkOut={info.row.original.raw.to_date}></ir-dates-cell>,
    }),
    this.columnHelper.display({
      id: 'units',
      header: 'Units booked',
      cell: info => <span>{info.row.original.raw.rooms_length}</span>,
    }),
    this.columnHelper.accessor('profit', {
      id: 'effect',
      header: 'Effect',
      cell: info => this.renderEffect(info.row.original),
    }),
  ];

  private renderEffect(row: DpReportRow) {
    if (row.profit === 0) {
      return <span class="dp-report-table__effect">{formatAmount(row.currencySymbol, 0)}</span>;
    }
    const isGain = row.profit > 0;
    return (
      <span class={{ 'dp-report-table__effect': true, 'dp-report-table__effect--gain': isGain, 'dp-report-table__effect--loss': !isGain }}>
        <wa-icon name={isGain ? 'arrow-trend-up' : 'arrow-trend-down'}></wa-icon>
        {isGain ? '+' : '-'}
        {formatAmount(row.currencySymbol, Math.abs(row.profit))}
      </span>
    );
  }

  private handlePageChange = (event: CustomEvent<PaginationChangeEvent>) => {
    event.stopImmediatePropagation();
    event.stopPropagation();
    setDpReportTablePage(event.detail.currentPage);
  };

  private handlePageSizeChange = (event: CustomEvent<PaginationChangeEvent>) => {
    event.stopImmediatePropagation();
    event.stopPropagation();
    if (event.detail.pageSize) {
      setDpReportTablePageSize(event.detail.pageSize);
    }
  };

  render() {
    const { currentPage, pageSize } = dp_report.tablePagination;
    const total = dp_report.rows.length;
    const pageCount = Math.max(Math.ceil(total / pageSize), 1);
    const startIndex = (currentPage - 1) * pageSize;
    const pageRows = dp_report.rows.slice(startIndex, startIndex + pageSize);

    const table = useTable<DpReportRow>({
      data: pageRows,
      columns: this.columns,
      getCoreRowModel: getCoreRowModel(),
    });

    return (
      <div class="dp-report-table">
        <div class="table--container">
          <table class="table data-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} class={{ 'cell--align-end': header.column.id === 'effect', 'cell--align-center': header.column.id === 'units' }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {dp_report.isLoading ? (
                <tr>
                  <td colSpan={this.columns.length} class="empty-row">
                    <ir-spinner></ir-spinner>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={this.columns.length} class="empty-row">
                    <ir-empty-state message="No dynamic pricing data for this date range."></ir-empty-state>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} class="ir-table-row">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} class={{ 'cell--align-end': cell.column.id === 'effect', 'cell--align-center': cell.column.id === 'units' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ir-pagination
          class="dp-report-table__pagination"
          total={total}
          pages={pageCount}
          pageSize={pageSize}
          currentPage={currentPage}
          allowPageSizeChange={true}
          pageSizes={this.pageSizes}
          showing={{ from: total ? startIndex + 1 : 0, to: Math.min(startIndex + pageSize, total) }}
          recordLabel="bookings"
          onPageChange={this.handlePageChange}
          onPageSizeChange={this.handlePageSizeChange}
        ></ir-pagination>
      </div>
    );
  }
}
