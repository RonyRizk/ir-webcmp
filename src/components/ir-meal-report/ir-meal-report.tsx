import { Component, Host, h, Prop, State, Watch } from '@stencil/core';
import { MealReportService } from '../../services/meal-report/meal-report.service';
import { mealReportStore, setMealReportData, setMealReportFilters, setMealReportLoading, setMealReportSetupEntries, clearMealReportData } from '../../stores/meal-report.store';
import Token from '../../models/Token';
import moment from 'moment';
import locales from '@/stores/locales.store';

@Component({
  tag: 'ir-meal-report',
  styleUrl: 'ir-meal-report.css',
  scoped: true,
})
export class IrMealReport {
  @Prop() ticket: string;
  @Prop() propertyid: number;
  @Prop() language: string = 'en';

  @State() isPageLoading: boolean = true;
  @State() isExporting: boolean = false;
  
  @State() localReportType: 'GUEST_LIST' | 'MEAL_COUNT' = 'GUEST_LIST';
  @State() localFrom: string = moment().format('YYYY-MM-DD');
  @State() localTo: string = moment().format('YYYY-MM-DD');
  @State() localMealType: string | null = null;

  private mealReportService = new MealReportService();
  private tokenService = new Token();

  async componentWillLoad() {
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
    }
    await this.init();
  }

  @Watch('propertyid')
  async handlePropertyChange() {
    await this.init();
  }

  async init() {
    try {
      this.isPageLoading = true;
      setMealReportLoading(true);

      const setupEntries = await this.mealReportService.getSetupEntriesByTableNameMulti(['_MEAL_TYPE', '_HB_PREFERENCE'] as any);
      console.log('Meal Report Setup Entries Raw:', setupEntries);
      
      const grouped = this.mealReportService.groupEntryTablesResult(setupEntries);
      console.log('Meal Report Setup Entries Grouped:', grouped);
      
      const meal_type = (grouped as any).meal_type || [];
      const hb_preference = (grouped as any).hb_preference || [];

      setMealReportSetupEntries({
        meal_type,
        hb_preference,
      });

      if (meal_type.length > 0) {
          if (!this.localMealType) {
              this.localMealType = meal_type[0].CODE_NAME;
          }
          setMealReportFilters({ meal_type_code: this.localMealType });
      }

      await this.applyFilters();
    } catch (error) {
      console.error('Meal Report Init Error:', error);
    } finally {
      this.isPageLoading = false;
      setMealReportLoading(false);
    }
  }

  async applyFilters() {
    try {
      setMealReportLoading(true);
      
      setMealReportFilters({
        report_type: this.localReportType,
        from: this.localFrom,
        to: this.localTo,
        meal_type_code: this.localMealType
      });

      const response = await this.mealReportService.getMealReport({
        property_id: this.propertyid,
        from: this.localFrom,
        to: this.localTo,
        report_type: this.localReportType,
        meal_type_code: this.localMealType,
        is_export_to_excel: false,
      });
      
      setMealReportData(response.My_Result);
    } catch (error) {
      console.error('Fetch Report Error:', error);
    } finally {
      setMealReportLoading(false);
    }
  }

  resetFilters() {
    this.localReportType = 'GUEST_LIST';
    this.localFrom = moment().format('YYYY-MM-DD');
    this.localTo = moment().format('YYYY-MM-DD');
    if (mealReportStore.setupEntries.meal_type.length > 0) {
        this.localMealType = mealReportStore.setupEntries.meal_type[0].CODE_NAME;
    }
    clearMealReportData();
    this.applyFilters();
  }

  async setPresetDate(type: 'today' | 'tomorrow') {
    const date = type === 'today' ? moment() : moment().add(1, 'day');
    this.localFrom = date.format('YYYY-MM-DD');
    clearMealReportData();
    
    if (type === 'today' && this.localReportType === 'MEAL_COUNT') {
        this.localTo = moment().add(14, 'days').format('YYYY-MM-DD');
    } else {
        this.localTo = this.localFrom;
    }
    await this.applyFilters();
  }

  handleReportTypeChange(e: any) {
    const value = e.target.value as 'GUEST_LIST' | 'MEAL_COUNT';
    this.localReportType = value;
    if (value === 'GUEST_LIST') {
        this.localTo = this.localFrom;
    }
  }

  async handleExport() {
    try {
      this.isExporting = true;
      const response = await this.mealReportService.getMealReport({
        property_id: this.propertyid,
        from: mealReportStore.from,
        to: mealReportStore.to,
        report_type: mealReportStore.report_type,
        meal_type_code: mealReportStore.meal_type_code,
        is_export_to_excel: true,
      });

      const link = response.My_Params_Get_Meal_Report?.Link_excel;

      if (link) {
          const a = document.createElement('a');
          a.href = link;
          a.setAttribute('download', '');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export Error:', error);
    } finally {
        this.isExporting = false;
    }
  }

  render() {
    if (this.isPageLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }

    const mealType = mealReportStore.setupEntries?.meal_type || [];
    
    const headerTitle = this.localReportType === 'GUEST_LIST' 
        ? 'Guest list'
        : 'Meal count';

    const mealTypeLabel = this.localReportType === 'GUEST_LIST' && mealType.length > 0 
        ? (mealType.find(t => t.CODE_NAME === this.localMealType)?.CODE_VALUE_EN || '')
        : '';

    const formatDate = (dateStr: string) => {
        const m = moment(dateStr);
        return `${m.format('ddd')} ${m.format('MMM DD, YYYY')}`;
    };

    const formattedFrom = formatDate(this.localFrom);
    const formattedTo = formatDate(this.localTo);

    const lcz = locales.entries || ({} as any);

    return (
      <Host>
        <ir-toast></ir-toast>
        <ir-interceptor></ir-interceptor>
        <section class="p-2 d-flex flex-column" style={{ gap: '1rem' }}>
          <div class="d-flex align-items-center justify-content-between">
            <h3 class="mb-1 mb-md-0">Meal report</h3>
            <ir-custom-button
              size="small"
              appearance="outlined"
              loading={this.isExporting}
              onClickHandler={() => this.handleExport()}
              style={{ height: '100%' }}
            >
              <wa-icon name="file" slot="end" style={{ fontSize: '14px' }}></wa-icon>
              {lcz.Lcz_Export || 'Export'}
            </ir-custom-button>
          </div>

          <div class="d-flex flex-column flex-lg-row mt-1" style={{ gap: '1rem' }}>
            {/* Filter Card */}
            <div class="card mb-0 p-1 d-flex flex-column sales-filters-card shadow-sm border" style={{ width: '300px', flexShrink: '0' }}>
              <div class="d-flex align-items-center justify-content-between sales-filters-header p-2 border-bottom mb-2">
                <div class="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" height={18} width={18}>
                    <path
                      fill="currentColor"
                      d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z"
                    />
                  </svg>
                  <h4 class="m-0 p-0 flex-grow-1 font-weight-bold" style={{ fontSize: '13px' }}>{lcz.Lcz_Filters || 'Filters'}</h4>
                </div>
              </div>

              <div class="p-2 d-flex flex-column" style={{ gap: '1.25rem' }}>
                <fieldset class="filter-group">
                  <label class="mb-2 d-block small font-weight-bold text-dark">Report type</label>
                  <wa-radio-group 
                    value={this.localReportType}
                    onchange={e => {
                        const val = (e.target as any).value;
                        this.localReportType = val;
                        clearMealReportData();
                        if (val === 'GUEST_LIST') {
                            this.localTo = this.localFrom;
                        }
                    }}
                  >
                    <wa-radio value="GUEST_LIST">Guest list</wa-radio>
                    <wa-radio value="MEAL_COUNT">Meal count</wa-radio>
                  </wa-radio-group>
                </fieldset>

                <fieldset class="filter-group">
                  <label class="mb-2 d-block small font-weight-bold text-dark">Stay date</label>
                  
                  {this.localReportType === 'GUEST_LIST' ? (
                    <div class="d-flex flex-column gap-2">
                      <div class="d-flex gap-2">
                        <ir-custom-button 
                          size="small" 
                          variant={this.localFrom === moment().format('YYYY-MM-DD') ? 'brand' : 'neutral'}
                          appearance={this.localFrom === moment().format('YYYY-MM-DD') ? 'filled' : 'outlined'}
                          onClickHandler={() => this.setPresetDate('today')}
                          style={{flex: '1'}}
                        >Today</ir-custom-button>
                        <ir-custom-button 
                          size="small" 
                          variant={this.localFrom === moment().add(1, 'day').format('YYYY-MM-DD') ? 'brand' : 'neutral'}
                          appearance={this.localFrom === moment().add(1, 'day').format('YYYY-MM-DD') ? 'filled' : 'outlined'}
                          onClickHandler={() => this.setPresetDate('tomorrow')}
                          style={{flex: '1'}}
                        >Tomorrow</ir-custom-button>
                      </div>
                    </div>
                  ) : (
                    <div class="d-flex flex-column gap-2 date-filter-group p-2 bg-light border rounded">
                      <ir-range-picker
                        fromDate={moment(this.localFrom, 'YYYY-MM-DD')}
                        toDate={moment(this.localTo, 'YYYY-MM-DD')}
                        minDate={moment().format('YYYY-MM-DD')}
                        maxDate={moment().add(14, 'days').format('YYYY-MM-DD')}
                        onDateRangeChanged={e => {
                            const { fromDate, toDate } = e.detail;
                            this.localFrom = fromDate.format('YYYY-MM-DD');
                            this.localTo = toDate.format('YYYY-MM-DD');
                            clearMealReportData();
                        }}
                        withOverlay={false}
                      ></ir-range-picker>
                    </div>
                  )}
                </fieldset>

                {this.localReportType === 'GUEST_LIST' && (
                  <fieldset class="filter-group">
                    <label class="mb-2 d-block small font-weight-bold text-dark">Meal type</label>
                    {mealType.length > 0 ? (
                        <div class="d-flex flex-wrap gap-1">
                           {mealType.map(type => (
                             <ir-custom-button
                               size="small"
                               variant={this.localMealType === type.CODE_NAME ? 'brand' : 'neutral'}
                               appearance={this.localMealType === type.CODE_NAME ? 'filled' : 'outlined'}
                               onClickHandler={async () => {
                                 this.localMealType = type.CODE_NAME;
                                 clearMealReportData();
                                 await this.applyFilters();
                               }}
                               style={{ fontSize: '10px', '--ir-button-padding': '0.2rem 0.4rem' }}
                             >{type.CODE_VALUE_EN}</ir-custom-button>
                           ))}
                        </div>
                    ) : (
                        <div class="p-2 border rounded bg-warning bg-opacity-10 text-warning extra-small">
                            No meal types found.
                        </div>
                    )}
                  </fieldset>
                )}

                <div class="d-flex align-items-center justify-content-end gap-2 mt-auto pt-3 border-top filter-actions">
                    <ir-custom-button
                        size="small"
                        variant="neutral"
                        appearance="filled"
                        onClickHandler={() => this.resetFilters()}
                    >{lcz.Lcz_Reset || 'Reset'}</ir-custom-button>
                    <ir-custom-button
                        size="small"
                        variant="brand"
                        loading={mealReportStore.isLoading}
                        onClickHandler={() => this.applyFilters()}
                    >{lcz.Lcz_Apply || 'Apply'}</ir-custom-button>
                </div>
              </div>
            </div>

            {/* Results Card */}
            <div class="flex-grow-1 card mb-0 overflow-hidden shadow-sm border-0">
               <div class="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center">
                  <h3 class="h6 fw-bold mb-0 text-dark flex-grow-1">
                    {headerTitle}
                    <span class="text-muted small ms-2 fw-normal">
                        ({formattedFrom}{this.localReportType === 'MEAL_COUNT' ? ` - ${formattedTo}` : ''})
                        {this.localReportType === 'GUEST_LIST' && mealTypeLabel && ` - ${mealTypeLabel}`}
                    </span>
                  </h3>
                  {this.localReportType === 'GUEST_LIST' && mealReportStore.guestList?.length > 0 && (
                      <span class="badge bg-light text-dark border extra-small">{mealReportStore.guestList.length} Units</span>
                  )}
               </div>
               <div class="card-body p-0 position-relative" style={{ minHeight: '400px' }}>
                  {mealReportStore.isLoading && (
                    <div class="loading-overlay position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-50 z-index-2">
                        <ir-spinner></ir-spinner>
                    </div>
                  )}
                  {this.localReportType === 'GUEST_LIST' ? (
                    <ir-meal-guest-list propertyid={this.propertyid} ticket={this.ticket}></ir-meal-guest-list>
                  ) : (
                    <ir-meal-count-summary></ir-meal-count-summary>
                  )}
               </div>
            </div>
          </div>
        </section>
        <ir-toast-provider></ir-toast-provider>
      </Host>
    );
  }
}
