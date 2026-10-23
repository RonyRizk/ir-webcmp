import type { Booking, Room } from '@/models/booking.dto';
import locales from '@/stores/locales.store';
import { Component, Host, Prop, h } from '@stencil/core';

export type DashboardBookingsTableVariant = 'inHouse' | 'newBookings' | 'cancellations';

/**
 * Read-only booking list used by the dashboard's In-house, Bookings and Cancellations panels, built from the shared
 * booking table cells. In-house lists one row per occupied room; Bookings and Cancellations list one row per booking,
 * with its rooms' units stacked in the Unit cell.
 */
@Component({
  tag: 'ir-dashboard-bookings-table',
  styleUrls: ['../../../common/table.css', 'ir-dashboard-bookings-table.css'],
  scoped: true,
})
export class IrDashboardBookingsTable {
  @Prop() bookings: Booking[] = [];
  /** In-house drops the Balance and Status columns that Bookings and Cancellations end with. */
  @Prop() variant: DashboardBookingsTableVariant = 'inHouse';
  @Prop() emptyMessage: string;

  private isSameGuest(booking: Booking, room: Room) {
    const normalize = (g?: { first_name?: string; last_name?: string }) => `${g?.first_name ?? ''}${g?.last_name ?? ''}`.replace(/\s+/g, '').toLowerCase();
    return !room?.guest || normalize(booking.guest) === normalize(room.guest);
  }

  /** In-house rows end at Dates; Bookings and Cancellations add Balance, then Status. */
  private get hasBalanceAndStatus() {
    return this.variant !== 'inHouse';
  }

  /** The booking's stay, or the span of its rooms' stays when the booking omits it. */
  private stayOf(booking: Booking): { from: string; to: string } {
    const rooms = booking.rooms ?? [];
    const from = booking.from_date ?? rooms.map(r => r.from_date).sort()[0];
    const to =
      booking.to_date ??
      rooms
        .map(r => r.to_date)
        .sort()
        .at(-1);
    return { from, to };
  }

  private renderBookingRow(booking: Booking) {
    const { from, to } = this.stayOf(booking);
    return (
      <tr class="ir-table-row" key={booking.booking_nbr}>
        <td>
          <ir-booking-number-cell
            source={booking.source}
            origin={booking.origin}
            channelBookingNumber={booking.channel_booking_nbr}
            bookingNumber={booking.booking_nbr}
          ></ir-booking-number-cell>
        </td>
        <td>
          <ir-booked-by-cell guest={booking.guest} identifier={booking.booking_nbr}></ir-booked-by-cell>
        </td>
        <td>
          <div class="units-cell">
            {(booking.rooms ?? []).map(room => (
              <ir-unit-cell key={room.identifier} room={room}></ir-unit-cell>
            ))}
          </div>
        </td>
        <td>
          <ir-dates-cell checkIn={from} checkOut={to}></ir-dates-cell>
        </td>
        {this.renderTrailingCells(booking)}
      </tr>
    );
  }

  private renderTrailingCells(booking: Booking) {
    if (!this.hasBalanceAndStatus) {
      return null;
    }
    return [
      <td>
        <ir-balance-cell
          guestFinancial={booking.guest_financial}
          bookingNumber={booking.booking_nbr}
          isDirect={booking.is_direct}
          statusCode={booking.status?.code}
          currencySymbol={booking.currency?.symbol}
          financial={booking.financial}
        ></ir-balance-cell>
      </td>,
      <td>
        <ir-status-activity-cell status={booking.status} isRequestToCancel={booking.is_requested_to_cancel} bookingNumber={booking.booking_nbr}></ir-status-activity-cell>
      </td>,
    ];
  }

  private renderRoomRow(booking: Booking, room: Room, index: number) {
    return (
      <tr class="ir-table-row" key={`${booking.booking_nbr}-${room.identifier ?? index}`}>
        <td>
          <ir-booking-number-cell
            source={booking.source}
            origin={booking.origin}
            channelBookingNumber={booking.channel_booking_nbr}
            bookingNumber={booking.booking_nbr}
          ></ir-booking-number-cell>
        </td>
        <td>
          <ir-booked-by-cell guest={booking.guest} identifier={room.identifier}></ir-booked-by-cell>
          {!this.isSameGuest(booking, room) && <ir-guest-name-cell name={room.guest}></ir-guest-name-cell>}
        </td>
        <td>
          <ir-unit-cell room={room}></ir-unit-cell>
        </td>
        <td>
          <ir-dates-cell checkIn={room.from_date} checkOut={room.to_date}></ir-dates-cell>
        </td>
        {this.renderTrailingCells(booking)}
      </tr>
    );
  }

  render() {
    const bookings = this.bookings ?? [];
    const rows =
      this.variant === 'inHouse'
        ? bookings.flatMap(booking => (booking.rooms ?? []).map((room, index) => this.renderRoomRow(booking, room, index)))
        : bookings.map(booking => this.renderBookingRow(booking));
    const columnCount = this.hasBalanceAndStatus ? 6 : 4;

    return (
      <Host>
        <div class="table--container">
          <table class="table data-table">
            <thead>
              <tr>
                <th>
                  <bdi>Booking#</bdi>
                </th>
                <th>
                  <p>
                    <bdi>Booked by /</bdi>
                  </p>
                  <p>Guest name</p>
                </th>
                <th>{locales.entries?.Lcz_Unit ?? 'Unit'}</th>
                <th>{locales.entries?.Lcz_Dates ?? 'Dates'}</th>
                {this.hasBalanceAndStatus && <th>{locales.entries?.Lcz_Balance ?? 'Balance'}</th>}
                {this.hasBalanceAndStatus && <th>{locales.entries?.Lcz_Status ?? 'Status'}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows
              ) : (
                <tr>
                  <td colSpan={columnCount} class="empty-row">
                    <ir-empty-state message={this.emptyMessage}></ir-empty-state>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Host>
    );
  }
}
