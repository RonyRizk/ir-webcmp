import { Component, h, Prop, State, Watch } from '@stencil/core';
import { MealReportService } from '../../services/meal-report/meal-report.service';
import Token from '../../models/Token';
import moment from 'moment';
import locales from '@/stores/locales.store';
import axios from 'axios';
import { groupEntryTablesResult } from '../../utils/utils';
import { IEntries } from '@/models/IBooking';
import { MealCountDaySummary, MealGuestEntry } from '@/services/meal-report/types';

@Component({
  tag: 'ir-meal-report',
  styleUrl: 'ir-meal-report.css',
  scoped: true,
})
export class IrMealReport {
  @Prop() ticket: string;
  @Prop() propertyid: number;
  @Prop() baseurl: string;
  @Prop() language: string = 'en';

  @State() isPageLoading: boolean = true;
  @State() isExporting: boolean = false;
  @State() isDataLoading: boolean = false;

  @State() localReportType: 'GUEST_LIST' | 'MEAL_COUNT' = 'GUEST_LIST';
  @State() localFrom: string = moment().format('YYYY-MM-DD');
  @State() localTo: string = moment().format('YYYY-MM-DD');
  @State() localMealType: string | null = null;

  @State() guestList: MealGuestEntry[] = [];
  @State() mealCountSummary: MealCountDaySummary[] = [];
  @State() setupEntries: { meal_type: IEntries[]; hb_preference: IEntries[] } = {
    meal_type: [],
    hb_preference: [],
  };

  private mealReportService = new MealReportService();
  private tokenService = new Token();

  @Watch('ticket')
  ticketChanged(newValue: string) {
    if (newValue) {
      this.tokenService.setToken(newValue);
      this.init();
    }
  }

  componentWillLoad() {
    if (this.baseurl) {
      this.tokenService.setBaseUrl(this.baseurl);
    }
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
      this.init();
    }
  }

  @Watch('propertyid')
  async handlePropertyChange() {
    await this.init();
  }

  private async init() {
    try {
      this.isPageLoading = true;
      this.isDataLoading = true;

      const setupEntries = await this.mealReportService.getSetupEntriesByTableNameMulti(['_MEAL_TYPE', '_HB_PREFERENCE'] as any);

      const grouped = groupEntryTablesResult(setupEntries);

      const meal_type = (grouped as any).meal_type || [];
      const hb_preference = (grouped as any).hb_preference || [];

      this.setupEntries = {
        meal_type,
        hb_preference,
      };

      if (meal_type.length > 0) {
        if (!this.localMealType) {
          this.localMealType = meal_type[0].CODE_NAME;
        }
      }

      await this.applyFilters();
    } catch (error) {
      // Handling handled via UI
    } finally {
      this.isPageLoading = false;
      this.isDataLoading = false;
    }
  }

  private async applyFilters() {
    try {
      this.isDataLoading = true;

      const response = await this.mealReportService.getMealReport({
        property_id: this.propertyid,
        from: this.localFrom,
        to: this.localTo,
        report_type: this.localReportType,
        meal_type_code: this.localMealType,
        is_export_to_excel: false,
      });

      this.guestList = response.My_Result.Guest_List || [];
      this.mealCountSummary = response.My_Result.Meal_Count_Summary || [];
    } catch (error) {
      // Handling handled via UI
    } finally {
      this.isDataLoading = false;
    }
  }

  private resetFilters() {
    this.localReportType = 'GUEST_LIST';
    this.localFrom = moment().format('YYYY-MM-DD');
    this.localTo = moment().format('YYYY-MM-DD');
    if (this.setupEntries.meal_type.length > 0) {
      this.localMealType = this.setupEntries.meal_type[0].CODE_NAME;
    }
    this.applyFilters();
  }

  private async setPresetDate(type: 'today' | 'tomorrow') {
    const date = type === 'today' ? moment() : moment().add(1, 'day');
    this.localFrom = date.format('YYYY-MM-DD');
    if (type === 'today' && this.localReportType === 'MEAL_COUNT') {
      this.localTo = moment().add(14, 'days').format('YYYY-MM-DD');
    } else {
      this.localTo = this.localFrom;
    }
  }

  private async handleExport() {
    try {
      this.isExporting = true;
      const response = await this.mealReportService.getMealReport({
        property_id: this.propertyid,
        from: this.localFrom,
        to: this.localTo,
        report_type: this.localReportType,
        meal_type_code: this.localMealType,
        is_export_to_excel: true,
      });

      const link = response.My_Params_Get_Meal_Report?.Link_excel;

      if (link) {
        // Use clean axios to bypass interceptors (avoiding network errors)
        const cleanAxios = axios.create();
        const responseBlob = await cleanAxios.get(link, { responseType: 'blob' });

        // Force download via local blob URL
        const blob = new Blob([responseBlob.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const filename = link.split('/').pop() || 'meal_report.xlsx';
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      // Export Error handled silently or via UI
    } finally {
      this.isExporting = false;
    }
  }

  render() {
    if (this.isPageLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }

    const lcz = (locales.entries as any) || {};

    // const summary = this.mealCountSummary || [];
    // const sum = (key: keyof MealCountDaySummary) => summary.reduce((acc, day) => acc + (Number(day[key]) || 0), 0);
    // const mealMetrics = [
    //   { label: 'Breakfast', icon: 'mug-saucer', intent: 'brand' as const, adults: sum('Breakfast_Ad'), children: sum('Breakfast_Ch') },
    //   { label: 'Lunch', icon: 'utensils', intent: 'success' as const, adults: sum('Lunch_Ad'), children: sum('Lunch_Ch') },
    //   { label: 'Dinner', icon: 'moon', intent: 'warning' as const, adults: sum('Dinner_Ad'), children: sum('Dinner_Ch') },
    // ];

    return (
      <ir-page label="Meal Report" description={this.localReportType === 'GUEST_LIST' ? 'Guest List' : 'Meal Count'} class={'page'}>
        <ir-custom-button
          slot="page-header"
          type="button"
          size="s"
          appearance="outlined"
          loading={this.isExporting}
          onClickHandler={(e: CustomEvent) => {
            const ev = e.detail as MouseEvent;
            if (ev && typeof ev.preventDefault === 'function') {
              ev.preventDefault();
              ev.stopPropagation();
            }
            this.handleExport();
          }}
          class="ir-meal-report__export-btn"
        >
          <wa-icon name="download" slot="start" style={{ fontSize: '14px' }}></wa-icon>
          {lcz.Lcz_Export || 'Export'}
        </ir-custom-button>
        {/* {this.localReportType === 'MEAL_COUNT' && (
          <div class="ir-meal-report__metrics">
            {mealMetrics.map(metric => (
              <ir-metric-card
                key={metric.label}
                label={metric.label}
                icon={metric.icon}
                value={metric.adults + metric.children}
                unit="guests"
                caption={`Adults ${metric.adults} · Children ${metric.children}`}
                loading={this.isDataLoading}
              ></ir-metric-card>
            ))}
          </div>
        )} */}
        <div class="ir-meal-report__layout">
          <ir-meal-report-filters
            reportType={this.localReportType}
            fromDate={this.localFrom}
            toDate={this.localTo}
            mealType={this.localMealType}
            setupEntries={this.setupEntries}
            isLoading={this.isDataLoading}
            lcz={lcz}
            onReportTypeChange={e => {
              this.localReportType = e.detail;
              this.applyFilters();
              if (e.detail === 'GUEST_LIST') {
                this.localTo = this.localFrom;
              }
            }}
            onDateChange={e => {
              this.localFrom = e.detail.from;
              this.localTo = e.detail.to;
            }}
            onMealTypeChange={async e => {
              this.localMealType = e.detail;
            }}
            onFilterApply={() => this.applyFilters()}
            onFilterReset={() => this.resetFilters()}
            onPresetDate={e => this.setPresetDate(e.detail)}
          ></ir-meal-report-filters>

          <wa-card class="ir-meal-report__results">
            <div>
              {this.localReportType === 'GUEST_LIST' ? (
                <ir-meal-guest-list guestList={this.guestList}></ir-meal-guest-list>
              ) : (
                <ir-meal-count-summary mealCountSummary={this.mealCountSummary}></ir-meal-count-summary>
              )}
            </div>
          </wa-card>
        </div>
      </ir-page>
    );
  }
}
