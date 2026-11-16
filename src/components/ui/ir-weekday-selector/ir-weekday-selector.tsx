import { Component, Event, EventEmitter, h, Host, Prop, State, Watch } from '@stencil/core';
import { t } from '@/services/locale/t';
export interface Weekday {
  value: number;
  label: string;
}
@Component({
  tag: 'ir-weekday-selector',
  styleUrl: 'ir-weekday-selector.css',
  scoped: true,
})
export class IrWeekdaySelector {
  /**
   * Initial list of selected weekdays (numeric values).
   */
  @Prop() weekdays: number[] = [];

  /**
   * When true, at least one weekday must stay selected:
   * the last remaining selected weekday is disabled so it can't be unchecked.
   */
  @Prop() required: boolean = false;

  /**
   * Internal state tracking currently selected weekdays.
   */
  @State() selectedWeekdays: Set<number> = new Set(this.weekdays);

  /**
   * Emits an updated list of selected weekday values when the selection changes.
   *
   * Example:
   * ```tsx
   * <ir-weekday-selector onWeekdayChange={(e) => console.log(e.detail)} />
   * ```
   */
  @Event() weekdayChange: EventEmitter<number[]>;

  /** Monday-first day values; labels come from `Lcz_WeekdayAbbreviations` so they localise. */
  private static readonly WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 0];
  private static readonly WEEKDAY_FALLBACK = 'M, T, W, Th, Fr, Sa, Su';

  private get _weekdays(): Weekday[] {
    const labels = t('Lcz_WeekdayAbbreviations', { fallback: IrWeekdaySelector.WEEKDAY_FALLBACK })
      .split(',')
      .map(s => s.trim());
    return IrWeekdaySelector.WEEKDAY_VALUES.map((value, i) => ({
      value,
      label: labels[i] ?? IrWeekdaySelector.WEEKDAY_FALLBACK.split(', ')[i],
    }));
  }
  componentWillLoad() {
    if (this.weekdays) {
      this.selectedWeekdays = new Set(this.weekdays);
    }
  }
  @Watch('weekdays')
  handleWeekdayChange(newDays: number[], oldDays: number[]) {
    if (newDays.length !== oldDays.length && newDays.length !== this.selectedWeekdays.size) {
      this.selectedWeekdays = new Set(newDays);
    }
  }
  /**
   * Toggles the selected state of a specific weekday.
   * Updates internal state and emits `weekdayChange` event.
   *
   * @param checked - Whether the checkbox is checked.
   * @param weekDay - The numeric value of the weekday.
   */
  private toggleWeekDays({ checked, weekDay }: { checked: boolean; weekDay: number }): void {
    const prev = new Set(this.selectedWeekdays);
    if (checked) {
      if (!this.selectedWeekdays.has(weekDay)) {
        prev.add(weekDay);
        this.selectedWeekdays = new Set(prev);
      }
    } else {
      prev.delete(weekDay);
      this.selectedWeekdays = new Set(prev);
    }
    this.weekdayChange.emit(Array.from(this.selectedWeekdays));
  }
  render() {
    const isLastSelected = this.required && this.selectedWeekdays.size === 1;
    return (
      <Host class="my-1 d-flex align-items-center" style={{ gap: '1.1rem' }}>
        {this._weekdays.map(w => (
          <wa-checkbox
            checked={this.selectedWeekdays.has(w.value)}
            defaultChecked={this.selectedWeekdays.has(w.value)}
            disabled={isLastSelected && this.selectedWeekdays.has(w.value)}
            onchange={e => this.toggleWeekDays({ checked: (e.target as HTMLInputElement).checked, weekDay: w.value })}
          >
            {w.label}
          </wa-checkbox>
        ))}
      </Host>
    );
  }
}
