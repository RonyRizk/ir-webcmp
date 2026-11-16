import { Booking } from '@/models/booking.dto';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { Component, Event, EventEmitter, Fragment, h, Listen, Prop, State } from '@stencil/core';
import { BookingDetailsDialogEvents, OpenDialogEvent, OpenSidebarEvent } from '../types';
import { BookingService } from '@/services/booking-service/booking.service';
import calendar_data from '@/stores/calendar-data';
import { isAgentMode } from '../functions';
import { Agent } from '@/services/agents/type';
import { FolioRow } from '@/components/ir-city-ledger/ir-city-ledger-folio/types';
import { isBookingModified, showToast } from '@/utils/utils';
import { formatBookingNumber, formatNumber } from '@/utils/number';

import { t } from '@/services/locale/t';
import { formatDate } from '@/utils/date';
@Component({
  tag: 'ir-booking-header',
  styleUrl: 'ir-booking-header.css',
  scoped: true,
})
export class IrBookingHeader {
  private dialogRef: HTMLIrDialogElement;

  private bookingService = new BookingService();
  private alertMessage = t('Lcz_OtaModificationAlert', {
    fallback:
      'ALERT! Modifying an OTA booking will create a discrepancy between igloorooms and the source. Future guest modifications on the OTA may require manual adjustments of the booking.',
  });
  private modalEl: HTMLIrDialogElement;
  private bookingSourceEditor: HTMLIrBookingSourceEditorDialogElement;

  @State() bookingStatus: string | null = null;
  @State() currentDialogStatus: BookingDetailsDialogEvents;

  @Prop() booking: Booking;
  @Prop() hasReceipt: boolean;
  @Prop() agent: Agent;
  @Prop() hasPrint: boolean;
  @Prop() hasDelete: boolean;
  @Prop() hasMenu: boolean;
  @Prop() hasCloseButton: boolean;
  @Prop() hasEmail: boolean = true;
  @Prop() folioRows: FolioRow[] = [];
  @Prop() agents: Agent[] = [];

  @Event() closeSidebar: EventEmitter<null>;
  @Event() resetBookingEvt: EventEmitter<null>;
  @Event() openSidebar: EventEmitter<OpenSidebarEvent<any>>;

  // private confirmationBG = {
  //   '001': 'bg-ir-orange',
  //   '002': 'bg-ir-green',
  //   '003': 'bg-ir-red',
  //   '004': 'bg-ir-red',
  // };

  @Listen('selectChange')
  handleSelectChange(e: CustomEvent<any>) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    const target = e.target;
    this.bookingStatus = (target as any).selectedValue;
  }
  private async updateStatus() {
    if (!this.bookingStatus || this.bookingStatus === '-1') {
      showToast({
        type: 'error',
        description: '',
        title: t('Lcz_SelectStatus'),
      });
      return;
    }
    try {
      await this.bookingService.changeExposedBookingStatus({
        book_nbr: this.booking.booking_nbr,
        status: this.bookingStatus,
      });
      showToast({
        type: 'success',
        description: '',
        title: t('Lcz_StatusUpdatedSuccessfully'),
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
  private get initials() {
    const { agent } = this.booking;
    if (agent) {
      let c = agent.name.split(' ');
      if (c.length > 1) {
        return c[0][0] + c[1][0];
      }
      return c[0][0] + c[0][1];
    }
    return null;
  }
  private get avatarImage() {
    if (this.booking?.agent) {
      return null;
    }
    return this.booking.origin.Icon;
  }
  private get canChangeSource() {
    return this.booking?.is_source_editable;
    // if (!this.booking.is_direct || this.booking.source?.code?.toLowerCase() === 'ghs' || !this.booking.is_editable) {
    //   return false;
    // }
    // if (this.agents.length === 0) {
    //   return false;
    // }
    // const folioRows = this.folioRows ?? [];
    // if (folioRows?.length > 0) {
    //   return folioRows.every(f => f._raw.IS_LOCKED === false);
    // }
    // return true;
  }

  render() {
    const { modified, lastManipulation } = isBookingModified(this.booking);
    const showPms = (calendar_data.property?.linked_pms || [])?.findIndex(lp => lp?.is_active && lp?.bookings_integration_mode?.code === '001') !== -1;
    return (
      <div class="booking-header">
        <div class="booking-header__row">
          <div class="booking-header__info">
            <div class="booking-header__title">
              <div class="booking-header__label-container">
                {this.hasMenu && (
                  <Fragment>
                    <wa-tooltip for="menu">{t('Lcz_GoBack', { fallback: 'Go back' })}</wa-tooltip>
                    <ir-custom-button id="menu" variant="neutral" size="s" appearance="plain">
                      {/* <wa-icon name="list" style={{ fontSize: '1.2rem' }} label="Go back"></wa-icon> */}
                      <wa-icon class="ir-flip-rtl" name="arrow-left" style={{ fontSize: '1.2rem' }} label={t('Lcz_GoBack', { fallback: 'Go back' })}></wa-icon>
                    </ir-custom-button>
                  </Fragment>
                )}
                <wa-avatar shape="circle" class="booking-header__avatar" initials={this.initials} image={this.avatarImage} loading="lazy"></wa-avatar>
                <div class="booking-header__identity">
                  <div class={'booking-header__label'}>
                    <h4 class="booking-header__label-number">{`${t('Lcz_Booking', { fallback: 'Booking' })}#${formatBookingNumber(this.booking.booking_nbr)}`}</h4>
                    {/* <wa-copy-button value={this.booking.booking_nbr} class="booking-header__booking-copy-btn"></wa-copy-button> */}
                  </div>
                  <div class="booking-header__meta">
                    {!this.booking.is_direct && <p class="booking-header__channel-number --primary">{formatBookingNumber(this.booking.channel_booking_nbr)}</p>}
                    {this.booking.agent_booking_nbr && <p class="booking-header__channel-number --primary">{formatBookingNumber(this.booking.agent_booking_nbr)}</p>}
                    <p class="booking-header__channel-number">
                      {this.booking?.agent ? (
                        <span>
                          {t('Lcz_Agent', { fallback: 'Agent' })}
                          {': '}
                          <p class={'truncate p-0 m-0'} style={{ maxWidth: '150px', display: 'inline-flex' }}>
                            {this.agent.name}{' '}
                            <i style={{ paddingInlineStart: '0.5rem' }} class={'truncate'}>
                              {this.agent.reference}
                            </i>
                          </p>
                        </span>
                      ) : (
                        this.booking.origin.Label
                      )}
                    </p>

                    {this.canChangeSource && (
                      <ir-custom-button link onClickHandler={() => this.bookingSourceEditor.openDialog()}>
                        {t('Lcz_ChangeSource', { fallback: 'Change source' })}
                      </ir-custom-button>
                    )}
                    {modified && (
                      <Fragment>
                        <p id={`booking-${this.booking.booking_nbr}-modified`} class="booking-header__modified">
                          {t('Lcz_Modified', { fallback: 'Modified' })}
                        </p>

                        <wa-tooltip for={`booking-${this.booking.booking_nbr}-modified`}>
                          <div>
                            {lastManipulation && (
                              <p class="m-0">
                                {t('Lcz_ModifiedByAt', {
                                  fallback: 'Modified by %1 at %2 %3:%4.',
                                  params: [
                                    lastManipulation?.user,
                                    formatDate(lastManipulation?.date, 'MMM DD, YYYY'),
                                    formatNumber(Number(lastManipulation?.hour), { minimumIntegerDigits: 2, useGrouping: false }),
                                    formatNumber(Number(lastManipulation?.minute), { minimumIntegerDigits: 2, useGrouping: false }),
                                  ],
                                })}
                              </p>
                            )}
                            <p class="m-0">{this.alertMessage}</p>
                          </div>
                        </wa-tooltip>
                      </Fragment>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="booking-header__actions">
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
                    size="s"
                    variant="brand"
                    class="booking-header__status-trigger"
                  >
                    <ir-booking-status-tag slot="start" status={this.booking.status} isRequestToCancel={this.booking.is_requested_to_cancel}></ir-booking-status-tag>

                    <span>{t('Lcz_UpdateStatus', { fallback: 'Update status' })}</span>
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
            {isAgentMode(this.agent) && (
              <Fragment>
                {/* <ir-custom-button
                  onClickHandler={e => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    this.cityLedgerService.syncBookingToCityLedger({
                      booking_nbr: +this.booking.booking_nbr,
                      is_force_post: true,
                    });
                  }}
                  appearance={'outlined'}
                  class="booking-header__stretched-btn"
                  size="s"
                  variant="warning"
                >
                  Force city ledger
                </ir-custom-button> */}
                {/* <ir-custom-button
                  onClickHandler={e => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    this.invoiceDialogRef.openModal();
                  }}
                  appearance={'outlined'}
                  class="booking-header__stretched-btn"
                  size="s"
                  variant="brand"
                >
                  Invoice to agent
                </ir-custom-button> */}
              </Fragment>
            )}
            <ir-custom-button
              onClickHandler={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.openDialog({ type: 'events-log' });
              }}
              appearance={'outlined'}
              class="booking-header__stretched-btn"
              size="s"
              variant="brand"
            >
              {t('Lcz_Logs', { fallback: 'Logs' })}
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
                size="s"
                variant="brand"
              >
                {t('Lcz_PMS', { fallback: 'PMS' })}
              </ir-custom-button>
            )}

            {this.hasReceipt && (
              <Fragment>
                <ir-custom-button class="booking-header__stretched-btn" id="invoice" variant="brand" size="s" appearance="outlined">
                  {t('Lcz_Billing', { fallback: 'Billing' })}
                </ir-custom-button>
              </Fragment>
            )}
            {this.hasPrint && (
              <Fragment>
                <wa-tooltip for="print">{t('Lcz_PrintBookingTooltip', { fallback: 'Print booking' })}</wa-tooltip>
                <ir-custom-button id="print" variant="brand" size="s" appearance="outlined">
                  <wa-icon label={t('Lcz_Print', { fallback: 'Print' })} name="print" style={{ fontSize: '1.2rem' }}></wa-icon>
                </ir-custom-button>
              </Fragment>
            )}

            {this.hasEmail && (
              <Fragment>
                <wa-tooltip for="email">{t('Lcz_EmailBookingToGuestTooltip', { fallback: 'Email this booking to guest' })}</wa-tooltip>
                <ir-custom-button id="email" variant="brand" size="s" appearance="outlined">
                  <wa-icon name="envelope" style={{ fontSize: '1.2rem' }} label={t('Lcz_EmailThisBooking', { fallback: 'Email this booking' })}></wa-icon>
                </ir-custom-button>
              </Fragment>
            )}
            {this.hasDelete && (
              <Fragment>
                <wa-tooltip for="book-delete">{t('Lcz_DeleteThisBooking', { fallback: 'Delete this booking' })}</wa-tooltip>
                <ir-custom-button id="book-delete" variant="danger" size="s" appearance="plain">
                  <wa-icon name="envelope" style={{ fontSize: '1.2rem' }} label={t('Lcz_DeleteThisBooking', { fallback: 'Delete this booking' })}></wa-icon>
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
                size="s"
                appearance="plain"
              >
                <wa-icon name="xmark" style={{ fontSize: '1.2rem' }} label={t('Lcz_GoBack', { fallback: 'Go back' })}></wa-icon>
              </ir-custom-button>
            )}
          </div>
        </div>
        <ir-dialog
          onIrDialogHide={_ => {
            this.currentDialogStatus = null;
          }}
          label={this.currentDialogStatus === 'pms' ? t('Lcz_PMS_Logs') : t('Lcz_EventsLog')}
          style={this.currentDialogStatus === 'events-log' && { '--ir-dialog-max-width': 'max-content' }}
          ref={el => (this.dialogRef = el)}
        >
          {this.renderDialogBody()}
        </ir-dialog>

        <ir-dialog
          ref={el => (this.modalEl = el)}
          label={t('Lcz_Alert', { fallback: 'Alert' })}
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
          <p>
            {this.booking.is_direct ? t('Lcz_ConfirmUpdateBookingStatus', { fallback: 'Are you sure you want to update this booking status?' }) : t('Lcz_OTA_Modification_Alter')}
          </p>
          <div class="ir-dialog__footer" slot="footer">
            <ir-custom-button data-dialog="close" size="m" appearance="filled" variant="neutral">
              {t('Lcz_Cancel', { fallback: 'Cancel' })}
            </ir-custom-button>
            <ir-custom-button
              onClickHandler={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.updateStatus();
              }}
              size="m"
              variant="brand"
              loading={isRequestPending('/Change_Exposed_Booking_Status')}
            >
              {t('Lcz_Confirm', { fallback: 'Confirm' })}
            </ir-custom-button>
          </div>
        </ir-dialog>
        <ir-booking-source-editor-dialog booking={this.booking} ref={el => (this.bookingSourceEditor = el)}></ir-booking-source-editor-dialog>
      </div>
    );
  }
}
