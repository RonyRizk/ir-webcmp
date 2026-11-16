import { Booking, Room } from '@/models/booking.dto';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import { v4 } from 'uuid';
import { t } from '@/services/locale/t';

@Component({
  tag: 'igl-split-booking-drawer',
  styleUrl: 'igl-split-booking-drawer.css',
  scoped: true,
})
export class IglSplitBookingDrawer {
  @Prop() booking: Booking;
  @Prop() identifier: Room['identifier'];
  @Prop({ reflect: true }) open: boolean;

  @Event() closeModal: EventEmitter<null>;

  private _id = `split-booking-form_${v4()}`;

  private get room() {
    return this.booking?.rooms?.find(r => r.identifier === this.identifier);
  }

  render() {
    return (
      <ir-drawer
        open={this.open}
        class={'split-booking__drawer'}
        label={`${t('Lcz_SplitUnit', { fallback: 'Split unit' })} ${this.room?.unit?.['name'] ?? ''}`}
        onDrawerHide={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
          this.closeModal.emit(null);
        }}
      >
        {this.open && <igl-split-booking-form booking={this.booking} identifier={this.identifier} formId={this._id}></igl-split-booking-form>}
        <div slot="footer" class="ir__drawer-footer">
          <ir-custom-button size="m" appearance="filled" variant="neutral" data-drawer="close">
            {t('Lcz_Cancel', { fallback: 'Cancel' })}
          </ir-custom-button>
          <ir-custom-button form={this._id} type="submit" size="m" appearance="accent" variant="brand" loading={isRequestPending('/DoReservation')}>
            {t('Lcz_Confirm', { fallback: 'Confirm' })}
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
