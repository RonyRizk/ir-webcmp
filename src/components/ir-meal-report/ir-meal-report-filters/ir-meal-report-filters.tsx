import { Component, h, Prop, Event, EventEmitter } from '@stencil/core';
import { IEntries } from '@/models/IBooking';
import moment from 'moment';

@Component({
  tag: 'ir-meal-report-filters',
  styleUrl: 'ir-meal-report-filters.css',
  scoped: true,
})
export class IrMealReportFilters {
  @Prop() reportType: 'GUEST_LIST' | 'MEAL_COUNT' = 'GUEST_LIST';
  @Prop() fromDate: string;
  @Prop() toDate: string;
  @Prop() mealType: string | null = null;
  @Prop() setupEntries: { meal_type: IEntries[]; hb_preference: IEntries[] };
  @Prop() isLoading: boolean = false;
  @Prop() lcz: any = {};

  @Event() reportTypeChange: EventEmitter<'GUEST_LIST' | 'MEAL_COUNT'>;
  @Event() dateChange: EventEmitter<{ from: string; to: string }>;
  @Event() mealTypeChange: EventEmitter<string>;
  @Event() filterApply: EventEmitter<void>;
  @Event() filterReset: EventEmitter<void>;
  @Event() presetDate: EventEmitter<'today' | 'tomorrow'>;

  render() {
    const mealTypes = this.setupEntries?.meal_type || [];
    const todayDate = moment().format('YYYY-MM-DD');
    const tomorrowDate = moment().add(1, 'day').format('YYYY-MM-DD');
    // Reflect which preset (Today/Tomorrow) is currently active based on the selected fromDate.
    const selectedPreset = this.fromDate === todayDate ? 'today' : this.fromDate === tomorrowDate ? 'tomorrow' : '';

    return (
      <ir-filter-card>
        <wa-radio-group
          label="Report type"
          size="s"
          orientation="horizontal"
          value={this.reportType}
          onchange={e => {
            this.reportTypeChange.emit((e.target as any).value);
          }}
        >
          <wa-radio style={{ flex: '1' }} appearance="button" value="GUEST_LIST">
            Guest list
          </wa-radio>
          <wa-radio style={{ flex: '1' }} appearance="button" value="MEAL_COUNT">
            Meal count
          </wa-radio>
        </wa-radio-group>
        {this.reportType === 'GUEST_LIST' ? (
          <wa-radio-group
            label="Stay date"
            size="s"
            orientation="horizontal"
            value={selectedPreset}
            onchange={e => {
              this.presetDate.emit((e.target as any).value);
            }}
          >
            <wa-radio style={{ flex: '1' }} appearance="button" value="today">
              Today
            </wa-radio>
            <wa-radio style={{ flex: '1' }} appearance="button" value="tomorrow">
              Tomorrow
            </wa-radio>
          </wa-radio-group>
        ) : (
          <div>
            <ir-date-range-filter
              label="Stay date"
              fromDate={this.fromDate}
              showQuickActions={false}
              toDate={this.toDate}
              minDate={moment().format('YYYY-MM-DD')}
              maxDate={moment().add(14, 'days').format('YYYY-MM-DD')}
              onDatesChanged={e => {
                const { from, to } = e.detail;
                this.dateChange.emit({
                  from,
                  to,
                });
              }}
              withClear={false}
              selectionMode="auto"
            ></ir-date-range-filter>
          </div>
        )}

        {this.reportType === 'GUEST_LIST' &&
          (mealTypes.length > 0 ? (
            <wa-radio-group
              defaultValue={this.mealType}
              label="Meal type"
              size="s"
              orientation="horizontal"
              value={this.mealType}
              style={{ width: '100%' }}
              onchange={e => {
                this.mealTypeChange.emit((e.target as any).value);
              }}
            >
              {mealTypes.map(type => (
                <wa-radio style={{ flex: '1' }} appearance="button" value={type.CODE_NAME}>
                  {type.CODE_VALUE_EN}
                </wa-radio>
              ))}
            </wa-radio-group>
          ) : (
            <div class="ir-meal-report-filters__warning">No meal types found.</div>
          ))}
        <div slot="footer">
          <ir-custom-button
            type="button"
            size="s"
            variant="neutral"
            appearance="filled"
            onClickHandler={(e: CustomEvent) => {
              const ev = e.detail as MouseEvent;
              if (ev && typeof ev.preventDefault === 'function') {
                ev.preventDefault();
                ev.stopPropagation();
              }
              this.filterReset.emit();
            }}
          >
            {this.lcz.Lcz_Reset || 'Reset'}
          </ir-custom-button>
          <ir-custom-button
            type="button"
            size="s"
            variant="brand"
            loading={this.isLoading}
            onClickHandler={(e: CustomEvent) => {
              const ev = e.detail as MouseEvent;
              if (ev && typeof ev.preventDefault === 'function') {
                ev.preventDefault();
                ev.stopPropagation();
              }
              this.filterApply.emit();
            }}
          >
            {this.lcz.Lcz_Apply || 'Apply'}
          </ir-custom-button>
        </div>
      </ir-filter-card>
    );
  }
}
