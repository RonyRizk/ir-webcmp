import { Component, h, Prop, State, Event, EventEmitter } from '@stencil/core';
import { HouseKeepingService } from '@/services/housekeeping.service';
import { PhysicalRoom, RoomHkStatus } from '@/models/booking.dto';
import calendar_data from '@/stores/calendar-data';

@Component({
  tag: 'igl-housekeeping-dialog',
  styleUrl: 'igl-housekeeping-dialog.css',
  scoped: true,
})
export class IglHousekeepingDialog {
  /**
   * Controls whether the dialog is open.
   * The parent component is responsible for toggling this value.
   */
  @Prop() open: boolean;

  /**
   * Currently selected room for housekeeping actions.
   * When null or undefined, the dialog will not render.
   */
  @Prop() selectedRoom: PhysicalRoom;

  /**
   * Booking number associated with the selected room (if any).
   * Used for housekeeping action tracking.
   */
  @Prop() bookingNumber: number;

  /**
   * Current property identifier.
   * Required for housekeeping service requests.
   */
  @Prop() propertyId: number;

  @State() isLoading: 'hk-toggle-clean-dirty' | 'hk-clean-inspect' | null = null;

  /** Fired after dialog is fully closed */
  @Event() irAfterClose: EventEmitter<void>;

  private dialogRef!: HTMLIrDialogElement;
  private housekeepingService = new HouseKeepingService();

  private getStatusLabel() {
    switch (this.selectedRoom?.hk_status) {
      case '002':
        return 'dirty';
      case '004':
        return 'inspected';
      default:
        return 'clean';
    }
  }

  private middleButtonLabel() {
    return this.selectedRoom?.hk_status === '002' ? 'Clean' : 'Dirty';
  }

  private rightButtonLabel() {
    return this.selectedRoom?.hk_status !== '004' ? 'Clean & Inspect' : 'Clean';
  }

  // private renderModalBody() {
  //   if (!this.selectedRoom) {
  //     return null;
  //   }
  //   return <p style={{ padding: '0', margin: '0' }}>Update unit {this.selectedRoom?.name} to ...</p>;
  // }
  private async updateHousekeeping(e: CustomEvent, status: RoomHkStatus) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    try {
      this.isLoading = (e.target as HTMLIrCustomButtonElement).value as any;
      await this.housekeepingService.setExposedUnitHKStatus({
        property_id: calendar_data.property.id,
        // housekeeper: this.selectedRoom?.housekeeper ? { id: this.selectedRoom?.housekeeper?.id } : null,
        status: {
          code: status,
        },
        unit: {
          id: this.selectedRoom?.id,
        },
      });
      if (['001', '004'].includes(status)) {
        await this.housekeepingService.executeHKAction({
          actions: [
            {
              description: 'Cleaned',
              hkm_id: this.selectedRoom?.housekeeper?.id || null,
              unit_id: this.selectedRoom?.id,
              booking_nbr: this.bookingNumber,
              status: status as any,
            },
          ],
        });
      }
    } finally {
      this.isLoading = null;
      this.dialogRef.closeModal();
    }
  }

  render() {
    return (
      <ir-dialog ref={el => (this.dialogRef = el)} open={this.open} label="Housekeeping Update" onIrDialogAfterHide={() => this.irAfterClose.emit()}>
        <p style={{ margin: '0' }}>{`${this.selectedRoom?.name} is currently marked as ${this.getStatusLabel()}.`}</p>

        <div slot="footer" class="ir-dialog__footer">
          <ir-custom-button data-dialog="close" size="medium" variant="neutral" appearance="filled">
            Cancel
          </ir-custom-button>

          <ir-custom-button
            value="hk-toggle-clean-dirty"
            size="medium"
            variant="brand"
            appearance="outlined"
            loading={this.isLoading === 'hk-toggle-clean-dirty'}
            onClickHandler={e => this.updateHousekeeping(e, this.selectedRoom.hk_status === '002' ? '001' : '002')}
          >
            {this.middleButtonLabel()}
          </ir-custom-button>

          <ir-custom-button
            value="hk-clean-inspect"
            size="medium"
            variant="brand"
            appearance="accent"
            loading={this.isLoading === 'hk-clean-inspect'}
            onClickHandler={e => this.updateHousekeeping(e, this.selectedRoom.hk_status === '004' ? '001' : '004')}
          >
            {this.rightButtonLabel()}
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
