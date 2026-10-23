import type { DashboardPerformance, DashboardUnits } from '@/services/dashboard';
import calendar_data from '@/stores/calendar-data';
import locales from '@/stores/locales.store';
import { todayISO, type ISODate } from '@/utils/calendar-dates';
import moment from 'moment';
import { formatAmount } from '@/utils/utils';
import { Component, Host, Prop, h } from '@stencil/core';
import { computeRevPar, formatCount, formatPercent } from '../dashboard.helpers';
import type { RailDensity } from '../types';

type UnitTone = 'available' | 'booked' | 'pending' | 'out-of-service' | 'blocked';

/**
 * Calendar legend entry (igl-legend) each unit's dot copies, with the default colour as fallback.
 * Available units keep the brand colour and blocked ones the danger red.
 */
const UNIT_LEGEND: Partial<Record<UnitTone, { id: string; fallback: string }>> = {
  'booked': { id: '2', fallback: '#45b16d' },
  'pending': { id: '3', fallback: '#FF9149' },
  'out-of-service': { id: '6', fallback: '#f34752' },
};

/** Where a unit's figure stands: `loaded` false shows a skeleton, `refreshing` dims the figure. */
type FigureState = { loaded: boolean; refreshing: boolean };

/**
 * Left-hand stats rail: an occupancy card (the day's occupancy, units booked and the unit breakdown) followed by a
 * performance card with the day's room-revenue KPIs. The first card takes the rail's spare height.
 * The figures come from three requests (monthly stats, calendar, pending bookings), so each figure shows its own
 * skeleton until it arrives.
 *
 * Properties without front desk (`isPms` false) see only Booked and Pending — no occupancy, no bar, no calendar
 * figures (the dashboard skips the calendar request for them) — and no RevPAR.
 */
@Component({
  tag: 'ir-dashboard-stats',
  styleUrl: 'ir-dashboard-stats.css',
  scoped: true,
})
export class IrDashboardStats {
  /** Selected day (`YYYY-MM-DD`); titles the occupancy card. */
  @Prop() date: ISODate;
  /** Whether the property uses the front desk (PMS); without it the rail shows the reduced set of figures. */
  @Prop() isPms: boolean = true;
  /** Occupancy and revenue figures; `null` shows their skeletons. */
  @Prop() performance: DashboardPerformance;
  /** Calendar unit breakdown; `null` shows its skeleton. */
  @Prop() units: DashboardUnits;
  /** Units in pending bookings; `null` shows its skeleton. */
  @Prop() pendingUnits: number;
  @Prop() currencySymbol: string;
  /** Dims the occupancy, booked-units and revenue figures while a newer day's are in flight. */
  @Prop() performanceLoading: boolean = false;
  /** Dims the calendar unit figures while a newer day's are in flight. */
  @Prop() unitsLoading: boolean = false;
  /** Dims the pending-units figure while a newer day's is in flight. */
  @Prop() pendingLoading: boolean = false;
  /** How tightly the cards are drawn; ir-dashboard steps it down when the desktop rail is short. */
  @Prop({ reflect: true }) density: RailDensity = 'regular';

  /** The property's colour for a unit's legend entry, so the dot matches the calendar. */
  private legendColor(tone: UnitTone): string | undefined {
    const legend = UNIT_LEGEND[tone];
    if (!legend) {
      return undefined;
    }
    return calendar_data.property?.calendar_legends?.find(l => l.id?.toString() === legend.id)?.color ?? legend.fallback;
  }

  /** Units the property has: the calendar's total, else the physical rooms of its room types. */
  private get totalUnits(): number | undefined {
    if (this.units?.total != null) {
      return this.units.total;
    }
    const roomTypes = calendar_data.property?.roomtypes;
    return roomTypes?.length ? roomTypes.reduce((total, rt) => total + (rt.physicalrooms?.length ?? 0), 0) : undefined;
  }

  /** "Today's occupancy" on today, otherwise the day itself ("Saturday, 17 Oct."); the card title is capitalized in CSS. */
  private get title(): string {
    if (!this.date || this.date === todayISO()) {
      return "Today's occupancy";
    }
    return `${moment(this.date, 'YYYY-MM-DD').format('dddd, D MMM')}.`;
  }

  private renderUnit(value: number | undefined, label: string, tone: UnitTone, { loaded, refreshing }: FigureState) {
    if (!loaded) {
      return (
        <li class="stats__unit" aria-hidden="true">
          <wa-skeleton effect="pulse" class="stats__skeleton stats__skeleton--unit"></wa-skeleton>
        </li>
      );
    }
    const color = this.legendColor(tone);
    return (
      <li class={{ 'stats__unit': true, 'stats--loading': refreshing }}>
        <span class={`stats__dot stats__dot--${tone}`} style={color ? { '--stats-dot-color': color } : undefined} aria-hidden="true"></span>
        {/* Every unit stays visible; a count with nothing behind it reads as 0. */}
        <span class="stats__unit-value">{formatCount(value ?? 0)}</span>
        <span class="stats__unit-label">{label}</span>
      </li>
    );
  }

  /** Occupancy figure, units booked and the bar (PMS only). */
  private renderOccupancy() {
    const performance = this.performance;
    if (!performance) {
      return (
        <div class="stats__occupancy" aria-hidden="true">
          <wa-skeleton effect="pulse" class="stats__skeleton stats__skeleton--occupancy"></wa-skeleton>
          <wa-skeleton effect="pulse" class="stats__skeleton stats__skeleton--booked"></wa-skeleton>
          <wa-skeleton effect="pulse" class="stats__skeleton stats__skeleton--bar"></wa-skeleton>
        </div>
      );
    }
    const occupancy = Math.min(Math.max(performance.occupancy, 0), 100);
    // Rounding must never claim a full house: 99.96% reads 99.9%, not 100%.
    const shownOccupancy = occupancy < 100 ? Math.min(occupancy, 99.9) : 100;
    const total = this.totalUnits;
    return (
      <div class={{ 'stats__occupancy': true, 'stats--loading': this.performanceLoading }}>
        <div class="stats__occupancy-figure">
          <span class="stats__icon stats__icon--round" aria-hidden="true">
            <wa-icon name="bed"></wa-icon>
          </span>
          <span class="stats__occupancy-value">{formatPercent(shownOccupancy, { maximumFractionDigits: 1 })}</span>
        </div>
        {total !== undefined && <p class="stats__booked">{`${formatCount(performance.bookedUnits ?? 0)} of ${formatCount(total)} units booked`}</p>}
        <wa-progress-bar class="stats__bar" value={occupancy} label={locales.entries?.Lcz_Occupancy ?? 'Occupancy'}></wa-progress-bar>
      </div>
    );
  }

  private renderUnits() {
    const { units, performance, pendingUnits } = this;
    const calendar: FigureState = { loaded: !!units, refreshing: this.unitsLoading };
    const stats: FigureState = { loaded: !!performance, refreshing: this.performanceLoading };
    const pending: FigureState = { loaded: pendingUnits != null, refreshing: this.pendingLoading };
    return (
      <ul class={{ 'stats__units': true, 'stats__units--stacked': !this.isPms }} aria-label="Units" aria-busy={(this.isPms && !units) || !performance ? 'true' : null}>
        {this.isPms && this.renderUnit(units?.available, 'Available', 'available', calendar)}
        {this.renderUnit(performance?.bookedUnits, 'Booked', 'booked', stats)}
        {this.renderUnit(pendingUnits, 'Pending', 'pending', pending)}
        {this.isPms && this.renderUnit(units?.outOfService, 'OOS', 'out-of-service', calendar)}
        {this.isPms && this.renderUnit(units?.blocked, 'Blocked', 'blocked', calendar)}
      </ul>
    );
  }

  /** One revenue figure: icon tile, amount, label. An `undefined` value shows a skeleton in place of the amount. */
  private renderKpi(icon: string, label: string, value: number | undefined) {
    const amount = value === undefined ? '' : formatAmount(this.currencySymbol, value);
    return (
      <li class="stats__kpi">
        <span class="stats__icon" aria-hidden="true">
          <wa-icon name={icon}></wa-icon>
        </span>
        <span class="stats__kpi-text">
          {value === undefined ? (
            <wa-skeleton effect="pulse" class="stats__skeleton stats__skeleton--kpi" aria-hidden="true"></wa-skeleton>
          ) : (
            // The CSS sizes the font from the amount's length so it always shows in full, never truncated.
            <span class="stats__kpi-value" style={{ '--kpi-chars': String(amount.length) }}>
              {amount}
            </span>
          )}
          <span class="stats__kpi-label">{label}</span>
        </span>
      </li>
    );
  }

  private renderPerformance() {
    const performance = this.performance;
    return (
      <wa-card class="stats__card stats__card--performance" appearance="plain">
        <h2 class="stats__title">Performance</h2>
        <ul class={{ 'stats__kpis': true, 'stats--loading': !!performance && this.performanceLoading }} aria-label="Revenue" aria-busy={!performance ? 'true' : null}>
          {this.renderKpi('coins', 'Room Revenue', performance?.roomRevenue)}
          {this.renderKpi('chart-simple', 'ADR', performance?.adr)}
          {this.isPms && this.renderKpi('arrow-trend-up', 'RevPAR', performance ? computeRevPar(performance.adr, performance.occupancy) : undefined)}
        </ul>
      </wa-card>
    );
  }

  render() {
    return (
      <Host>
        <wa-card class="stats__card stats__card--occupancy" appearance="plain">
          <h2 class="stats__title">{this.title}</h2>
          {this.isPms && this.renderOccupancy()}
          {this.renderUnits()}
        </wa-card>
        {this.renderPerformance()}
      </Host>
    );
  }
}
