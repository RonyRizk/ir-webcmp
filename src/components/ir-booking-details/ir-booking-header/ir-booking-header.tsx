import { IToast } from '@/components/ui/ir-toast/toast';
import { Booking } from '@/models/booking.dto';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import locales from '@/stores/locales.store';
import { Component, Event, EventEmitter, Fragment, h, Listen, Prop, State } from '@stencil/core';
import { BookingDetailsDialogEvents, OpenDialogEvent, OpenSidebarEvent } from '../types';
import { BookingService } from '@/services/booking-service/booking.service';
import calendar_data from '@/stores/calendar-data';

@Component({
  tag: 'ir-booking-header',
  styleUrl: 'ir-booking-header.css',
  scoped: true,
})
export class IrBookingHeader {
  @Prop() booking: Booking;
  @Prop() hasReceipt: boolean;
  @Prop() hasPrint: boolean;
  @Prop() hasDelete: boolean;
  @Prop() hasMenu: boolean;
  @Prop() hasCloseButton: boolean;
  @Prop() hasEmail: boolean = true;

  @State() bookingStatus: string | null = null;
  @State() currentDialogStatus: BookingDetailsDialogEvents;

  @Event() toast: EventEmitter<IToast>;
  @Event() closeSidebar: EventEmitter<null>;
  @Event() resetBookingEvt: EventEmitter<null>;
  @Event() openSidebar: EventEmitter<OpenSidebarEvent<any>>;

  // private confirmationBG = {
  //   '001': 'bg-ir-orange',
  //   '002': 'bg-ir-green',
  //   '003': 'bg-ir-red',
  //   '004': 'bg-ir-red',
  // };

  private dialogRef: HTMLIrDialogElement;

  private bookingService = new BookingService();
  private alertMessage = `ALERT! Modifying an OTA booking will create a discrepancy between igloorooms and the source. Future guest modifications on the OTA may require manual adjustments of the booking.`;
  private modalEl: HTMLIrDialogElement;

  @Listen('selectChange')
  handleSelectChange(e: CustomEvent<any>) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    const target = e.target;
    this.bookingStatus = (target as any).selectedValue;
  }
  private async updateStatus() {
    if (!this.bookingStatus || this.bookingStatus === '-1') {
      this.toast.emit({
        type: 'error',
        description: '',
        title: locales.entries.Lcz_SelectStatus,
        position: 'top-right',
      });
      return;
    }
    try {
      await this.bookingService.changeExposedBookingStatus({
        book_nbr: this.booking.booking_nbr,
        status: this.bookingStatus,
      });
      this.toast.emit({
        type: 'success',
        description: '',
        title: locales.entries.Lcz_StatusUpdatedSuccessfully,
        position: 'top-right',
      });
      this.bookingStatus = null;
      this.modalEl.closeModal();
      this.resetBookingEvt.emit(null);
    } catch (error) {
      console.log(error);
    }
  }
  private openDialog(e: OpenDialogEvent) {
    const { type } = e;
    this.currentDialogStatus = type;
    this.dialogRef.openModal();
  }
  private renderDialogBody() {
    switch (this.currentDialogStatus) {
      case 'pms':
        return <ir-pms-logs bookingNumber={this.booking.booking_nbr}></ir-pms-logs>;
      case 'events-log':
        return <ir-events-log booking={this.booking} bookingNumber={this.booking.booking_nbr}></ir-events-log>;
    }
  }

  render() {
    const lastManipulation = this.booking.ota_manipulations ? this.booking.ota_manipulations[this.booking.ota_manipulations.length - 1] : null;
    const showPms = (calendar_data.property?.linked_pms || [])?.findIndex(lp => lp?.is_active && lp?.bookings_integration_mode?.code === '001') !== -1;
    return (
      <div class="booking-header">
        <div class="booking-header__row">
          <div class="booking-header__info">
            <div class="booking-header__title">
              <div class="booking-header__label-container">
                {this.hasMenu && (
                  <Fragment>
                    <wa-tooltip for="menu">Go back</wa-tooltip>
                    <ir-custom-button id="menu" variant="neutral" size="small" appearance="plain">
                      {/* <wa-icon name="list" style={{ fontSize: '1.2rem' }} label="Go back"></wa-icon> */}
                      <wa-icon name="arrow-left" style={{ fontSize: '1.2rem' }} label="Go back"></wa-icon>
                    </ir-custom-button>
                  </Fragment>
                )}
                <div class={'booking-header__label'}>
                  <h4 class="booking-header__label-number">{`${locales.entries.Lcz_Booking}#${this.booking.booking_nbr}`}</h4>
                  <div class="booking-header__meta">
                    {!this.booking.is_direct && <p class="booking-header__channel-number">{this.booking.channel_booking_nbr}</p>}
                    {lastManipulation && (
                      <Fragment>
                        <p id={`booking-${this.booking.booking_nbr}-modified`} class="booking-header__modified">
                          Modified
                        </p>

                        <wa-tooltip for={`booking-${this.booking.booking_nbr}-modified`}>
                          <div>
                            <p class="m-0">
                              Modified by {lastManipulation?.user} at {lastManipulation?.date} {lastManipulation?.hour}:{lastManipulation?.minute}.
                            </p>
                            <p class="m-0">{this.alertMessage}</p>
                          </div>
                        </wa-tooltip>
                      </Fragment>
                    )}
                  </div>
                </div>
              </div>
              <div>
                {this.booking.allowed_actions.length > 0 && this.booking.is_editable ? (
                  <wa-dropdown
                    onwa-hide={e => {
                      e.stopImmediatePropagation();
                      e.stopPropagation();
                    }}
                    onwa-select={e => {
                      this.bookingStatus = (e.detail as any).item.value;
                      this.modalEl.openModal();
                    }}
                  >
                    <wa-button
                      slot="trigger"
                      // onClickHandler={() => {
                      //   if (!this.booking.is_direct) {
                      //     this.modalEl.openModal();
                      //     return;
                      //   }
                      //   this.updateStatus();
                      // }}

                      withCaret
                      // loading={isRequestPending('/Change_Exposed_Booking_Status')}
                      appearance={'outlined'}
                      size="small"
                      variant="brand"
                      class="booking-header__status-trigger"
                    >
                      <ir-booking-status-tag slot="start" status={this.booking.status} isRequestToCancel={this.booking.is_requested_to_cancel}></ir-booking-status-tag>

                      <span>Update status</span>
                    </wa-button>
                    {this.booking.allowed_actions.map(option => (
                      <wa-dropdown-item variant={['CANC_RA', 'NOSHOW_RA'].includes(option.code) ? 'danger' : 'default'} value={option.code}>
                        {option.description}
                      </wa-dropdown-item>
                    ))}
                  </wa-dropdown>
                ) : (
                  <ir-booking-status-tag status={this.booking.status} isRequestToCancel={this.booking.is_requested_to_cancel}></ir-booking-status-tag>
                )}
              </div>
            </div>
          </div>

          <div class="booking-header__actions">
            <ir-custom-button
              onClickHandler={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.openDialog({ type: 'events-log' });
              }}
              appearance={'outlined'}
              class="booking-header__stretched-btn"
              size="small"
              variant="brand"
            >
              Events log
            </ir-custom-button>
            {showPms && (
              <ir-custom-button
                class="booking-header__stretched-btn"
                onClickHandler={e => {
                  e.stopImmediatePropagation();
                  e.stopPropagation();
                  this.openDialog({ type: 'pms' });
                }}
                appearance={'outlined'}
                size="small"
                variant="brand"
              >
                PMS
              </ir-custom-button>
            )}

            {this.hasReceipt && (
              <Fragment>
                <ir-custom-button class="booking-header__stretched-btn" id="invoice" variant="brand" size="small" appearance="outlined">
                  Billing
                </ir-custom-button>
              </Fragment>
            )}
            {this.hasPrint && (
              <Fragment>
                <wa-tooltip for="print">Print booking</wa-tooltip>
                <ir-custom-button id="print" variant="brand" size="small" appearance="outlined">
                  <wa-icon label="Print" name="print" style={{ fontSize: '1.2rem' }}></wa-icon>
                </ir-custom-button>
              </Fragment>
            )}

            {this.hasEmail && (
              <Fragment>
                <wa-tooltip for="email">Email this booking to guest</wa-tooltip>
                <ir-custom-button id="email" variant="brand" size="small" appearance="outlined">
                  <wa-icon name="envelope" style={{ fontSize: '1.2rem' }} label="Email this booking"></wa-icon>
                </ir-custom-button>
              </Fragment>
            )}
            {this.hasDelete && (
              <Fragment>
                <wa-tooltip for="book-delete">Delete this booking</wa-tooltip>
                <ir-custom-button id="book-delete" variant="danger" size="small" appearance="plain">
                  <wa-icon name="envelope" style={{ fontSize: '1.2rem' }} label="Delete this booking"></wa-icon>
                </ir-custom-button>
              </Fragment>
            )}
            {this.hasCloseButton && (
              <ir-custom-button
                onClickHandler={e => {
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  this.closeSidebar.emit(null);
                }}
                id="close"
                variant="neutral"
                size="small"
                appearance="plain"
              >
                <wa-icon name="xmark" style={{ fontSize: '1.2rem' }} label="Go back"></wa-icon>
              </ir-custom-button>
            )}
          </div>
        </div>
        <ir-dialog
          onIrDialogHide={_ => {
            this.currentDialogStatus = null;
          }}
          label={this.currentDialogStatus === 'pms' ? locales.entries.Lcz_PMS_Logs : locales.entries.Lcz_EventsLog}
          style={this.currentDialogStatus === 'events-log' && { '--ir-dialog-max-width': 'max-content' }}
          ref={el => (this.dialogRef = el)}
        >
          {this.renderDialogBody()}
        </ir-dialog>

        <ir-dialog
          ref={el => (this.modalEl = el)}
          label="Alert"
          lightDismiss={false}
          onIrDialogHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
          }}
          onIrDialogAfterHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.bookingStatus = null;
          }}
        >
          <p>{this.booking.is_direct ? 'Are you sure you want to update this booking status?' : locales.entries.Lcz_OTA_Modification_Alter}</p>
          <div class="ir-dialog__footer" slot="footer">
            <ir-custom-button data-dialog="close" size="medium" appearance="filled" variant="neutral">
              {locales?.entries?.Lcz_Cancel}
            </ir-custom-button>
            <ir-custom-button
              onClickHandler={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.updateStatus();
              }}
              size="medium"
              variant="brand"
              loading={isRequestPending('/Change_Exposed_Booking_Status')}
            >
              {locales?.entries?.Lcz_Confirm}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </div>
    );
  }
}
