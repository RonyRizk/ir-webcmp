import { Component, Event, EventEmitter, Host, Listen, Prop, State, h } from '@stencil/core';
import moment from 'moment';
import { UnassignedUnitsService } from '@/services/unassigned-units';
import { UnassignedCategory, UnassignedRoomTypeGroup } from '@/services/unassigned-units/types';
import { groupIntoCategories } from '@/services/unassigned-units/utils';
import calendar_data from '@/stores/calendar-data';
import locales from '@/stores/locales.store';
import { getUnassignedUnitsDateKeys, getUnassignedUnitsForDate, removeUnassignedRoom, replaceUnassignedUnitsRange } from '@/stores/unassigned-units.store';
import { formatDate } from '@/utils/utils';

interface CategoriesCache {
  source: UnassignedRoomTypeGroup[];
  property: unknown;
  value: UnassignedCategory[];
}

/** `igloo-calendar`'s `calendar` option scrolls to the day *after* the epoch it receives, so hand it the previous local midnight. */
function calendarScrollTarget(isoDate: string): number {
  return moment(isoDate, 'YYYY-MM-DD').subtract(1, 'day').valueOf();
}

@Component({
  tag: 'igl-to-be-assigned',
  styleUrl: 'igl-to-be-assigned.css',
  scoped: true,
})
export class IglToBeAssigned {
  @Prop() propertyid: number;
  @Prop() calendarData: { [key: string]: any };

  @State() selectedDate: string | null = null;
  @State() isLoading = true;

  @Event() optionEvent: EventEmitter<{ key: string; data?: unknown }>;
  @Event() showBookingPopup: EventEmitter<{ key: 'calendar'; data: number; noScroll: boolean }>;
  @Event({ bubbles: true, composed: true }) addToBeAssignedEvent: EventEmitter<{ key: 'tobeAssignedEvents'; data: [] }>;
  @Event({ bubbles: true, composed: true }) highlightToBeAssignedBookingEvent: EventEmitter<{ key: 'highlightBookingId'; data: { bookingId: string } }>;

  private readonly unassignedUnitsService = new UnassignedUnitsService();
  private categoriesCache: CategoriesCache | null = null;
  private refreshToken = 0;

  componentWillLoad() {
    this.selectedDate = getUnassignedUnitsDateKeys()[0] ?? null;
    this.verifySelectedDate();
  }

  @Listen('gotoToBeAssignedDate', { target: 'window' })
  handleGotoDate(event: CustomEvent<{ data: number }>) {
    this.selectDate(moment(event.detail.data).format('YYYY-MM-DD'));
  }

  /** A card was highlighted: scroll the calendar to that booking's first night. */
  @Listen('highlightToBeAssignedBookingEvent')
  handleBookingHighlight(event: CustomEvent<{ data?: { fromDate?: string } }>) {
    const fromDate = event.detail?.data?.fromDate;
    if (fromDate) {
      this.showBookingPopup.emit({ key: 'calendar', data: calendarScrollTarget(fromDate), noScroll: false });
    }
  }

  /** Re-reads one date from the API and makes the store match it, in case a realtime update was missed. Owns the panel's loader, so every caller shows one. */
  private async refreshDate(date: string) {
    const token = ++this.refreshToken;
    this.isLoading = true;
    try {
      const entries = await this.unassignedUnitsService.getAggregatedUnAssignedRoomsByDateRange({
        propertyid: this.propertyid,
        from_date: date,
        to_date: date,
      });
      // A newer refresh started while this one was in flight — let it own the store and the loader.
      if (token !== this.refreshToken) {
        return;
      }
      replaceUnassignedUnitsRange(date, date, entries);
    } catch (error) {
      console.error('Unassigned units refresh failed:', error);
    } finally {
      if (token === this.refreshToken) {
        this.isLoading = false;
      }
    }
  }

  /** One single-day refresh on open; every later date switch reads the store only. */
  private async verifySelectedDate() {
    const date = this.selectedDate;
    if (!date) {
      this.isLoading = false;
      return;
    }
    await this.refreshDate(date);
    const dates = getUnassignedUnitsDateKeys();
    this.selectDate(dates.includes(date) ? date : (dates[0] ?? null));
  }

  private selectDate(date: string | null) {
    this.selectedDate = date;
    this.addToBeAssignedEvent.emit({ key: 'tobeAssignedEvents', data: [] });
    if (date) {
      this.showBookingPopup.emit({ key: 'calendar', data: calendarScrollTarget(date), noScroll: false });
    }
  }

  /** Memoized on the store entry's identity (and the property's, since names come from it): unrelated re-renders skip the grouping. */
  private categoriesFor(date: string): UnassignedCategory[] {
    const source = getUnassignedUnitsForDate(date);
    const { property } = calendar_data;
    const cache = this.categoriesCache;
    if (cache && cache.source === source && cache.property === property) {
      return cache.value;
    }
    const value = groupIntoCategories(source);
    this.categoriesCache = { source, property, value };
    return value;
  }

  private handleDateChange = (event: Event) => {
    this.selectDate((event.target as HTMLSelectElement).value || null);
  };

  /**
   * Fired by `igl-tba-category-view` only after `assignUnit` succeeded. The room is dropped right away so the
   * card disappears without waiting, then the day is re-read — behind the panel's loader — so the panel matches
   * the server even if the realtime update for this assignment never arrives.
   */
  private handleAssignUnit = (event: CustomEvent<{ identifier: string }>) => {
    event.stopPropagation();
    removeUnassignedRoom(event.detail.identifier);
    if (this.selectedDate) {
      this.refreshDate(this.selectedDate);
    }
  };

  private handleClose = () => {
    this.highlightToBeAssignedBookingEvent.emit({ key: 'highlightBookingId', data: { bookingId: '----' } });
    this.addToBeAssignedEvent.emit({ key: 'tobeAssignedEvents', data: [] });
    this.optionEvent.emit({ key: 'closeSideMenu' });
  };

  private renderEmptyState(message: string, subtitle?: string) {
    return (
      <div class="tba-panel__empty">
        <ir-empty-state message={message}>
          <span slot="icon" class="tba-panel__empty-icon">
            <wa-icon name="circle-check"></wa-icon>
          </span>
          {subtitle && <span class="tba-panel__empty-subtitle">{subtitle}</span>}
        </ir-empty-state>
      </div>
    );
  }

  private renderBody(hasDates: boolean, categories: UnassignedCategory[]) {
    if (this.isLoading) {
      return (
        <div class="tba-panel__loading">
          <ir-spinner></ir-spinner>
        </div>
      );
    }
    if (!hasDates) {
      return this.renderEmptyState(locales.entries.Lcz_AllBookingsAreAssigned);
    }
    if (categories.length === 0) {
      return this.renderEmptyState(locales.entries.Lcz_AllAssignForThisDay, formatDate(this.selectedDate, 'YYYY-MM-DD'));
    }
    return categories.map((category, index) => (
      <igl-tba-category-view
        key={category.roomTypeId}
        calendarData={this.calendarData}
        selectedDate={this.selectedDate}
        category={category}
        categoryIndex={index}
        onAssignUnitEvent={this.handleAssignUnit}
      ></igl-tba-category-view>
    ));
  }

  render() {
    const dates = getUnassignedUnitsDateKeys();
    // Once its last room is assigned the selected date leaves the store; keep it listed so the
    // dropdown doesn't go blank under the user. It drops off as soon as another date is picked.
    const options = this.selectedDate && !dates.includes(this.selectedDate) ? [...dates, this.selectedDate].sort() : dates;
    const categories = this.selectedDate ? this.categoriesFor(this.selectedDate) : [];

    return (
      <Host>
        <div class="tba-panel">
          <div class="tba-panel__head">
            <header class="tba-panel__header">
              <h2 class="tba-panel__title" id="to-be-assigned-title">
                {locales.entries.Lcz_Assignments}
              </h2>
              <ir-custom-button size="m" appearance="plain" variant="neutral" onClickHandler={this.handleClose}>
                <wa-icon name="xmark" variant="solid" label="Close" aria-label="Close" role="img"></wa-icon>
              </ir-custom-button>
            </header>

            {options.length > 0 && (
              <div class="tba-panel__toolbar">
                <wa-select
                  size="s"
                  aria-label={locales.entries.Lcz_Assignments}
                  value={this.selectedDate ?? ''}
                  defaultValue={this.selectedDate ?? ''}
                  onchange={this.handleDateChange}
                >
                  {options.map(date => (
                    <wa-option key={date} value={date}>
                      {formatDate(date, 'YYYY-MM-DD')}
                    </wa-option>
                  ))}
                </wa-select>
              </div>
            )}
          </div>

          <div class="tba-panel__body">{this.renderBody(dates.length > 0, categories)}</div>
        </div>
      </Host>
    );
  }
}
