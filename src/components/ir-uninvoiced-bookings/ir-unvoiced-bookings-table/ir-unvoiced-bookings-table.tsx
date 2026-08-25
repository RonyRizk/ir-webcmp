import { Component, Event, EventEmitter, h } from '@stencil/core';
import { createColumnHelper, getCoreRowModel } from '@tanstack/table-core';
import { flexRender, useTable } from '@/utils/useTable';
import type { PaginationChangeEvent } from '@/components/ir-pagination/ir-pagination';
import uninvoiced_bookings, { setUninvoicedBookingsTablePage, setUninvoicedBookingsTablePageSize } from '@/stores/uninvoiced_bookings.store';
import { formatAmount } from '@/utils/utils';
import { UninvoicedBookingRow } from '../types';

@Component({
  tag: 'ir-unvoiced-bookings-table',
  styleUrls: ['ir-unvoiced-bookings-table.css', '../../../common/table.css'],
  scoped: true,
})
export class IrUnvoicedBookingsTable {
  @Event() uninvoicedBookingsPageChange: EventEmitter<void>;

  private pageSizes = [20, 50, 100];
  private columnHelper = createColumnHelper<UninvoicedBookingRow>();

  private columns = [
    this.columnHelper.display({
      id: 'booking',
      header: 'Booking#',
      cell: info => {
        const booking = info.row.original.raw;
        return (
          <ir-booking-number-cell
            class="uninvoiced-bookings-table__booking-nbr-cell"
            origin={booking.origin}
            source={booking.source}
            channelBookingNumber={booking.channel_booking_nbr}
            bookingNumber={booking.booking_nbr}
          ></ir-booking-number-cell>
        );
      },
    }),
    this.columnHelper.display({
      id: 'booked_by',
      header: 'Booked by',
      cell: info => {
        const row = info.row.original;
        const booking = row.raw;
        return (
          <ir-booked-by-cell
            class="text-center"
            clickableGuest
            showRepeatGuestBadge={false}
            guest={booking.guest}
            identifier={booking.booking_nbr}
            showContactIcons={false}
            showPersons
            showPrivateNoteDot={false}
            totalPersons={row.totalGuests?.toString()}
            showPromoIcon={false}
            promoKey={booking.promo_key}
            showLoyaltyIcon={false}
          ></ir-booked-by-cell>
        );
      },
    }),
    this.columnHelper.display({
      id: 'dates',
      header: 'End date',
      cell: info => {
        const booking = info.row.original.raw;
        return <ir-dates-cell class="uninvoiced-bookings__dates-cell" checkIn={booking.from_date} checkOut={booking.to_date}></ir-dates-cell>;
      },
    }),
    this.columnHelper.display({
      id: 'services',
      header: 'Services',
      cell: info => {
        const booking = info.row.original.raw;
        const invoicableUnits = booking.invoice_info?.invoiceable_items?.filter(item => item.is_invoiceable && item.type === 'BSA')?.length;
        const invoicableServices = booking.invoice_info?.invoiceable_items?.filter(item => item.is_invoiceable && ['BSP', 'BSE'].includes(item.type))?.length;
        const invoicableCancellation = booking.invoice_info?.invoiceable_items?.filter(item => item.is_invoiceable && item.type === 'PAYMENT')?.length;
        // const roomsLength = row.raw.rooms?.length;
        return (
          <div>
            {!!invoicableUnits && (
              <p class="uninvoiced-bookings__services">
                {invoicableUnits} unit{invoicableUnits > 1 ? 's' : ''}
              </p>
            )}
            {!!invoicableServices && (
              <p class="uninvoiced-bookings__services">
                {invoicableServices} extra service{invoicableServices > 1 ? 's' : ''}
              </p>
            )}
            {!!invoicableCancellation && <p class="uninvoiced-bookings__services">Cancellation fee</p>}
          </div>
        );
      },
    }),
    this.columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: info => {
        const booking = info.row.original.raw;
        const lastManipulation = booking.ota_manipulations ? booking.ota_manipulations[booking.ota_manipulations.length - 1] : null;
        return (
          <ir-status-activity-cell
            lastManipulation={lastManipulation}
            showManipulationBadge={!!lastManipulation}
            showModifiedBadge={!lastManipulation && booking.events?.length > 0 && booking.events[0].type.toLowerCase() === 'modified'}
            status={booking.status}
            isRequestToCancel={booking.is_requested_to_cancel}
            bookingNumber={booking.booking_nbr}
          ></ir-status-activity-cell>
        );
      },
    }),
    // this.columnHelper.accessor('totalGuestAmount', {
    //   id: 'totalGuestAmount',
    //   header: 'Total guest sum',
    //   cell: info => formatAmount(info.row.original.currencySymbol, info.getValue()),
    // }),
    this.columnHelper.accessor('uninvoicedGuestAmount', {
      id: 'uninvoicedGuestAmount',
      header: 'Uninvoiced guest amount',
      cell: info => (
        <span>
          <b>{formatAmount(info.row.original.currencySymbol, info.getValue())} / </b>
          {formatAmount(info.row.original.currencySymbol, info.getValue())}
        </span>
      ),
    }),
  ];

  private handlePageChange = (event: CustomEvent<PaginationChangeEvent>) => {
    event.stopImmediatePropagation();
    event.stopPropagation();
    setUninvoicedBookingsTablePage(event.detail.currentPage);
    this.uninvoicedBookingsPageChange.emit();
  };

  private handlePageSizeChange = (event: CustomEvent<PaginationChangeEvent>) => {
    event.stopImmediatePropagation();
    event.stopPropagation();
    if (event.detail.pageSize) {
      setUninvoicedBookingsTablePageSize(event.detail.pageSize);
      this.uninvoicedBookingsPageChange.emit();
    }
  };

  render() {
    const { currentPage, pageSize } = uninvoiced_bookings.tablePagination;
    const total = uninvoiced_bookings.totalCount;
    const pageCount = Math.max(Math.ceil(total / pageSize), 1);
    const startIndex = (currentPage - 1) * pageSize;
    const pageRows = uninvoiced_bookings.rows;

    const table = useTable<UninvoicedBookingRow>({
      data: pageRows,
      columns: this.columns,
      getCoreRowModel: getCoreRowModel(),
    });
    const amountColumnIds = ['totalGuestAmount', 'uninvoicedGuestAmount'];

    return (
      <div class="uninvoiced-bookings-table">
        <div class="table--container">
          <table class="table data-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      class={{
                        'cell--align-end': amountColumnIds.includes(header.column.id),
                        'cell--booking': header.column.id === 'booking',
                        'cell--booked-by': header.column.id === 'booked_by',
                        'cell--amount': amountColumnIds.includes(header.column.id),
                        'cell--align-center': ['status', 'units_booked'].includes(header.column.id),
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {uninvoiced_bookings.isLoading ? (
                <tr>
                  <td colSpan={this.columns.length} class="empty-row">
                    <ir-spinner></ir-spinner>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={this.columns.length} class="empty-row">
                    <ir-empty-state message="No uninvoiced guest-paid bookings for this date range."></ir-empty-state>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} class="ir-table-row">
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        class={{
                          'cell--align-end': amountColumnIds.includes(cell.column.id),
                          'cell--align-center': ['status', 'units_booked'].includes(cell.column.id),
                          'cell--booking': cell.column.id === 'booking',
                          'cell--booked-by': cell.column.id === 'booked_by',
                          'cell--amount': amountColumnIds.includes(cell.column.id),
                        }}
                      >
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
          class="uninvoiced-bookings-table__pagination"
          total={total}
          pages={pageCount}
          pageSize={pageSize}
          currentPage={currentPage}
          allowPageSizeChange={true}
          pageSizes={this.pageSizes}
          showing={{ from: total ? startIndex + 1 : 0, to: startIndex + pageRows.length }}
          recordLabel="bookings"
          onPageChange={this.handlePageChange}
          onPageSizeChange={this.handlePageSizeChange}
        ></ir-pagination>
      </div>
    );
  }
}
