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

    return (
      <div 
          class="ir-meal-report-filters__container"
          onKeyDown={(e) => {
              if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
              }
          }}
      >
        <div class="ir-meal-report-filters__header">
          <div class="ir-meal-report-filters__header-content">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" height={18} width={18}>
              <path
                fill="currentColor"
                d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z"
              />
            </svg>
            <h4 class="ir-meal-report-filters__title">{this.lcz.Lcz_Filters || 'Filters'}</h4>
          </div>
        </div>

        <div class="ir-meal-report-filters__body">
          <fieldset class="ir-meal-report-filters__group">
            <label class="ir-meal-report-filters__label">Report type</label>
            <wa-radio-group 
              value={this.reportType}
              onchange={e => {
                  this.reportTypeChange.emit((e.target as any).value);
              }}
            >
              <wa-radio value="GUEST_LIST">Guest list</wa-radio>
              <wa-radio value="MEAL_COUNT">Meal count</wa-radio>
            </wa-radio-group>
          </fieldset>

          <fieldset class="ir-meal-report-filters__group">
            <label class="ir-meal-report-filters__label">Stay date</label>
            
            {this.reportType === 'GUEST_LIST' ? (
              <div class="ir-meal-report-filters__date-presets">
                <ir-custom-button 
                  type="button"
                  size="small" 
                  variant={this.fromDate === moment().format('YYYY-MM-DD') ? 'brand' : 'neutral'}
                  appearance={this.fromDate === moment().format('YYYY-MM-DD') ? 'filled' : 'outlined'}
                  onClickHandler={(e: CustomEvent) => {
                    const ev = e.detail as MouseEvent;
                    if (ev && typeof ev.preventDefault === 'function') {
                        ev.preventDefault();
                        ev.stopPropagation();
                    }
                    this.presetDate.emit('today')
                  }}
                  class="ir-meal-report-filters__preset-btn"
                >Today</ir-custom-button>
                <ir-custom-button 
                  type="button"
                  size="small" 
                  variant={this.fromDate === moment().add(1, 'day').format('YYYY-MM-DD') ? 'brand' : 'neutral'}
                  appearance={this.fromDate === moment().add(1, 'day').format('YYYY-MM-DD') ? 'filled' : 'outlined'}
                  onClickHandler={(e: CustomEvent) => {
                    const ev = e.detail as MouseEvent;
                    if (ev && typeof ev.preventDefault === 'function') {
                        ev.preventDefault();
                        ev.stopPropagation();
                    }
                    this.presetDate.emit('tomorrow')
                  }}
                  class="ir-meal-report-filters__preset-btn"
                >Tomorrow</ir-custom-button>
              </div>
            ) : (
              <div class="ir-meal-report-filters__range-picker-wrapper">
                <ir-range-picker
                  fromDate={moment(this.fromDate, 'YYYY-MM-DD')}
                  toDate={moment(this.toDate, 'YYYY-MM-DD')}
                  minDate={moment().format('YYYY-MM-DD')}
                  maxDate={moment().add(14, 'days').format('YYYY-MM-DD')}
                  onDateRangeChanged={e => {
                      const { fromDate, toDate } = e.detail;
                      this.dateChange.emit({
                          from: fromDate.format('YYYY-MM-DD'),
                          to: toDate.format('YYYY-MM-DD')
                      });
                  }}
                  withOverlay={false}
                ></ir-range-picker>
              </div>
            )}
          </fieldset>

          {this.reportType === 'GUEST_LIST' && (
            <fieldset class="ir-meal-report-filters__group">
              <label class="ir-meal-report-filters__label">Meal type</label>
              {mealTypes.length > 0 ? (
                  <div class="ir-meal-report-filters__meal-types">
                     {mealTypes.map(type => (
                       <ir-custom-button
                         type="button"
                         size="small"
                         variant={this.mealType === type.CODE_NAME ? 'brand' : 'neutral'}
                         appearance={this.mealType === type.CODE_NAME ? 'filled' : 'outlined'}
                         onClickHandler={async (e: CustomEvent) => {
                           const ev = e.detail as MouseEvent;
                           if (ev && typeof ev.preventDefault === 'function') {
                               ev.preventDefault();
                               ev.stopPropagation();
                           }
                           this.mealTypeChange.emit(type.CODE_NAME);
                         }}
                         class="ir-meal-report-filters__meal-btn"
                       >{type.CODE_VALUE_EN}</ir-custom-button>
                     ))}
                  </div>
              ) : (
                  <div class="ir-meal-report-filters__warning">
                      No meal types found.
                  </div>
              )}
            </fieldset>
          )}

          <div class="ir-meal-report-filters__footer">
              <ir-custom-button
                  type="button"
                  size="small"
                  variant="neutral"
                  appearance="filled"
                  onClickHandler={(e: CustomEvent) => {
                      const ev = e.detail as MouseEvent;
                      if (ev && typeof ev.preventDefault === 'function') {
                          ev.preventDefault();
                          ev.stopPropagation();
                      }
                      this.filterReset.emit()
                  }}
                  class="ir-meal-report-filters__reset-btn"
              >{this.lcz.Lcz_Reset || 'Reset'}</ir-custom-button>
              <ir-custom-button
                  type="button"
                  size="small"
                  variant="brand"
                  loading={this.isLoading}
                  onClickHandler={(e: CustomEvent) => {
                      const ev = e.detail as MouseEvent;
                      if (ev && typeof ev.preventDefault === 'function') {
                          ev.preventDefault();
                          ev.stopPropagation();
                      }
                      this.filterApply.emit()
                  }}
              >{this.lcz.Lcz_Apply || 'Apply'}</ir-custom-button>
          </div>
        </div>
      </div>
    );
  }
}
