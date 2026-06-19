import { Component, h } from '@stencil/core';
import { Booking, Room } from '@/models/booking.dto';
import { Event, EventEmitter, Prop } from '@stencil/core';

@Component({
  tag: 'igl-split-booking-drawer',
  styleUrl: 'igl-split-booking-drawer.css',
  scoped: true,
})
export class IglSplitBookingDrawer {
  @Prop() booking: Booking;
  @Prop() identifier: Room['identifier'];
  @Prop() open: boolean;

  @Event() closeModal: EventEmitter<null>;

  private get room() {
    return this.booking?.rooms?.find(r => r.identifier === this.identifier);
  }

  render() {
    return (
      <ir-drawer open={this.open} label={`Split unit ${this.room?.unit['name']}`}>
        {this.open && <igl-split-booking-form booking={this.booking} identifier={this.identifier}></igl-split-booking-form>}
        <div slot="footer">
          <ir-custom-button size="m" appearance="filled" variant="neutral" data-drawer="close">
            Cancel
          </ir-custom-button>
          <ir-custom-button form="split-booking-form" type="submit" size="m" appearance="accent" variant="brand">
            Confirm
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
