import { Room } from '@/models/booking.dto';
import { BookingService } from '@/services/booking-service/booking.service';
import { HbPreference } from '@/types/enums';
import calendar_data from '@/stores/calendar-data';
import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';

/**
 * Dialog that lets staff set or change the half-board meal preference (lunch / dinner)
 * for a single room. Persists the choice via BookingService.setHbPreference and emits
 * `hbPreferenceClose` when it closes so the parent can refresh the booking.
 *
 * Usage:
 *   <ir-hb-preference-dialog
 *     room={room}
 *     open={isOpen}
 *     onHbPreferenceClose={e => { isOpen = false; if (e.detail.saved) refresh(); }}
 *   />
 */
@Component({
  tag: 'ir-hb-preference-dialog',
  styleUrl: 'ir-hb-preference-dialog.css',
  scoped: true,
})
export class IrHbPreferenceDialog {
  /** Room whose half-board preference is being changed. */
  @Prop() room: Room;
  /** Controls dialog visibility. */
  @Prop() open: boolean;

  @State() selectedValue: string | null = null;
  @State() isLoading: boolean = false;

  /**
   * Fired when the dialog closes.
   * `saved: true` → preference was persisted; `saved: false` → user cancelled.
   */
  @Event({ bubbles: true, composed: true }) hbPreferenceClose: EventEmitter<{ saved: boolean }>;

  private bookingService = new BookingService();
  private dialogRef: HTMLIrDialogElement;
  private closedBySave = false;

  private async handleConfirm(e: CustomEvent) {
    e.stopImmediatePropagation();
    if (!this.selectedValue) return;
    try {
      this.isLoading = true;
      await this.bookingService.setHbPreference({
        property_id: calendar_data.property.id,
        room_identifier: this.room.identifier,
        code: this.selectedValue as '001' | '002',
      });
      this.closedBySave = true;
      this.dialogRef?.closeModal();
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    return (
      <ir-dialog
        open={this.open}
        label="Meal Preference"
        ref={el => (this.dialogRef = el)}
        onIrDialogHide={e => {
          e.preventDefault();
          const saved = this.closedBySave;
          this.hbPreferenceClose.emit({ saved });
        }}
        onIrDialogAfterHide={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
          this.closedBySave = false;
          this.selectedValue = null;
        }}
      >
        <wa-radio-group value={this.selectedValue ?? ''} onchange={e => (this.selectedValue = (e.target as any).value)}>
          <wa-radio value={HbPreference.Lunch}>Lunch</wa-radio>
          <wa-radio value={HbPreference.Dinner}>Dinner</wa-radio>
        </wa-radio-group>
        <div slot="footer" class={'ir-dialog__footer'}>
          <ir-custom-button size="m" variant="neutral" appearance="filled" data-dialog="close">
            Cancel
          </ir-custom-button>
          <ir-custom-button size="m" variant="brand" loading={this.isLoading} disabled={!this.selectedValue} onClickHandler={e => this.handleConfirm(e)} appearance="accent">
            Confirm
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
