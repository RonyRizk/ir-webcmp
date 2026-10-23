import type { PaginationChangeEvent } from '@/components/ir-pagination/ir-pagination';
import { Booking } from '@/models/booking.dto';
import { departuresStore } from '@/stores/departures.store';
import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import moment from 'moment';
import locales from '@/stores/locales.store';
export type CheckoutRoomEvent = {
  booking: Booking;
  identifier: string;
};
@Component({
  tag: 'ir-departures-table',
  styleUrls: ['ir-departures-table.css', '../../../common/table.css'],
  scoped: true,
})
export class IrDeparturesTable {
  /** Hides the pagination footer, for hosts that load the whole day in one page (the dashboard). */
  @Prop() hidePagination: boolean = false;
  /**
   * For properties without front desk (PMS): check-out status isn't tracked, so every room departing on the store's day is
   * listed in one list, without overdue marks or the actions column.
   */
  @Prop() pmsDisabled: boolean = false;

  @Event() checkoutRoom: EventEmitter<CheckoutRoomEvent>;
  @Event() requestPageChange: EventEmitter<PaginationChangeEvent>;
  @Event() requestPageSizeChange: EventEmitter<PaginationChangeEvent>;

  private renderSection({ bookings, showAction = false, isFuture = false }: { bookings: Booking[]; showAction?: boolean; isFuture?: boolean }) {
    if (!bookings?.length) {
      return null;
    }

    const rows = bookings.flatMap(booking => this.renderBookingRows({ booking, showAction, isFuture }));
    return [...rows];
  }

  private renderBookingRows({ booking, isFuture, showAction }: { booking: Booking; showAction?: boolean; isFuture?: boolean }) {
    return (booking.rooms ?? []).map((room, index) => this.renderRow(booking, room, index, showAction, isFuture));
  }

  private compareGuests(booking: Booking, room: Booking['rooms'][number]): boolean {
    const roomGuest = room?.guest;
    const bookingGuest = booking?.guest;

    if (!roomGuest || !bookingGuest) {
      return false;
    }

    const normalizeGuest = (guest: typeof bookingGuest) => {
      const firstName = guest.first_name?.replace(/\s+/g, '').toLowerCase() || '';
      const lastName = guest.last_name?.replace(/\s+/g, '').toLowerCase() || '';
      return `${firstName}${lastName}`;
    };

    return normalizeGuest(bookingGuest) === normalizeGuest(roomGuest);
  }
  private renderRow(booking: Booking, room: Booking['rooms'][number], index: number, showAction: boolean, isFuture) {
    const rowKey = `${booking.booking_nbr}-${room?.identifier ?? index}`;
    const isOverdueCheckout = !this.pmsDisabled && moment(room.to_date, 'YYYY-MM-DD').startOf('day').isBefore(moment().startOf('day'));
    return (
      <tr class="ir-table-row" key={rowKey}>
        <td class="sticky-column">
          <ir-booking-number-cell
            origin={booking.origin}
            channelBookingNumber={booking.channel_booking_nbr}
            source={booking.source}
            bookingNumber={booking.booking_nbr}
          ></ir-booking-number-cell>
        </td>
        <td>
          <ir-booked-by-cell guest={booking.guest}></ir-booked-by-cell>
          {!this.compareGuests(booking, room) && <ir-guest-name-cell name={room.guest}></ir-guest-name-cell>}
        </td>
        {/* <td>
        </td> */}
        <td>
          <ir-unit-cell room={room}></ir-unit-cell>
        </td>
        <td>
          <ir-dates-cell overdueCheckout={isOverdueCheckout} checkIn={room.from_date} checkOut={room.to_date}></ir-dates-cell>
        </td>
        <td class="text-right">
          <ir-balance-cell
            guestFinancial={booking.guest_financial}
            bookingNumber={booking.booking_nbr}
            isDirect={booking.is_direct}
            statusCode={booking.status.code}
            currencySymbol={booking.currency.symbol}
            financial={booking.financial}
            removeBalance
          ></ir-balance-cell>
        </td>
        {!this.pmsDisabled && (
          <td>
            <div class="departures-table__actions-cell">
              {showAction ? (
                <ir-actions-cell
                  onIrAction={e => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    this.checkoutRoom.emit({
                      booking: booking,
                      identifier: room.identifier,
                    });
                  }}
                  buttons={isOverdueCheckout ? ['overdue_check_out'] : ['check_out']}
                ></ir-actions-cell>
              ) : isFuture ? (
                ''
              ) : (
                'In-house'
              )}
            </div>
          </td>
        )}
      </tr>
    );
  }

  /** Non-PMS rows: every room departing on the store's day, in the store's order. */
  private renderDepartingRooms() {
    const { filteredBookings, today } = departuresStore;
    const departing = filteredBookings.flatMap(booking => (booking.rooms ?? []).filter(room => room.to_date === today).map(room => ({ booking, room })));
    return departing.map(({ booking, room }, index) => this.renderRow(booking, room, index, false, false));
  }

  private renderBody() {
    const { needsCheckOutBookings, futureRooms, outBookings } = departuresStore;
    const columnCount = this.pmsDisabled ? 5 : 6;
    const rows = this.pmsDisabled
      ? this.renderDepartingRooms()
      : [
          ...(this.renderSection({ bookings: futureRooms, isFuture: true }) ?? []),
          ...(this.renderSection({ bookings: needsCheckOutBookings, showAction: true }) ?? []),
          ...(this.renderSection({ bookings: outBookings }) ?? []),
        ];
    const isEmpty = this.pmsDisabled ? !rows.length : !needsCheckOutBookings.length && !outBookings.length;
    return [
      ...rows,
      isEmpty && (
        <tr>
          <td colSpan={columnCount} class="empty-row">
            <ir-empty-state></ir-empty-state>
          </td>
        </tr>
      ),
    ];
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

  render() {
    const { needsCheckOutBookings, futureRooms, outBookings, pagination } = departuresStore;
    return (
      <Host>
        <div class="table--container">
          <table class="table data-table">
            <thead>
              <tr>
                <th>
                  <span class={'departures-table__departure__cell'}>Booking#</span>
                </th>
                <th>
                  <div>
                    <p>Booked by /</p>
                    <p>Guest name</p>
                  </div>
                </th>
                {/* <th></th> */}
                <th>Unit</th>
                <th>Dates</th>
                <th class="text-center">
                  Balance
                  {/* <wa-tooltip for="balance-info">Booking balance click to settle.</wa-tooltip> */}
                  <div style={{ width: 'fit-content', marginInline: 'auto' }}>
                    <ir-custom-button
                      id="balance-info"
                      style={{ '--ir-c-btn-height': 'fit-content', '--ir-c-btn-padding': '0.25rem', '--ir-c-btn-font-size': '0.725rem' }}
                      size="s"
                      variant="danger"
                      appearance="outlined"
                    >
                      Click to collect
                    </ir-custom-button>
                  </div>
                </th>
                {!this.pmsDisabled && <th></th>}
              </tr>
            </thead>
            <tbody>{this.renderBody()}</tbody>
          </table>
        </div>
        {!this.hidePagination && (needsCheckOutBookings.length > 0 || outBookings.length > 0 || futureRooms.length > 0) && (
          <ir-pagination
            class="data-table--pagination"
            showing={pagination.showing}
            total={pagination.total}
            pages={pagination.totalPages}
            pageSize={pagination.pageSize}
            currentPage={pagination.currentPage}
            allowPageSizeChange={false}
            pageSizes={[pagination.pageSize]}
            recordLabel={locales.entries?.Lcz_Bookings ?? 'Bookings'}
            onPageChange={event => this.handlePageChange(event as CustomEvent<PaginationChangeEvent>)}
            onPageSizeChange={event => this.handlePageSizeChange(event as CustomEvent<PaginationChangeEvent>)}
          ></ir-pagination>
        )}
      </Host>
    );
  }
}
