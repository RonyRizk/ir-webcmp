import { Component, h, Prop, Event, EventEmitter } from '@stencil/core';
import { isAgentMode } from '../../functions';
import { IUnit, Room, ROOM_IN_OUT } from '@/models/booking.dto';
import { Agent } from '@/services/agents/type';
import calendar_data from '@/stores/calendar-data';
import { formatAmount } from '@/utils/utils';
import { HbPreference } from '@/types/enums';

import { t } from '@/services/locale/t';
export type IrRoomHeaderAction = 'edit' | 'edit-rates' | 'delete' | 'toggle' | 'add-extra-service' | 'print-registration-card';

@Component({
  tag: 'ir-room-header',
  styleUrl: 'ir-room-header.css',
  scoped: true,
})
export class IrRoomHeader {
  @Prop() room: Room;
  @Prop() myRoomTypeFoodCat: string;
  @Prop() mealCodeName: string;
  @Prop() currency: string = 'USD';
  @Prop() isEditable: boolean;
  @Prop() hasRoomEdit: boolean = false;
  @Prop() hasRoomDelete: boolean = false;
  @Prop() agent: Agent;

  @Event() action: EventEmitter<IrRoomHeaderAction>;
  @Event() openHbDialog: EventEmitter<void>;

  private get isHalfBoard() {
    return this.room?.rateplan?.meal_plan?.code === '003' && calendar_data.property.is_frontdesk_enabled;
  }

  private get unitId(): number | null {
    return (this.room.unit as IUnit)?.id ?? null;
  }

  /** Registration card exists once the guest checked in — and stays printable after check-out. */
  private get canPrintRegistrationCard() {
    const code = this.room?.in_out?.code;
    return (code === ROOM_IN_OUT.CHECKIN || code === ROOM_IN_OUT.CHECKOUT) && calendar_data.property.is_frontdesk_enabled;
  }

  render() {
    const canEdit = this.isEditable && (this.hasRoomEdit || this.hasRoomDelete || !!this.unitId);
    return (
      <div class="booking-room__summary-row">
        <p class="booking-room__summary-text">
          <span class="booking-room__summary-highlight">{this.myRoomTypeFoodCat || ''} </span> {this.mealCodeName}{' '}
          {this.room.rateplan.is_non_refundable && ` - ${t('Lcz_NonRefundable', { fallback: 'Non-refundable' })}`}{' '}
          {this.isHalfBoard && (
            <wa-button
              size="xs"
              class="booking-room__meal-report-button"
              appearance="filled"
              variant={this.room?.hb_preference ? 'brand' : 'warning'}
              onClick={() => this.openHbDialog.emit()}
            >
              {this.room?.hb_preference === HbPreference.Lunch
                ? t('Lcz_WithLunch', { fallback: 'With lunch' })
                : this.room?.hb_preference === HbPreference.Dinner
                  ? t('Lcz_WithDinner', { fallback: 'With dinner' })
                  : t('Lcz_ChooseLunchOrDinner', { fallback: 'Choose lunch or dinner' })}
            </wa-button>
          )}
        </p>

        <div class="booking-room__price-row">
          <span class="booking-room__price">{formatAmount(this.currency, this.room['gross_total'])}</span>

          {(canEdit || this.canPrintRegistrationCard) && (
            <div class="booking-room__actions">
              <wa-dropdown
                onwa-show={e => {
                  e.stopImmediatePropagation();
                  e.stopPropagation();
                }}
                onwa-hide={e => {
                  e.stopImmediatePropagation();
                  e.stopPropagation();
                }}
                onwa-select={async e => {
                  this.action.emit((e.detail as any).item.value);
                }}
              >
                <ir-custom-button
                  slot="trigger"
                  size="s"
                  class="booking-room__edit-button"
                  appearance="plain"
                  id={`actions-room-${this.room.identifier}`}
                  iconBtn
                  variant="neutral"
                  style={{ marginBottom: '4px' }}
                >
                  <wa-icon style={{ fontSize: '1rem' }} label={t('Lcz_Actions', { fallback: 'Actions' })} name="ellipsis-vertical"></wa-icon>
                </ir-custom-button>
                {this.isEditable && this.hasRoomEdit && <wa-dropdown-item value="edit">{t('Lcz_EditUnit', { fallback: 'Edit unit' })}</wa-dropdown-item>}
                {this.isEditable && this.hasRoomEdit && <wa-dropdown-item value="edit-rates">{t('Lcz_EditNightlyRates', { fallback: 'Edit Nightly Rates' })}</wa-dropdown-item>}
                {this.isEditable && isAgentMode(this.agent) && this.hasRoomEdit && (
                  <wa-dropdown-item value="toggle">
                    {t('Lcz_ReassignFolioDropdown', {
                      fallback: 'Re-assign %1 folio',
                      params: [this.room.agent ? t('Lcz_GuestLowercase', { fallback: 'guest' }) : t('Lcz_AgentLowercase', { fallback: 'agent' })],
                    })}
                    {/* Re-assign {this.room.agent ? 'guest' : 'agent'} folio */}
                  </wa-dropdown-item>
                )}
                {this.isEditable && !!this.unitId && (
                  <wa-dropdown-item value="add-extra-service">{t('Lcz_AddExtraServiceToUnit', { fallback: 'Add extra service to this unit' })}</wa-dropdown-item>
                )}
                {this.canPrintRegistrationCard && (
                  <wa-dropdown-item value="print-registration-card">{t('Lcz_PrintRegistrationCard', { fallback: 'Print registration card' })}</wa-dropdown-item>
                )}
                {this.isEditable && this.hasRoomDelete && (
                  <wa-dropdown-item value="delete" variant="danger">
                    {t('Lcz_Delete', { fallback: 'Delete' })}
                  </wa-dropdown-item>
                )}
              </wa-dropdown>
            </div>
          )}
        </div>
      </div>
    );
  }
}
