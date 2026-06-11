import { Booking } from '@/models/booking.dto';
import { Component, Event, EventEmitter, Method, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'ir-booking-source-editor-dialog',
  styleUrl: 'ir-booking-source-editor-dialog.css',
  scoped: true,
})
export class IrBookingSourceEditorDialog {
  @Prop() booking: Booking;

  @Event() resetBookingEvt: EventEmitter<null>;

  @State() open: boolean = false;
  @State() isLoading: boolean = false;

  @Method()
  async openDialog() {
    this.open = true;
  }

  @Method()
  async closeDialog() {
    this.open = false;
  }

  render() {
    return (
      <ir-dialog
        label="Change Booking Source"
        onIrDialogHide={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
          this.open = false;
        }}
        open={this.open}
      >
        {this.open && (
          <ir-booking-source-editor-form
            booking={this.booking}
            onBookingSourceSaved={() => {
              this.closeDialog();
              setTimeout(() => this.resetBookingEvt.emit(null), 100);
            }}
            onLoadingChange={e => (this.isLoading = e.detail)}
          ></ir-booking-source-editor-form>
        )}

        <div slot="footer" class="ir-dialog__footer">
          <ir-custom-button size="medium" data-dialog="close" appearance="filled" variant="neutral">
            Cancel
          </ir-custom-button>
          <ir-custom-button type="submit" form={`change-source-form-${this.booking?.booking_nbr}`} size="medium" appearance="accent" variant="brand" loading={this.isLoading}>
            Save
          </ir-custom-button>
        </div>
      </ir-dialog>
    );
  }
}
