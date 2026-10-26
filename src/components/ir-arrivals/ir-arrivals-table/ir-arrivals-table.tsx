import { IrActionButton } from '@/components/table-cells/booking/ir-actions-cell/ir-actions-cell';
import type { PaginationChangeEvent } from '@/components/ir-pagination/ir-pagination';
import { Booking, IUnit } from '@/models/booking.dto';
import { arrivalsStore } from '@/stores/arrivals.store';
import calendar_data from '@/stores/calendar-data';
import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { RoomGuestsPayload } from '@/components/ir-booking-details/types';

import locales from '@/stores/locales.store';
@Component({
  tag: 'ir-arrivals-table',
  styleUrls: ['ir-arrivals-table.css', '../../../common/table.css'],
  scoped: true,
})
export class IrArrivalsTable {
  /** Hides the pagination footer, for hosts that load the whole day in one page (the dashboard). */
  @Prop() hidePagination: boolean = false;
  /**
   * For properties without front desk (PMS): check-in status isn't tracked, so every room arriving on the store's day is
   * listed in one list, without overdue marks or the actions column.
   */
  @Prop() pmsDisabled: boolean = false;

  @State() selectedBooking: Booking;

  @Event() requestPageChange: EventEmitter<PaginationChangeEvent>;
  @Event() requestPageSizeChange: EventEmitter<PaginationChangeEvent>;
  @Event() checkInRoom: EventEmitter<RoomGuestsPayload>;

  private renderSection(bookings: Booking[], showAction = false) {
    if (!bookings?.length) {
      return null;
    }

    const rows = bookings.flatMap(booking => this.renderBookingRows(booking, showAction));
    return [...rows];
  }

  private renderBookingRows(booking: Booking, showAction: boolean) {
    return (booking.rooms ?? []).map((room, index) => this.renderRow(booking, room, index, showAction));
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
  private async handleActionsClicked(e: CustomEvent<{ action: IrActionButton }>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    switch (e.detail.action) {
      case 'check_in':
      case 'overdue_check_in':
        const room = this.selectedBooking.rooms[0];
        const { adult_nbr, children_nbr, infant_nbr } = room.occupancy;
        this.checkInRoom.emit({
          identifier: room.identifier,
          sharing_persons: room.sharing_persons,
          booking_nbr: this.selectedBooking.booking_nbr,
          checkin: true,
          roomName: (room.unit as IUnit)?.name,
          totalGuests: adult_nbr + children_nbr + infant_nbr,
        });
        return;
      default:
        console.warn(e.detail.action + ' not handled');
    }
  }
  private renderRow(booking: Booking, room: Booking['rooms'][number], index: number, showAction: boolean) {
    const rowKey = `${booking.booking_nbr}-${room?.identifier ?? index}`;
    // Overdue relative to the store's day (the dashboard's selected day), not the real today.
    const isOverdueCheckIn = !this.pmsDisabled && room.from_date < arrivalsStore.today;

    return (
      <tr class="ir-table-row" key={rowKey}>
        <td class="sticky-column">
          <ir-booking-number-cell
            source={booking.source}
            origin={booking.origin}
            channelBookingNumber={booking.channel_booking_nbr}
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
          <ir-dates-cell overdueCheckin={isOverdueCheckIn} checkIn={room.from_date} checkOut={room.to_date}></ir-dates-cell>
        </td>
        <td class="text-center">
          <ir-balance-cell
            guestFinancial={booking.guest_financial}
            bookingNumber={booking.booking_nbr}
            isDirect={booking.is_direct}
            statusCode={booking.status.code}
            currencySymbol={booking.currency.symbol}
            financial={booking.financial}
            removeBalance
            paymentDate={arrivalsStore.today}
          ></ir-balance-cell>
        </td>
        {!this.pmsDisabled && this.renderActionsCell(booking, room, isOverdueCheckIn, showAction)}
      </tr>
    );
  }

  private renderActionsCell(booking: Booking, room: Booking['rooms'][number], isOverdueCheckIn: boolean, showAction: boolean) {
    // Automatic properties still list rooms awaiting check-in, but the system checks them in, so no button.
    const isAutomaticCheckIn = !!calendar_data.property?.is_automatic_check_in_out;
    return (
      <td>
        <div class="arrivals-table__actions-cell">
          {!room.unit ? (
            <span style={{ color: 'var(--wa-color-danger-fill-loud)' }}>Not assigned</span>
          ) : showAction && !isAutomaticCheckIn ? (
            <ir-actions-cell
              buttons={isOverdueCheckIn ? ['overdue_check_in'] : ['check_in']}
              onIrAction={e => {
                this.selectedBooking = booking;
                this.handleActionsClicked(e);
              }}
            ></ir-actions-cell>
          ) : room.in_out.code === '001' ? (
            'In-house'
          ) : (
            ''
          )}
        </div>
      </td>
    );
  }

  /** Non-PMS rows: every room arriving on the store's day, in the store's order. */
  private renderArrivingRooms() {
    const { filteredBookings, today } = arrivalsStore;
    const arriving = filteredBookings.flatMap(booking => (booking.rooms ?? []).filter(room => room.from_date === today).map(room => ({ booking, room })));
    return arriving.map(({ booking, room }, index) => this.renderRow(booking, room, index, false));
  }

  private renderBody() {
    const { needsCheckInBookings, inHouseBookings, futureBookings } = arrivalsStore;
    const columnCount = this.pmsDisabled ? 5 : 6;
    const rows = this.pmsDisabled
      ? this.renderArrivingRooms()
      : [...(this.renderSection(futureBookings) ?? []), ...(this.renderSection(needsCheckInBookings, true) ?? []), ...(this.renderSection(inHouseBookings) ?? [])];
    const isEmpty = this.pmsDisabled ? !rows.length : !needsCheckInBookings.length && !inHouseBookings.length;
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
    const { pagination } = arrivalsStore;
    return (
      <Host>
        <div class="table--container">
          <table class="table data-table">
            <thead>
              <tr>
                <th>
                  <span class={'arrivals-table__departure__cell'}>Booking#</span>
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
        {!this.hidePagination && (
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
