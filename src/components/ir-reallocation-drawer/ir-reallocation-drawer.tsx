import { Booking } from '@/models/booking.dto';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import { v4 } from 'uuid';

@Component({
  tag: 'ir-reallocation-drawer',
  styleUrl: 'ir-reallocation-drawer.css',
  scoped: true,
})
export class IrReallocationDrawer {
  @Prop({ reflect: true }) open: boolean;
  @Prop() booking: Booking;
  @Prop() roomIdentifier: string;
  @Prop() pool: string;

  @Event() closeModal: EventEmitter<void>;
  private _id = `reallocation-form_${v4()}`;
  render() {
    return (
      <ir-drawer
        label="Reassign Unit"
        open={this.open}
        onDrawerHide={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
          this.closeModal.emit();
        }}
      >
        {this.open && <ir-reallocation-form pool={this.pool} formId={this._id} booking={this.booking} identifier={this.roomIdentifier}></ir-reallocation-form>}
        <div slot="footer" class="ir__drawer-footer">
          <ir-custom-button size="medium" data-drawer="close" variant="neutral" appearance="filled">
            Cancel
          </ir-custom-button>
          <ir-custom-button form={this._id} size="medium" loading={isRequestPending('/ReAllocate_Exposed_Room')} type="submit" variant="brand">
            Confirm
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
