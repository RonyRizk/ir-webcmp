import { Component, h, Prop, Event, EventEmitter } from '@stencil/core';
import { isAgentMode } from '../../functions';
import { IUnit, Room } from '@/models/booking.dto';
import { Agent } from '@/services/agents/type';
import locales from '@/stores/locales.store';
import calendar_data from '@/stores/calendar-data';
import { formatAmount } from '@/utils/utils';
import { HbPreference } from '@/types/enums';

export type IrRoomHeaderAction = 'edit' | 'edit-rates' | 'delete' | 'toggle' | 'add-extra-service';

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

  render() {
    return (
      <div class="booking-room__summary-row">
        <p class="booking-room__summary-text">
          <span class="booking-room__summary-highlight">{this.myRoomTypeFoodCat || ''} </span> {this.mealCodeName}{' '}
          {this.room.rateplan.is_non_refundable && ` - ${locales.entries.Lcz_NonRefundable}`}{' '}
          {this.isHalfBoard && (
            <wa-button
              size="xs"
              class="booking-room__meal-report-button"
              appearance="filled"
              variant={this.room?.hb_preference ? 'brand' : 'warning'}
              onClick={() => this.openHbDialog.emit()}
            >
              {this.room?.hb_preference === HbPreference.Lunch ? 'With lunch' : this.room?.hb_preference === HbPreference.Dinner ? 'With dinner' : 'Choose lunch or dinner'}
            </wa-button>
          )}
        </p>

        <div class="booking-room__price-row">
          <span class="booking-room__price">{formatAmount(this.currency, this.room['gross_total'])}</span>

          {this.isEditable && (this.hasRoomEdit || this.hasRoomDelete || !!this.unitId) && (
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
                  <wa-icon style={{ fontSize: '1rem' }} label="Actions" name="ellipsis-vertical"></wa-icon>
                </ir-custom-button>
                {this.hasRoomEdit && <wa-dropdown-item value="edit">Edit unit</wa-dropdown-item>}
                {this.hasRoomEdit && <wa-dropdown-item value="edit-rates">Edit nightly rates</wa-dropdown-item>}
                {isAgentMode(this.agent) && this.hasRoomEdit && <wa-dropdown-item value="toggle">Re-assign {this.room.agent ? 'guest' : 'agent'} folio</wa-dropdown-item>}
                {!!this.unitId && <wa-dropdown-item value="add-extra-service">Add extra service to this unit</wa-dropdown-item>}
                {this.hasRoomDelete && (
                  <wa-dropdown-item value="delete" variant="danger">
                    Delete
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
