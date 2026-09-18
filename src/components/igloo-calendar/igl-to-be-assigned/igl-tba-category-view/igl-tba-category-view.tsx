import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { CalendarAssignedEvent, UnassignedCategory } from '@/services/unassigned-units/types';

@Component({
  tag: 'igl-tba-category-view',
  styleUrl: 'igl-tba-category-view.css',
  scoped: true,
})
export class IglTbaCategoryView {
  @Prop() calendarData: { [key: string]: any };
  @Prop() category: UnassignedCategory;
  @Prop() selectedDate: string;
  @Prop() categoryIndex: number;

  @Event() assignUnitEvent: EventEmitter<{ identifier: string }>;

  private handleAssignRoom = (event: CustomEvent<CalendarAssignedEvent>) => {
    event.stopPropagation();
    this.calendarData.bookingEvents.push(event.detail);
    this.assignUnitEvent.emit({ identifier: event.detail.identifier });
  };

  render() {
    const { roomTypeId, roomTypeName, rooms } = this.category;
    return (
      <Host>
        <div class="tba-category">
          <h5 class="tba-category__title">{roomTypeName}</h5>
          {rooms.map((room, index) => (
            <igl-tba-booking-view
              key={room.room_identifier}
              calendarData={this.calendarData}
              selectedDate={this.selectedDate}
              room={room}
              roomTypeId={roomTypeId}
              roomTypeName={roomTypeName}
              categoryIndex={this.categoryIndex}
              eventIndex={index}
              onAssignRoomEvent={this.handleAssignRoom}
            ></igl-tba-booking-view>
          ))}
        </div>
      </Host>
    );
  }
}
