import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { isWeekend } from '@/utils/utils';
import { DayInfo, MonthInfo } from '../types';

/** Entrance stagger: 30ms per cell of distance from today, capped so the far tail lands within ~450ms. */
const REVEAL_STEP_MS = 30;
const REVEAL_MAX_STEPS = 15;
const REVEAL_DURATION_MS = 220;
/** The count-up starts once the pill has mostly landed and ticks 0 → N. */
const REVEAL_COUNT_DELAY_MS = 120;
const REVEAL_COUNT_DURATION_MS = 320;
/** How long the reveal gate stays open once the badges are settled: longest delay + pill + count-up + slack. */
const REVEAL_TOTAL_MS = REVEAL_STEP_MS * REVEAL_MAX_STEPS + Math.max(REVEAL_DURATION_MS, REVEAL_COUNT_DELAY_MS + REVEAL_COUNT_DURATION_MS) + 130;

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
  /** Days (keyed by `dayInfo.day`) whose unassigned-units fetch is still in flight; their badges breathe. */
  @Prop() loadingDays: { [key: string]: boolean } = {};

  /**
   * Gates the badge entrance cascade so it plays once per screen open. Stays open from mount until
   * `REVEAL_TOTAL_MS` after the initial unassigned-units fetch settles — the calendar snapshot often
   * has no counts, so most badges only mount when that fetch lands, well after the first paint.
   */
  @State() private revealing = true;

  /** Emitted only when a badge with a non-zero count is clicked — a zero-count badge is inert. */
  @Event() dayBadgeClicked: EventEmitter<{ day: string; currentDate: any }>;

  private revealTimer: ReturnType<typeof setTimeout>;

  componentDidLoad() {
    // A fetch may already be in flight on the first render; then the idle transition starts the countdown.
    if (!this.hasLoadingDays(this.loadingDays)) {
      this.scheduleRevealEnd();
    }
  }

  disconnectedCallback() {
    clearTimeout(this.revealTimer);
  }

  /**
   * A fetch in flight keeps the gate open; the countdown restarts when it goes idle. The parent
   * builds a fresh map every render, so only busy/idle transitions count — not reference changes.
   */
  @Watch('loadingDays')
  handleLoadingDaysChange(loadingDays: { [key: string]: boolean }, previous: { [key: string]: boolean } = {}) {
    const busy = this.hasLoadingDays(loadingDays);
    const wasBusy = this.hasLoadingDays(previous);
    if (!this.revealing || busy === wasBusy) {
      return;
    }
    if (busy) {
      clearTimeout(this.revealTimer);
      this.revealTimer = undefined;
    } else {
      this.scheduleRevealEnd();
    }
  }

  private hasLoadingDays(loadingDays: { [key: string]: boolean }): boolean {
    return Object.keys(loadingDays).length > 0;
  }

  private scheduleRevealEnd() {
    clearTimeout(this.revealTimer);
    this.revealTimer = setTimeout(() => {
      this.revealing = false;
    }, REVEAL_TOTAL_MS);
  }

  private handleBadgeClick(dayInfo: DayInfo) {
    if (this.unassignedRoomsNumber[dayInfo.day] || 0) {
      this.dayBadgeClicked.emit({ day: dayInfo.day, currentDate: dayInfo.currentDate });
    }
  }

  /** Stagger radiates outward from today's cell, where the user is looking after the initial scroll. */
  private getRevealDelay(index: number, todayIndex: number): number {
    return Math.min(Math.abs(index - todayIndex), REVEAL_MAX_STEPS) * REVEAL_STEP_MS;
  }

  render() {
    const todayIndex = Math.max(
      this.days.findIndex(dayInfo => dayInfo.day === this.today),
      0,
    );
    return (
      <Host>
        <div class={{ 'stickyCell': true, 'headersContainer': true, 'is-revealing': this.revealing }}>
          <div class="monthsContainer">
            {this.monthsInfo.map(monthInfo => (
              <div class="monthCell" style={{ width: monthInfo.daysCount * 58 + 'px' }}>
                <div class="monthTitle">{monthInfo.monthName}</div>
              </div>
            ))}
          </div>
          {this.days.map((dayInfo, index) => {
            const count = this.unassignedRoomsNumber[dayInfo.day] || dayInfo.unassigned_units_nbr;
            const revealDelay = this.getRevealDelay(index, todayIndex);
            return (
              <div
                class={`headerCell align-items-center ${'day-' + dayInfo.day} ${dayInfo.day === this.today || dayInfo.day === this.highlightedDate ? 'currentDay' : ''}`}
                data-day={dayInfo.day}
              >
                {!this.isVacationRental && (
                  <div class={{ 'preventPageScroll': true, 'is-loading': !!this.loadingDays[dayInfo.day] }} onClick={() => this.handleBadgeClick(dayInfo)}>
                    {this.unassignedRoomsNumber[dayInfo.day] || dayInfo.unassigned_units_nbr !== 0 ? (
                      <button class={'fd-header__badge-btn'} style={this.revealing ? { animationDelay: `${revealDelay}ms` } : undefined}>
                        <wa-badge class="fd-header__badge" variant={'brand'} appearance={'accent'} pill>
                          {this.revealing ? (
                            /* Digits are drawn by CSS (`counter()` over the animated `--fd-count`) until the gate closes. */
                            <span
                              class="fd-header__badge-count"
                              style={{ '--fd-count-target': String(count), 'animationDelay': `${revealDelay + REVEAL_COUNT_DELAY_MS}ms` }}
                            ></span>
                          ) : (
                            count
                          )}
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
