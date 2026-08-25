import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { isWeekend } from '@/utils/utils';
import { DayInfo, MonthInfo } from '../types';

/**
 * The `.headersContainer` sticky bar of `igl-cal-header`: the month row plus the per-day header
 * cells (unassigned-units badge, day title, occupancy percent). `.headersContainer`/`.headerCell`
 * and each cell's `data-day` attribute are read directly by `igloo-calendar.tsx`'s drag-bounds
 * calculation (`document.querySelectorAll('.headersContainer .headerCell')`) — do not rename them.
 */
@Component({
  tag: 'igl-cal-header-days',
  styleUrl: 'igl-cal-header-days.css',
  scoped: true,
})
export class IglCalHeaderDays {
  @Prop() isVacationRental: boolean;
  @Prop() today: String;
  @Prop() highlightedDate: string;
  @Prop() monthsInfo: MonthInfo[] = [];
  @Prop() days: DayInfo[] = [];
  /** Unassigned-unit counts keyed by `dayInfo.day`, falling back to `dayInfo.unassigned_units_nbr` per cell. */
  @Prop() unassignedRoomsNumber: { [key: string]: number } = {};

  /** Emitted only when a badge with a non-zero count is clicked — a zero-count badge is inert. */
  @Event() dayBadgeClicked: EventEmitter<{ day: string; currentDate: any }>;

  private handleBadgeClick(dayInfo: DayInfo) {
    if (this.unassignedRoomsNumber[dayInfo.day] || 0) {
      this.dayBadgeClicked.emit({ day: dayInfo.day, currentDate: dayInfo.currentDate });
    }
  }

  render() {
    return (
      <Host>
        <div class="stickyCell headersContainer">
          <div class="monthsContainer">
            {this.monthsInfo.map(monthInfo => (
              <div class="monthCell" style={{ width: monthInfo.daysCount * 58 + 'px' }}>
                <div class="monthTitle">{monthInfo.monthName}</div>
              </div>
            ))}
          </div>
          {this.days.map(dayInfo => {
            return (
              <div
                class={`headerCell align-items-center ${'day-' + dayInfo.day} ${dayInfo.day === this.today || dayInfo.day === this.highlightedDate ? 'currentDay' : ''}`}
                data-day={dayInfo.day}
              >
                {!this.isVacationRental && (
                  <div class="preventPageScroll" onClick={() => this.handleBadgeClick(dayInfo)}>
                    {this.unassignedRoomsNumber[dayInfo.day] || dayInfo.unassigned_units_nbr !== 0 ? (
                      <button class={'fd-header__badge-btn'}>
                        <wa-badge class="fd-header__badge" variant={'brand'} appearance={'accent'} pill>
                          {this.unassignedRoomsNumber[dayInfo.day] || dayInfo.unassigned_units_nbr}
                        </wa-badge>
                      </button>
                    ) : (
                      <wa-badge variant={'neutral'} appearance={'filled'} pill>
                        {' '}
                        {this.unassignedRoomsNumber[dayInfo.day] || dayInfo.unassigned_units_nbr}
                      </wa-badge>
                    )}
                  </div>
                )}

                <div class={{ dayTitle: true, weekend: isWeekend(dayInfo.value) }}>{dayInfo.dayDisplayName}</div>
                <div class="dayCapacityPercent">{dayInfo.occupancy}%</div>
              </div>
            );
          })}
        </div>
      </Host>
    );
  }
}
