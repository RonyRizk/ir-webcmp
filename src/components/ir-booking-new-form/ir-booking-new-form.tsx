import { IglBookPropertyPayloadPlusBooking } from '@/models/igl-book-property';
import { Component, Host, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'ir-booking-new-form',
  styleUrl: 'ir-booking-new-form.css',
  scoped: true,
})
export class IrBookingNewForm {
  @Prop() ticket: string;
  @Prop() propertyid: string;
  @Prop() language: string;

  @State() bookingItem: IglBookPropertyPayloadPlusBooking | null = null;

  private handleTriggerClicked() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    (this.bookingItem as IglBookPropertyPayloadPlusBooking) = {
      FROM_DATE: undefined,
      defaultDateRange: {
        fromDate: new Date(),
        fromDateStr: '',
        toDate: tomorrow,
        toDateStr: '',
        dateDifference: 0,
        message: '',
      },
      TO_DATE: undefined,
      EMAIL: '',
      event_type: 'PLUS_BOOKING',
      ID: '',
      NAME: '',
      PHONE: '',
      REFERENCE_TYPE: '',
      TITLE: 'New Booking',
    };
  }
  render() {
    return (
      <Host>
        <div
          onClick={() => {
            this.handleTriggerClicked();
          }}
        >
          <slot name="trigger">
            <ir-custom-button appearance="plain" variant="brand">
              <wa-icon name="circle-plus" style={{ fontSize: '1.2rem' }}></wa-icon>
            </ir-custom-button>
          </slot>
        </div>
        <ir-booking-editor-drawer
          onBookingEditorClosed={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.bookingItem = null;
          }}
          mode={this.bookingItem?.event_type}
          label={this.bookingItem?.TITLE}
          ticket={this.ticket}
          open={this.bookingItem !== null}
          language={this.language}
          propertyid={this.propertyid as any}
        ></ir-booking-editor-drawer>
      </Host>
    );
  }
}
