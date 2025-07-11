import locales from '@/stores/locales.store';
import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import { Booking } from '@/models/booking.dto';
import { BookingService } from '@/services/booking.service';
import { getPrivateNote } from '@/utils/booking';
@Component({
  tag: 'ir-booking-extra-note',
  styleUrls: ['ir-booking-extra-note.css', '../../../common/sheet.css'],
  scoped: true,
})
export class IrBookingExtraNote {
  @Prop() booking: Booking;

  @State() isLoading = false;
  @State() note = '';

  @Event() closeModal: EventEmitter<null>;
  @Event() resetBookingEvt: EventEmitter<Booking | null>;

  private bookingService = new BookingService();
  componentWillLoad() {
    if (this.booking.extras) {
      this.setNote(getPrivateNote(this.booking.extras));
    }
  }

  private setNote(value: string) {
    this.note = value;
  }
  private async savePrivateNote() {
    try {
      this.isLoading = true;
      let prevExtras = this.booking.extras || [];
      const newExtraObj = { key: 'private_note', value: this.note };
      if (prevExtras.length === 0) {
        prevExtras.push(newExtraObj);
      } else {
        const oldPrivateNoteIndex = prevExtras.findIndex(e => e.key === 'private_note');
        if (oldPrivateNoteIndex === -1) {
          prevExtras.push(newExtraObj);
        } else {
          prevExtras[oldPrivateNoteIndex] = newExtraObj;
        }
      }
      const res = await this.bookingService.doReservation({
        assign_units: true,
        is_pms: true,
        is_direct: true,
        is_in_loyalty_mode: false,
        promo_key: null,
        booking: this.booking,
        Is_Non_Technical_Change: true,
        extras: prevExtras,
      });
      this.resetBookingEvt.emit(res);
      this.closeModal.emit(null);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
  render() {
    return (
      <form
        class={'sheet-container h-100'}
        onSubmit={e => {
          e.preventDefault();
          this.savePrivateNote();
        }}
      >
        <ir-title class="px-1 sheet-header" onCloseSideBar={() => this.closeModal.emit(null)} label={locales.entries.Lcz_PrivateNote} displayContext="sidebar"></ir-title>
        <div class="sheet-body px-1">
          <ir-textarea placeholder={locales.entries.Lcz_PrivateNote_MaxChar} label="" value={this.note} maxLength={150} onTextChange={e => this.setNote(e.detail)}></ir-textarea>
        </div>
        <div class={'sheet-footer'}>
          <ir-button
            onClickHandler={() => this.closeModal.emit(null)}
            btn_styles="justify-content-center"
            class={`mb-1 mb-sm-0 flex-fill  mr-sm-1'}`}
            text={locales.entries.Lcz_Cancel}
            btn_color="secondary"
          ></ir-button>

          <ir-button
            btn_styles="justify-content-center align-items-center"
            class={'m-0 flex-fill text-center ml-sm-1'}
            isLoading={this.isLoading}
            text={locales.entries.Lcz_Save}
            btn_color="primary"
            btn_type="submit"
          ></ir-button>
        </div>
      </form>
    );
  }
}
