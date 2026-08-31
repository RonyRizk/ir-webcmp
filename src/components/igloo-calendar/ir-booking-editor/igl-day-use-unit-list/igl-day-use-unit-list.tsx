import { PhysicalRoom, RoomType } from '@/models/property';
import { Component, Event, EventEmitter, Fragment, Host, Prop, State, h } from '@stencil/core';
import calendar_data, { getExtraServiceDefaultPrice } from '@/stores/calendar-data';
import booking_store from '@/stores/booking.store';
import { DAY_USE_CATEGORY_CODE, DAY_USE_STATUS_ICON, DayUseUnitDayStatus, formatDayUseStatusText, getDayUseUnitAvailability } from '@/utils/booking';
import { ExtraService } from '@/models/booking.dto';
import { BookingEditorMode } from '../types';

@Component({
  tag: 'igl-day-use-unit-list',
  styleUrl: 'igl-day-use-unit-list.css',
  scoped: true,
})
export class IglDayUseUnitList {
  @Prop() mode: BookingEditorMode;
  /** Room types returned by the day-use availability check. */
  @Prop() roomTypes: RoomType[] = [];

  /** Fallback day-use price used only if the property has no `SVC_DEFAULT_PRICE_DUZ` configured, editable per unit. */
  @Prop() price: number;

  /** Net (tax-exclusive) version of the resolved gross default price, pre-computed by the parent (`calculateNetAmount`) — shown as the input's default value so an untouched default reads the same way a typed custom (net) amount does. */
  @Prop() netPrice: number | null = null;

  @Prop() currency;

  /** Unit ids already booked for day use on the target date (from `getDayUseBookingsForCalendar`) — excluded from the list. */
  @Prop() bookedUnitIds: Set<number> = new Set();

  /** When a specific unit was preselected (e.g. double-click on a room title in the calendar), only that unit is shown. */
  @Prop() unitId?: string | number;

  /** Unit id currently being resolved (gross-price lookup) after "Book" was clicked — disables the other buttons. */
  @Prop() resolvingUnitId: number | null = null;

  /** Whether an availability check has completed at least once — distinguishes "no search yet" (render nothing) from "searched, zero units" (show empty state). */
  @Prop() hasSearched: boolean = false;

  /**
   * The day-use extra service currently being edited (`ir-booking-editor` `mode="EDIT_DAY_USE"`).
   * Its unit is exempt from `bookedUnitIds` (it's its own existing booking, not a conflict), never
   * shows the upcoming-check-in warning (same reason), gets its price prefilled, and is highlighted.
   */
  @Prop() currentExtraService?: ExtraService;

  @State() priceOverrides: Record<number, number> = {};

  @Event() unitSelected: EventEmitter<{ unit: PhysicalRoom; roomType: RoomType; price: number; isCustomPrice: boolean }>;

  componentWillLoad() {
    const { dayUseSelection } = booking_store;
    if (dayUseSelection && dayUseSelection.isCustomPrice) {
      this.priceOverrides = { ...this.priceOverrides, [dayUseSelection.unit.id]: dayUseSelection.netAmount };
    } else if (this.currentExtraService?.pr_id != null && this.currentExtraService.charges?.net_amount != null) {
      this.priceOverrides = { ...this.priceOverrides, [this.currentExtraService.pr_id]: this.currentExtraService.charges.net_amount };
    }
  }

  private isCurrentUnit(unitId: number): boolean {
    return this.currentExtraService?.pr_id === unitId;
  }

  private getAvailableUnits(roomType: RoomType): { unit: PhysicalRoom; dayStatus: DayUseUnitDayStatus; checkoutTime: string | null; checkinTime: string | null }[] {
    const evaluated = (roomType.physicalrooms ?? []).map(unit => {
      const { available, dayStatus, checkoutTime, checkinTime } = getDayUseUnitAvailability(unit.calendar_cell);
      const isCurrent = this.isCurrentUnit(unit.id);
      return { unit, available, dayStatus: isCurrent ? null : dayStatus, checkoutTime: isCurrent ? null : checkoutTime, checkinTime: isCurrent ? null : checkinTime };
    });
    const bookable = evaluated.filter(({ unit, available }) => available && (this.isCurrentUnit(unit.id) || !this.bookedUnitIds?.has(unit.id)));
    if (this.unitId === undefined || this.unitId === null || this.unitId === '') {
      return bookable;
    }
    return bookable.filter(({ unit }) => unit.id.toString() === this.unitId.toString());
  }

  private get defaultPrice(): number {
    const svcDefaultPrice = getExtraServiceDefaultPrice(DAY_USE_CATEGORY_CODE);
    return svcDefaultPrice !== undefined ? Number(svcDefaultPrice) : (this.price ?? 0);
  }

  /** What's actually shown as the default input value — the net-converted price when it's ready, otherwise the gross default as a fallback while it resolves. */
  private get displayDefaultPrice(): number {
    return this.netPrice ?? this.defaultPrice;
  }

  private getPrice(unitId: number): number {
    return this.priceOverrides[unitId] ?? this.displayDefaultPrice;
  }

  private isCustomPrice(unitId: number): boolean {
    return this.priceOverrides[unitId] !== undefined;
  }

  render() {
    const availableRoomTypes = (this.roomTypes ?? []).filter(roomType => {
      if (roomType.is_active) {
        return true;
      }
      if (roomType.physicalrooms.some(p => p.id === this.currentExtraService?.pr_id)) {
        return true;
      }
      return false;
    });
    const hasBookableUnit = availableRoomTypes.some(roomType => this.getAvailableUnits(roomType).length > 0);

    if (this.hasSearched && !hasBookableUnit) {
      return (
        <div class="day-use-unit-list__empty-container">
          <ir-empty-state message="No units available for the selected date."></ir-empty-state>
        </div>
      );
    }

    return (
      <Host>
        {availableRoomTypes.length > 0 && (
          <div class="day-use-unit-list__infos">
            {this.mode !== 'BAR_BOOKING' && (
              <p class={'m-0 p-0'}>{this.currentExtraService ? 'Edit the existing unit or switch the booking to another one.' : 'Pick a unit for day-use.'}</p>
            )}
            {calendar_data.property.tax_statement && (
              <wa-callout size="s" variant="neutral" appearance="filled" class="booking-editor-header__tax_statement">
                {/* Including taxes and fees. */}
                {calendar_data.property.tax_statement}
              </wa-callout>
            )}
          </div>
        )}
        <div class="day-use-unit-list__grid">
          {availableRoomTypes.map(roomType => {
            const units = this.getAvailableUnits(roomType);
            if (units.length === 0) {
              return null;
            }
            return (
              <Fragment>
                <h5 class="day-use-unit-list__roomtype-name">{roomType.name}</h5>
                {units.map(({ unit, dayStatus, checkoutTime, checkinTime }) => {
                  const isCurrent = this.isCurrentUnit(unit.id);
                  const dayStatusIcon = dayStatus ? DAY_USE_STATUS_ICON[dayStatus] : null;
                  return (
                    <div class={`day-use-unit-list__row${isCurrent ? ' day-use-unit-list__row--current' : ''}`} key={`day-use-unit-row-${unit.id}`}>
                      <span class="day-use-unit-list__unit-name">
                        {unit.name}
                        {dayStatus && dayStatusIcon && (
                          <Fragment>
                            <wa-tooltip for={`day-use-day-status-${unit.id}`}>{formatDayUseStatusText(dayStatus, checkoutTime, checkinTime)}</wa-tooltip>
                            <wa-icon
                              name={dayStatusIcon}
                              id={`day-use-day-status-${unit.id}`}
                              class={`day-use-unit-list__day-status-icon day-use-unit-list__day-status-icon--${dayStatus}`}
                            ></wa-icon>
                          </Fragment>
                        )}
                      </span>
                      <ir-input
                        class="day-use-unit-list__price-input"
                        size="s"
                        mask="price"
                        value={this.getPrice(unit.id).toString()}
                        onText-change={e => (this.priceOverrides = { ...this.priceOverrides, [unit.id]: Number(e.detail) })}
                      >
                        <span slot="start">{this.currency?.symbol}</span>
                      </ir-input>
                      <div class="day-use-unit-list__book-cell">
                        <ir-custom-button
                          data-testid="book"
                          type="button"
                          size="s"
                          variant="brand"
                          appearance={this.currentExtraService && !isCurrent ? 'outlined' : 'accent'}
                          class="day-use-unit-list__book-button"
                          loading={this.resolvingUnitId === unit.id}
                          disabled={this.resolvingUnitId !== null && this.resolvingUnitId !== unit.id}
                          onClickHandler={() => this.unitSelected.emit({ unit, roomType, price: this.getPrice(unit.id), isCustomPrice: this.isCustomPrice(unit.id) })}
                        >
                          Book
                        </ir-custom-button>
                        {dayStatus && <span class="day-use-unit-list__day-status-text">{formatDayUseStatusText(dayStatus, checkoutTime, checkinTime)}</span>}
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </Host>
    );
  }
}
