import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { Booking, ExtraService } from '@/models/booking.dto';
import { formatAmount } from '@/utils/utils';
import { getEntryValue } from '@/services/setup';
import { BookingService } from '@/services/booking-service/booking.service';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import { _formatTime, isAgentMode } from '../../functions';
import calendar_data from '@/stores/calendar-data';
import { SetupEntries } from '@/models/property';
import { Agent } from '@/services/agents/type';
import type { ClTx } from '@/services/city-ledger/types';
import { mapClTxToFolioRow } from '@/components/ir-city-ledger/ir-city-ledger-folio/types';
import { SvcCategory } from '@/types/enums';
import { formatDate } from '@/utils/date';
import { formatCount } from '@/utils/number';
import { LocaleController } from '@/services/locale/locale.controller';

import { t } from '@/services/locale/t';
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
  @Prop() svcCategories: SetupEntries[];
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

  private get category(): SetupEntries | undefined {
    return this.svcCategories?.find(c => c.CODE_NAME === this.service?.category?.code);
  }

  private get categoryLabel(): string | null {
    const category = this.category;
    return category ? getEntryValue({ entry: category, language: LocaleController.language }) : null;
  }

  private get description() {
    const categoryLabel = this.categoryLabel;
    if (categoryLabel) {
      return (
        <span>
          <span>
            {categoryLabel}
            {this.service.description ? ':' : ''}{' '}
          </span>
          {this.service.description}
        </span>
      );
    }
    return this.service.description;
  }

  private get matchedTx(): ClTx | null {
    return this.clTransactions.find(tx => tx.REL_ENTITY_KEY === this.service.system_id) ?? null;
  }

  private get linkedUnitName(): string | null {
    if (this.service?.pr_id == null) {
      return null;
    }
    for (const roomtype of calendar_data.property?.roomtypes ?? []) {
      const physicalRoom = (roomtype.physicalrooms ?? []).find((pr: { id: number; name: string }) => pr.id === this.service.pr_id);
      if (physicalRoom) {
        return physicalRoom.name;
      }
    }
    return null;
  }
  /**
   * Opens the existing day-use reservation's details drawer — same `showBookingPopup`/`EDIT_BOOKING`
   * path `igl-booking-event-hover`'s "Edit booking" action uses, so `igloo-calendar.tsx`'s existing
   * `editBookingItem` wiring picks it up without any new plumbing.
   */
  private formatDayUseTime(time: string): string {
    const [hour, minute] = time.split(':');
    return _formatTime(hour, minute);
  }
  render() {
    const agentMode = isAgentMode(this.agent);
    const tx = this.matchedTx;
    const statusTag = tx ? <ir-cl-status-tag transaction={{ _rowId: '', ...mapClTxToFolioRow(tx), balance: 0 }} size="extra-small"></ir-cl-status-tag> : null;
    const unitName = this.linkedUnitName;
    const hasMeta = !!(this.service.start_date || unitName || statusTag);
    return (
      <Host>
        <div class="es-row">
          <div class="es-content">
            <p class="es-description">
              {this.description}
              {this.service.category.code === SvcCategory.DayUse && (
                <span>
                  : {this.formatDayUseTime(this.service.from_time)} – {this.formatDayUseTime(this.service.to_time)}
                </span>
              )}
            </p>
            {hasMeta && (
              <div class="es-meta">
                {this.service.start_date &&
                  (this.service.end_date && this.service?.category?.code !== SvcCategory.DayUse ? (
                    <ir-date-view class="es-meta-date" from_date={this.service.start_date} to_date={this.service.end_date} showDateDifference={false}></ir-date-view>
                  ) : (
                    <span class="es-meta-date">{formatDate(new Date(this.service.start_date), 'MMM DD, YYYY')} </span>
                  ))}
                {unitName && <ir-unit-tag unit={unitName}></ir-unit-tag>}
                {statusTag}
              </div>
            )}
          </div>

          <div class="es-aside">
            {!!this.service.price && this.service.price > 0 && (
              <div class="es-pricing">
                <p class="es-price">{formatAmount(this.currencySymbol, this.service.price)}</p>
                {!!this.service.charges?.vat_percent && (
                  <p class="es-vat">{t('Lcz_InclVat', { fallback: 'incl. %1% VAT', params: [formatCount(this.service.charges.vat_percent)] })}</p>
                )}
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
              <wa-button
                class="es-action-trigger"
                slot="trigger"
                size="s"
                appearance="plain"
                id={`extra-service-actions-${this.service.system_id}`}
                variant="neutral"
                aria-label={t('Lcz_ServiceActions', { fallback: 'Service actions' })}
              >
                <wa-icon class="es-action-trigger-icon" name="ellipsis-vertical"></wa-icon>
              </wa-button>
              <wa-dropdown-item value="edit">{t('Lcz_Edit', { fallback: 'Edit' })}</wa-dropdown-item>
              {agentMode && (
                <wa-dropdown-item value="toggle">
                  {t('Lcz_ReassignFolioDropdown', {
                    fallback: 'Re-assign %1 folio',
                    params: [this.service.agent ? t('Lcz_GuestLowercase', { fallback: 'guest' }) : t('Lcz_AgentLowercase', { fallback: 'agent' })],
                  })}
                </wa-dropdown-item>
              )}
              <wa-dropdown-item value="delete" variant="danger">
                {t('Lcz_Delete', { fallback: 'Delete' })}
              </wa-dropdown-item>
            </wa-dropdown>
          </div>
        </div>
        <ir-assignment-toggle-dialog
          ref={el => (this.toggleDialogRef = el)}
          loading={this.isToggling}
          message={t('Lcz_SwitchFolioConfirm', {
            fallback: 'Switch "%1" to %2?',
            params: [
              this.service.description,
              this.service.agent ? t('Lcz_GuestLowercase', { fallback: 'guest' }) : (this.booking?.agent?.name ?? t('Lcz_AgentLowercase', { fallback: 'agent' })),
            ],
          })}
          onConfirmToggle={() => this.toggleServiceAgent()}
        >
          <span slot="message">
            {t('Lcz_ReassignFolioMessage', {
              fallback: 'Re-assign %1 from %2 folio to %3 folio.',
              params: [
                this.service.description ?? '',
                this.service.agent ? t('Lcz_Agent', { fallback: 'Agent' }) : t('Lcz_Guest', { fallback: 'Guest' }),
                this.service.agent ? t('Lcz_Guest', { fallback: 'Guest' }) : t('Lcz_Agent', { fallback: 'Agent' }),
              ],
            })}
          </span>
        </ir-assignment-toggle-dialog>
        <ir-dialog
          onIrDialogHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
          }}
          label={t('Lcz_Alert', { fallback: 'Alert' })}
          ref={el => (this.irModalRef = el)}
          lightDismiss={false}
        >
          {`${t('Lcz_AreYouSureDoYouWantToRemove ')} ${t('Lcz_ThisService')} ${t('Lcz_FromThisBooking')}`}
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button appearance="filled" variant="neutral" size="m" data-dialog="close">
              {t('Lcz_Cancel', { fallback: 'Cancel' })}
            </ir-custom-button>
            <ir-custom-button onClickHandler={() => this.deleteService()} loading={isRequestPending('/Do_Booking_Extra_Service')} variant="danger" size="m">
              {t('Lcz_Delete', { fallback: 'Delete' })}
            </ir-custom-button>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
