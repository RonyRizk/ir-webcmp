import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { Booking, ExtraService } from '@/models/booking.dto';
import { formatAmount, getEntryValue } from '@/utils/utils';
import locales from '@/stores/locales.store';
import moment from 'moment';
import { BookingService } from '@/services/booking-service/booking.service';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { isAgentMode } from '../../functions';
import { IEntries } from '@/models/property';
import { Agent } from '@/services/agents/type';
import type { ClTx } from '@/services/city-ledger/types';
import { mapClTxToFolioRow } from '@/components/ir-city-ledger/ir-city-ledger-folio/types';

@Component({
  tag: 'ir-extra-service',
  styleUrl: 'ir-extra-service.css',
  scoped: true,
})
export class IrExtraService {
  @Prop() service: ExtraService;
  @Prop() booking: Booking;
  @Prop() agent: Agent;
  @Prop() bookingNumber: string;
  @Prop() currencySymbol: string;
  @Prop() language: string = 'en';
  @Prop() svcCategories: IEntries[];
  @Prop() clTransactions: ClTx[] = [];

  @Event() editExtraService: EventEmitter<ExtraService>;
  @Event() resetBookingEvt: EventEmitter<null>;

  @State() private isToggling = false;

  private irModalRef: HTMLIrDialogElement;
  private toggleDialogRef: HTMLIrAssignmentToggleDialogElement;
  private bookingService = new BookingService();

  private async deleteService() {
    try {
      await this.bookingService.doBookingExtraService({
        service: this.service,
        is_remove: true,
        booking_nbr: this.bookingNumber,
      });
      this.irModalRef.closeModal();
      this.resetBookingEvt.emit(null);
    } catch (error) {
      console.log(error);
    }
  }

  private async toggleServiceAgent() {
    try {
      this.isToggling = true;
      await this.bookingService.doBookingExtraService({
        service: { ...this.service, agent: this.service.agent ? null : this.booking?.agent },
        is_remove: false,
        booking_nbr: this.bookingNumber,
      });
      this.toggleDialogRef.closeModal();
      this.resetBookingEvt.emit(null);
    } catch (error) {
      console.log(error);
    } finally {
      this.isToggling = false;
    }
  }

  private get description() {
    const category = this.svcCategories?.find(c => c.CODE_NAME === this.service?.category?.code);
    if (category) {
      return (
        <span>
          <span>{getEntryValue({ entry: category, language: this.language })}: </span>
          {this.service.description}
        </span>
      );
    }
    return this.service.description;
  }

  private get matchedTx(): ClTx | null {
    return this.clTransactions.find(tx => tx.REL_ENTITY_KEY === this.service.system_id) ?? null;
  }

  render() {
    const agentMode = isAgentMode(this.agent);
    const tx = this.matchedTx;
    const statusTag = tx ? <ir-cl-status-tag transaction={{ _rowId: '', ...mapClTxToFolioRow(tx), balance: 0 }} size="extra-small"></ir-cl-status-tag> : null;
    return (
      <Host>
        <div class="es-row">
          <div class="es-content">
            <p class="es-description">{this.description}</p>
            {this.service.start_date ? (
              <div class="es-date">
                {/* <wa-icon name="calendar" style={{ fontSize: '0.75rem' }}></wa-icon> */}
                {this.service.end_date ? (
                  <ir-date-view from_date={this.service.start_date} to_date={this.service.end_date} showDateDifference={false}></ir-date-view>
                ) : (
                  <span>{moment(new Date(this.service.start_date)).format('MMM DD, YYYY')}</span>
                )}
                {statusTag}
              </div>
            ) : (
              statusTag
            )}
          </div>

          <div class="es-aside">
            {!!this.service.price && this.service.price > 0 && (
              <div class="es-pricing">
                <p class="es-price">{formatAmount(this.currencySymbol, this.service.price)}</p>
                {!!this.service.charges?.vat_percent && <p class="es-vat">incl. {this.service.charges.vat_percent}% VAT</p>}
              </div>
            )}
            <wa-dropdown
              onwa-show={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
              }}
              onwa-hide={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
              }}
              onwa-select={e => {
                switch ((e.detail as any).item.value) {
                  case 'edit':
                    this.editExtraService.emit(this.service);
                    break;
                  case 'delete':
                    this.irModalRef.openModal();
                    break;
                  case 'toggle':
                    this.toggleDialogRef.openModal();
                    break;
                }
              }}
            >
              <wa-button class="es-action-trigger" slot="trigger" size="s" appearance="plain" id={`actions-room-${this.service.system_id}`} variant="neutral">
                <wa-icon class="es-action-trigger-icon" label="Actions" name="ellipsis-vertical"></wa-icon>
              </wa-button>
              <wa-dropdown-item value="edit">Edit</wa-dropdown-item>
              {agentMode && <wa-dropdown-item value="toggle">Re-assign to {this.service.agent ? 'guest' : 'agent'} folio</wa-dropdown-item>}
              <wa-dropdown-item value="delete" variant="danger">
                Delete
              </wa-dropdown-item>
            </wa-dropdown>
          </div>
        </div>
        <ir-assignment-toggle-dialog
          ref={el => (this.toggleDialogRef = el)}
          loading={this.isToggling}
          message={`Switch "${this.service.description}" to ${this.service.agent ? 'guest' : (this.booking?.agent?.name ?? 'agent')}?`}
          onConfirmToggle={() => this.toggleServiceAgent()}
        >
          <span slot="message">
            Re-assign {this.description} <br /> from {this.service.agent ? 'Agent' : 'Guest'} folio to <b>{this.service.agent ? 'Guest' : 'Agent'} folio</b>.
          </span>
        </ir-assignment-toggle-dialog>
        <ir-dialog
          onIrDialogHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
          }}
          label="Alert"
          ref={el => (this.irModalRef = el)}
          lightDismiss={false}
        >
          {`${locales.entries['Lcz_AreYouSureDoYouWantToRemove ']} ${locales.entries.Lcz_ThisService} ${locales.entries.Lcz_FromThisBooking}`}
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button appearance="filled" variant="neutral" size="m" data-dialog="close">
              {locales.entries.Lcz_Cancel}
            </ir-custom-button>
            <ir-custom-button onClickHandler={() => this.deleteService()} loading={isRequestPending('/Do_Booking_Extra_Service')} variant="danger" size="m">
              {locales.entries.Lcz_Delete}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
