import { Booking, Room, ROOM_IN_OUT } from '@/models/booking.dto';
import { IEntries } from '@/models/IBooking';
import { Agent } from '@/services/agents/type';
import { buildSplitIndex, SplitIndex } from '@/utils/booking';
// import calendar_data from '@/stores/calendar-data';
// import moment from 'moment';
import { Component, Event, EventEmitter, Fragment, Prop, h } from '@stencil/core';
import { isAgentMode } from '../functions';
import { canCheckIn, canCheckout } from '@/utils/utils';
import type { ClTx } from '@/services/city-ledger';

@Component({
  tag: 'ir-booking-rooms',
  styleUrl: 'ir-booking-rooms.css',
  scoped: true,
})
export class IrBookingRooms {
  /**
   * The booking object containing reservation details,
   * including rooms, status, currency, and edit permissions.
   */
  @Prop() booking: Booking;
  @Prop() agent: Agent;

  /**
   * Available bed preference options for the booking rooms.
   * Used to populate bed selection inside each room component.
   */
  @Prop() bedPreference: IEntries[] = [];

  /**
   * Available departure time options for the booking.
   * Passed down to each room when applicable.
   */
  @Prop() departureTime: IEntries[] = [];

  /**
   * Enables the ability to add a new room/unit to the booking.
   */
  @Prop() hasRoomAdd: boolean = false;

  /**
   * Enables deleting a room from the booking.
   */
  @Prop() hasRoomDelete: boolean = false;

  /**
   * Enables editing room details within the booking.
   */
  @Prop() hasRoomEdit: boolean = false;

  /**
   * Active language code used for translations and formatting.
   */
  @Prop() language: string;

  /**
   * Legend metadata used for displaying room status indicators.
   */
  @Prop() legendData: unknown;

  /**
   * The property identifier associated with the booking.
   * Used when interacting with room-level operations.
   */
  @Prop() propertyId: number;

  /**
   * Additional room metadata and configuration details.
   */
  @Prop() roomsInfo: unknown;

  /**
   * Precomputed split index used to group split rooms together.
   * If not provided, it will be generated internally.
   */
  @Prop() splitIndex: SplitIndex;
  @Prop() clTransactions: ClTx[] = [];

  @Event() roomDeleteFinished: EventEmitter<string>;

  private computeRoomGroups(rooms: Room[]) {
    const indexById = new Map<string, number>();
    rooms.forEach((room, idx) => indexById.set(room.identifier, idx));

    if (!rooms.length) {
      return { groups: [], indexById, hasSplitGroups: false };
    }

    const groupSortKey = (groupRooms: Room[]) => {
      let min = Number.MAX_SAFE_INTEGER;
      for (const r of groupRooms) {
        const ts = Date.parse(r?.from_date ?? '');
        if (!Number.isNaN(ts)) {
          min = Math.min(min, ts);
        }
      }
      return min;
    };

    const splitIndex = this.splitIndex ?? buildSplitIndex(rooms);
    if (!splitIndex) {
      const sortedRooms = [...rooms].sort((a, b) => {
        const diff = Date.parse(a?.from_date ?? '') - Date.parse(b?.from_date ?? '');
        if (!Number.isNaN(diff) && diff !== 0) {
          return diff;
        }
        return (indexById.get(a.identifier) ?? 0) - (indexById.get(b.identifier) ?? 0);
      });
      return { groups: [{ rooms: sortedRooms, order: 0, isSplit: false, sortKey: groupSortKey(sortedRooms) }], indexById, hasSplitGroups: false };
    }

    const roomsById = new Map<string, Room>(rooms.map(room => [room.identifier, room]));
    const grouped: { rooms: Room[]; order: number; sortKey: number; isSplit: boolean }[] = [];
    const visited = new Set<string>();

    for (const head of splitIndex.heads) {
      const chain = splitIndex.chainOf.get(head) ?? [head];
      const chainRooms = chain.map(id => roomsById.get(id)).filter((room): room is Room => Boolean(room));
      if (!chainRooms.length) continue;

      const chainHasSplitLink =
        chain.some(id => {
          const parent = splitIndex.parentOf.get(id);
          const children = splitIndex.childrenOf.get(id) ?? [];
          return Boolean(parent) || children.length > 0;
        }) || chainRooms.some(room => Boolean(room?.is_split));

      if (chainHasSplitLink) {
        chainRooms.forEach(room => visited.add(room.identifier));
        const order = Math.min(...chainRooms.map(room => indexById.get(room.identifier) ?? Number.MAX_SAFE_INTEGER));
        grouped.push({ rooms: chainRooms, order, sortKey: groupSortKey(chainRooms), isSplit: true });
      }
    }

    for (const room of rooms) {
      if (!visited.has(room.identifier)) {
        const order = indexById.get(room.identifier) ?? Number.MAX_SAFE_INTEGER;
        const singleGroup = [room];
        grouped.push({ rooms: singleGroup, order, sortKey: groupSortKey(singleGroup), isSplit: false });
      }
    }

    grouped.sort((a, b) => {
      if (a.sortKey !== b.sortKey) {
        return a.sortKey - b.sortKey;
      }
      return a.order - b.order;
    });
    const hasSplitGroups = grouped.some(group => group.isSplit);

    if (!hasSplitGroups) {
      const merged = grouped
        .map(group => group.rooms)
        .reduce<Room[]>((acc, curr) => acc.concat(curr), [])
        .sort((a, b) => {
          const diff = Date.parse(a?.from_date ?? '') - Date.parse(b?.from_date ?? '');
          if (!Number.isNaN(diff) && diff !== 0) {
            return diff;
          }
          return (indexById.get(a.identifier) ?? 0) - (indexById.get(b.identifier) ?? 0);
        });
      return { groups: [{ rooms: merged, order: 0, sortKey: groupSortKey(merged), isSplit: false }], indexById, hasSplitGroups: false };
    }

    return { groups: grouped, indexById, hasSplitGroups: true };
  }

  private handleRoomCheckout(room: Room): boolean {
    return canCheckout({ inOutCode: room.in_out?.code, to_date: room.to_date });
    // if (!calendar_data.checkin_enabled || calendar_data.is_automatic_check_in_out) {
    //   return false;
    // }
    // return room.in_out.code === '001';
  }

  private handleRoomCheckin(room: Room): boolean {
    return canCheckIn({ from_date: room.from_date, to_date: room.to_date, isCheckedIn: room.in_out?.code === ROOM_IN_OUT.CHECKIN });
    // if (!calendar_data.checkin_enabled || calendar_data.is_automatic_check_in_out) {
    //   return false;
    // }
    // if (!room.unit) {
    //   return false;
    // }
    // if (room.in_out && room.in_out.code !== '000') {
    //   return false;
    // }
    // return moment().isSameOrAfter(moment(room.from_date, 'YYYY-MM-DD'), 'days') && moment().isBefore(moment(room.to_date, 'YYYY-MM-DD'), 'days');
  }

  private renderRoomItem(room: Room, bookingIndex: number, includeDepartureTime: boolean = true) {
    const showCheckin = this.handleRoomCheckin(room);
    const showCheckout = this.handleRoomCheckout(room);

    return (
      <ir-room
        key={room.identifier}
        room={room}
        property_id={this.propertyId}
        language={this.language}
        departureTime={this.departureTime}
        bedPreferences={this.bedPreference}
        isEditable={this.booking.is_editable}
        legendData={this.legendData}
        roomsInfo={this.roomsInfo}
        myRoomTypeFoodCat={room.roomtype.name}
        mealCodeName={room.rateplan.short_name}
        includeDepartureTime={includeDepartureTime}
        currency={this.booking.currency.symbol}
        hasRoomEdit={this.hasRoomEdit && this.booking.status.code !== '003' && this.booking.is_direct}
        hasRoomDelete={this.hasRoomDelete && this.booking.status.code !== '003' && this.booking.is_direct}
        hasCheckIn={showCheckin}
        hasCheckOut={showCheckout}
        booking={this.booking}
        agent={this.agent}
        clTransactions={this.clTransactions}
        bookingIndex={bookingIndex}
        onDeleteFinished={(e: CustomEvent<string>) => this.roomDeleteFinished.emit(e.detail)}
      />
    );
  }

  private renderRoomPool(rooms: Room[]) {
    if (!rooms.length) {
      return <p class="room-group__empty">No rooms in this group</p>;
    }

    const { groups, indexById, hasSplitGroups } = this.computeRoomGroups(rooms);

    if (!hasSplitGroups) {
      const groupRooms = groups[0].rooms;
      return groupRooms.map((room, idx) => (
        <Fragment>
          {this.renderRoomItem(room, indexById.get(room.identifier) ?? idx)}
          {idx < groupRooms.length - 1 ? <wa-divider></wa-divider> : null}
        </Fragment>
      ));
    }

    return (
      <div class="d-flex flex-column" style={{ gap: '1rem' }}>
        {groups.map((group, groupIdx) => {
          const isLastGroup = groupIdx === groups.length - 1;
          return (
            <div class={`${isLastGroup ? '' : 'room-group'}`} key={`room-group-${group.order}-${groupIdx}`}>
              {group.rooms.map((room, roomIdx) => (
                <Fragment>
                  {this.renderRoomItem(room, indexById.get(room.identifier) ?? roomIdx, roomIdx === group.rooms.length - 1)}
                  {roomIdx < group.rooms.length - 1 ? <wa-divider></wa-divider> : null}
                </Fragment>
              ))}
              {!isLastGroup && <wa-divider style={{ '--width': '3px' }}></wa-divider>}
            </div>
          );
        })}
      </div>
    );
  }

  private renderRooms() {
    const rooms = this.booking?.rooms ?? [];
    if (!rooms.length) {
      return null;
    }

    if (!isAgentMode(this.agent)) {
      return this.renderRoomPool(rooms);
    }

    const guestRooms = rooms.filter(r => r.agent === null || r.agent === undefined);
    const agentRooms = rooms.filter(r => r.agent !== null && r.agent !== undefined);
    const agentName = this.booking.agent?.name ?? 'Agent';

    return (
      <Fragment>
        <p class="service-group__label --agent">
          {agentName}
          <span>Folio</span>
        </p>
        <div class="service-group service-group--agent">
          <div class="service-group__body">{agentRooms.length === 0 ? <p class="service-group__empty">No agent rooms</p> : this.renderRoomPool(agentRooms)}</div>
        </div>
        <wa-divider></wa-divider>
        <p class="service-group__label">
          Guest
          <span>Folio</span>
        </p>
        <div class="service-group service-group--guest">
          <div class="service-group__body">{guestRooms.length === 0 ? <p class="service-group__empty">No guest rooms</p> : this.renderRoomPool(guestRooms)}</div>
        </div>
      </Fragment>
    );
  }

  render() {
    if (!this.booking) {
      return null;
    }

    return (
      <wa-card>
        <ir-date-view class="booking-details__date-view-header" slot="header" from_date={this.booking.from_date} to_date={this.booking.to_date}></ir-date-view>
        {this.hasRoomAdd && this.booking.is_editable && (
          <Fragment>
            <wa-tooltip for="room-add">Add unit</wa-tooltip>
            <ir-custom-button slot="header-actions" id="room-add" appearance={'plain'} size={'small'} variant={'neutral'}>
              <wa-icon name="plus" style={{ fontSize: '1rem' }} label="Add unit"></wa-icon>
            </ir-custom-button>
          </Fragment>
        )}
        {this.renderRooms()}
      </wa-card>
    );
  }
}
