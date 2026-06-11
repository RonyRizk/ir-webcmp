import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { AssignableItem } from '../types';
import { formatAmount } from '@/utils/utils';

@Component({
  tag: 'ir-booking-assign-items',
  styleUrl: 'ir-booking-assign-items.css',
  scoped: true,
})
export class IrBookingAssignItems {
  @Prop() items: AssignableItem[] = [];

  @State() checkedItems: Set<string> = new Set();

  @Event() bookingSelectionChange: EventEmitter<Set<string>>;

  private toggleItem(key: string) {
    const updated = new Set(this.checkedItems);
    if (updated.has(key)) {
      updated.delete(key);
    } else {
      updated.add(key);
    }
    this.checkedItems = updated;
    this.bookingSelectionChange.emit(this.checkedItems);
  }

  private renderRoomItem(item: AssignableItem) {
    const checked = this.checkedItems.has(item.key);
    return (
      <div
        key={item.key}
        class={{ 'assign-item': true, 'assign-item--checked': checked }}
        onClick={e => {
          if (!(e.target as HTMLElement).closest('wa-checkbox')) {
            this.toggleItem(item.key);
          }
        }}
      >
        <wa-checkbox checked={checked} onchange={() => this.toggleItem(item.key)}></wa-checkbox>
        <div class="assign-item__text">
          <div class="assign-item__room-header">
            <span class="assign-item__label">{item.label}</span>
            {item.ratePlanShortName && <span class="assign-item__rateplan">{item.ratePlanShortName}</span>}
            {item.unitName && <ir-unit-tag unit={item.unitName}></ir-unit-tag>}
            {item.isNonRefundable && <span class="assign-item__badge assign-item__badge--nr">Non-refundable</span>}
          </div>
          {item.fromDate && item.toDate && (
            <ir-date-view class="assign-item__date" format="ddd, MMM DD, YYYY" from_date={item.fromDate} to_date={item.toDate} showDateDifference={false}></ir-date-view>
          )}
        </div>
      </div>
    );
  }

  private renderCheckItem(item: AssignableItem) {
    const checked = this.checkedItems.has(item.key);
    return (
      <div
        key={item.key}
        class={{ 'assign-item': true, 'assign-item--checked': checked }}
        onClick={e => {
          if (!(e.target as HTMLElement).closest('wa-checkbox')) {
            this.toggleItem(item.key);
          }
        }}
      >
        <wa-checkbox defaultChecked={checked} checked={checked} onchange={() => this.toggleItem(item.key)}></wa-checkbox>
        <div class="assign-item__text">
          <span class="assign-item__label">{item.label}</span>
        </div>
      </div>
    );
  }

  private renderExtraItem(item: AssignableItem) {
    const checked = this.checkedItems.has(item.key);
    return (
      <div
        key={item.key}
        class={{ 'assign-item': true, 'assign-item--checked': checked }}
        onClick={e => {
          if (!(e.target as HTMLElement).closest('wa-checkbox')) {
            this.toggleItem(item.key);
          }
        }}
      >
        <wa-checkbox
          defaultChecked={checked}
          checked={checked}
          onchange={() => {
            this.toggleItem(item.key);
          }}
        ></wa-checkbox>
        <div class="assign-item__text">
          <div class="assign-item__room-header">
            <span class="assign-item__label">{item.label}</span>
            {item.price != null && item.price > 0 && <span class="assign-item__rateplan">{formatAmount(item.currencySymbol, item.price)}</span>}
          </div>
          {item.fromDate && (
            <ir-date-view class="assign-item__date" format="ddd, MMM DD, YYYY" from_date={item.fromDate} to_date={item.toDate} showDateDifference={false}></ir-date-view>
          )}
        </div>
      </div>
    );
  }

  render() {
    const rooms = this.items.filter(i => i.type === 'room');
    const pickups = this.items.filter(i => i.type === 'pickup');
    const extras = this.items.filter(i => i.type === 'extra');

    return (
      <Host size="small">
        <div class="assign-container">
          <p class="assign-intro">Select services for the Agent folio; others remain on the Guest folio.</p>

          {rooms.length > 0 && (
            <div class="assign-section">
              <p class="assign-section__label">Accommodation</p>
              {rooms.map(item => this.renderRoomItem(item))}
            </div>
          )}

          {pickups.length > 0 && (
            <div class="assign-section">
              <p class="assign-section__label">Pickup</p>
              {pickups.map(item => this.renderCheckItem(item))}
            </div>
          )}

          {extras.length > 0 && (
            <div class="assign-section">
              <p class="assign-section__label">Extra Services</p>
              {extras.map(item => this.renderExtraItem(item))}
            </div>
          )}
        </div>
      </Host>
    );
  }
}
