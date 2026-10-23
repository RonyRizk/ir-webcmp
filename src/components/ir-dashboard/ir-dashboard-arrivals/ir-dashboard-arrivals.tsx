import type { RoomGuestsPayload } from '@/components/ir-booking-details/types';
import type { ICountry } from '@/models/IBooking';
import { Component, Host, Prop, State, h } from '@stencil/core';

/**
 * Arrivals panel of the dashboard: the existing arrivals table plus its check-in dialog.
 * Data lives in the arrivals store, loaded by the dashboard root as a single page, so there's no pagination.
 */
@Component({
  tag: 'ir-dashboard-arrivals',
  styleUrl: 'ir-dashboard-arrivals.css',
  scoped: true,
})
export class IrDashboardArrivals {
  @Prop() language: string = 'en';
  @Prop() countries: ICountry[];
  /** Property without front desk: every arriving room in one list, no check-in actions. */
  @Prop() pmsDisabled: boolean = false;

  @State() roomGuestState: RoomGuestsPayload = null;

  private handleCheckInRoom(event: CustomEvent<RoomGuestsPayload>) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.roomGuestState = event.detail;
  }

  render() {
    return (
      <Host>
        <ir-arrivals-table
          hidePagination
          pmsDisabled={this.pmsDisabled}
          onCheckInRoom={event => this.handleCheckInRoom(event as CustomEvent<RoomGuestsPayload>)}
        ></ir-arrivals-table>
        <ir-room-guests
          open={this.roomGuestState !== null}
          countries={this.countries}
          language={this.language}
          identifier={this.roomGuestState?.identifier}
          bookingNumber={this.roomGuestState?.booking_nbr?.toString()}
          roomName={this.roomGuestState?.roomName}
          totalGuests={this.roomGuestState?.totalGuests}
          sharedPersons={this.roomGuestState?.sharing_persons}
          checkIn={this.roomGuestState?.checkin}
          onCloseModal={() => (this.roomGuestState = null)}
        ></ir-room-guests>
      </Host>
    );
  }
}
