import { Component, Event, EventEmitter, h, Prop, State } from '@stencil/core';
import { TaskFilters } from '../types';
import housekeeping_store from '@/stores/housekeeping.store';
import locales from '@/stores/locales.store';
import calendar_data from '@/stores/calendar-data';
export type ModifiedTaskFilters = Omit<TaskFilters, 'housekeepers'> & { housekeepers: string };
@Component({
  tag: 'ir-tasks-filters',
  styleUrl: 'ir-tasks-filters.css',
  scoped: true,
})
export class IrTasksFilters {
  @Prop() isLoading: boolean;

  @State() filters: ModifiedTaskFilters = {
    cleaning_periods: {
      code: '',
    },
    housekeepers: '000',
    cleaning_frequencies: { code: '' },
    dusty_units: { code: '' },
    highlight_check_ins: { code: '' },
  };

  @State() collapsed: boolean = false;

  @Event() applyFilters: EventEmitter<TaskFilters>;

  private baseFilters: TaskFilters;

  componentWillLoad() {
    this.baseFilters = {
      cleaning_periods: housekeeping_store?.hk_criteria?.cleaning_periods[0],
      housekeepers: [],
      cleaning_frequencies: calendar_data.cleaning_frequency ?? housekeeping_store?.hk_criteria?.cleaning_frequencies[0],
      dusty_units: housekeeping_store?.hk_criteria?.dusty_periods[0],
      highlight_check_ins: housekeeping_store?.hk_criteria?.highlight_checkin_options[0],
    };
    this.filters = { ...this.baseFilters, housekeepers: '000' };
  }

  private updateFilter(params: Partial<ModifiedTaskFilters>) {
    this.filters = { ...this.filters, ...params };
  }
  private applyFiltersEvt(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.applyFilters.emit({
      ...this.filters,
      housekeepers: this.filters.housekeepers === '000' ? this.baseFilters.housekeepers : [{ id: Number(this.filters.housekeepers) }],
    });
  }
  private resetFilters(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.filters = { ...this.baseFilters, housekeepers: '000' };
    this.applyFilters.emit({
      ...this.filters,
      housekeepers: this.filters.housekeepers === '000' ? this.baseFilters.housekeepers : [{ id: Number(this.filters.housekeepers) }],
    });
  }
  render() {
    return (
      <wa-card class={`filters__card ${this.collapsed ? '--collapsed' : ''}`}>
        <div class="filters__header" slot="header">
          <div class="filters__title-group">
            <wa-icon name="filter" style={{ fontSize: '1rem' }}></wa-icon>
            <h4 class="filters__title">{locales.entries.Lcz_Filters}</h4>
          </div>
          <ir-custom-button
            appearance="plain"
            class="filters__collapse-btn"
            variant="neutral"
            id="drawer-icon"
            aria-expanded={this.collapsed ? 'true' : 'false'}
            aria-controls="hkTasksFiltersCollapse"
            onClickHandler={() => (this.collapsed = !this.collapsed)}
          >
            <wa-icon style={{ fontSize: '1rem' }} name={!this.collapsed ? 'eye-slash' : 'eye'}></wa-icon>
          </ir-custom-button>
        </div>
        <div class={`filters__body${this.collapsed ? ' filters__body--collapsed' : ''}`} id="hkTasksFiltersCollapse">
          <fieldset>
            <wa-select
              label={locales.entries.Lcz_Period}
              size="small"
              data-testid="period"
              value={this.filters?.cleaning_periods?.code}
              defaultValue={this.filters?.cleaning_periods?.code}
              onchange={e => this.updateFilter({ cleaning_periods: { code: (e.target as HTMLSelectElement).value } })}
            >
              {housekeeping_store?.hk_criteria?.cleaning_periods.map(v => (
                <wa-option key={v.code} value={v.code}>
                  {v.description}
                </wa-option>
              ))}
            </wa-select>
          </fieldset>
          {housekeeping_store?.hk_criteria?.housekeepers.length > 1 && (
            <fieldset>
              <wa-select
                label={locales.entries.Lcz_Housekeepers}
                size="small"
                data-testid="housekeepers"
                value={this.filters?.housekeepers}
                defaultValue={this.filters?.housekeepers}
                onchange={e => this.updateFilter({ housekeepers: (e.target as HTMLSelectElement).value })}
              >
                <wa-option value="000">{locales.entries.Lcz_Allhousekeepers}</wa-option>
                {housekeeping_store?.hk_criteria?.housekeepers
                  .slice()
                  .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                  .map(v => (
                    <wa-option key={v.id} value={v.id.toString()}>
                      {v.name}
                    </wa-option>
                  ))}
              </wa-select>
            </fieldset>
          )}
          <fieldset>
            <wa-select
              label="Include dusty units"
              size="small"
              data-testid="dusty_units"
              value={this.filters?.dusty_units?.code}
              defaultValue={this.filters?.dusty_units?.code}
              onchange={e => this.updateFilter({ dusty_units: { code: (e.target as HTMLSelectElement).value } })}
            >
              {housekeeping_store.hk_criteria?.dusty_periods?.map(v => (
                <wa-option key={v.code} value={v.code}>
                  {v.description}
                </wa-option>
              ))}
            </wa-select>
          </fieldset>
          <fieldset>
            <wa-select
              label={locales.entries['Lcz_HighlightCheck-insFrom']}
              size="small"
              data-testid="highlight_check_ins"
              value={this.filters?.highlight_check_ins?.code}
              defaultValue={this.filters?.highlight_check_ins?.code}
              onchange={e => this.updateFilter({ highlight_check_ins: { code: (e.target as HTMLSelectElement).value } })}
            >
              {housekeeping_store.hk_criteria?.highlight_checkin_options?.map(v => (
                <wa-option key={v.code} value={v.code}>
                  {v.description}
                </wa-option>
              ))}
            </wa-select>
          </fieldset>
          <div class="filters__actions">
            <ir-custom-button variant="neutral" appearance="filled" data-testid="reset" onClickHandler={e => this.resetFilters(e)}>
              {locales.entries.Lcz_Reset}
            </ir-custom-button>
            <ir-custom-button variant="brand" data-testid="apply" loading={this.isLoading} onClickHandler={e => this.applyFiltersEvt(e)}>
              {locales.entries.Lcz_Apply}
            </ir-custom-button>
          </div>
        </div>
      </wa-card>
    );
  }
}
