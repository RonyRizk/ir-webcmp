import { Component, Element, Listen, Prop, State, Watch, h } from '@stencil/core';
import moment from 'moment';
import ApiClient from '@/models/ApiClient';
import { RoomService } from '@/services/room.service';
import { DpReportService } from '@/services/dp-report.service';
import dp_report, { updateDpReportFilters } from '@/stores/dp_report.store';
import { mapBookingToDpRow } from './types';
import { isOptimReadOnly } from '@/stores/calendar-data';
import { PropertyService } from '@/services/property';
import { AllowedProperties } from '@/services/property/types';
import { LocaleController } from '@/services/locale/locale.controller';
import { LanguageSync } from '@/services/locale/language-sync';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';
import { t } from '@/services/locale/t';

export type DPReportPageTabs = 'chart' | 'bookings';

@Component({
  tag: 'ir-dp-report',
  styleUrl: 'ir-dp-report.css',
  scoped: true,
})
export class IrDpReport {
  @Element() el: HTMLElement;

  @Prop() language: string = '';
  @Prop() ticket: string = '';
  @Prop() propertyid: number;
  @Prop() p: string;
  @Prop() baseUrl: string;
  @Prop() userType: number;

  @State() isPageLoading = true;
  @State() activeTab: DPReportPageTabs = 'chart';
  @State() activeBookingNbr: string | null = null;
  @State() activeGuestBookingNbr: string | null = null;
  @State() propertyId: number;
  @State() allowedProperties: AllowedProperties = null;
  @State() minAllowedDate: string | undefined;

  private ApiClient = new ApiClient();
  private roomService = new RoomService();
  private propertyService = new PropertyService();
  private dpReportService = new DpReportService();

  /** Re-runs init when the language changes so server-localized data follows. */
  private languageSync = new LanguageSync(SCREEN_TABLES.dpReport, () => this.initializeApp());

  componentWillLoad() {
    if (this.baseUrl) {
      this.ApiClient.setBaseUrl(this.baseUrl);
    }
    if (this.ticket !== '') {
      this.ApiClient.setApiClient(this.ticket);
      this.initializeApp();
    }
  }

  componentDidLoad() {
    this.languageSync.connect();
  }

  disconnectedCallback() {
    this.languageSync.disconnect();
  }

  @Watch('language')
  languageChanged(next: string, previous: string) {
    this.languageSync.propChanged(next, previous);
  }

  @Watch('ticket')
  ticketChanged(newValue: string, oldValue: string) {
    if (newValue === oldValue) {
      return;
    }
    this.ApiClient.setApiClient(this.ticket);
    this.initializeApp();
  }

  @Listen('dpFiltersChange')
  async handleDpFiltersChange(e: CustomEvent<{ from: string; to: string }>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    await this.fetchDpReport();
  }

  @Listen('openBookingDetails')
  handleOpenBookingDetails(e: CustomEvent<string>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.activeBookingNbr = e.detail;
  }

  @Listen('guestSelected')
  handleGuestSelected(e: CustomEvent<string>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.activeGuestBookingNbr = e.detail;
  }

  private async initializeApp() {
    this.isPageLoading = true;
    try {
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.dpReport });
      if (!this.propertyid && !this.p) {
        throw new Error('Property ID or username is required');
      }
      let propertyId = this.propertyid;
      if (!propertyId) {
        const propertyData = await this.roomService.getExposedProperty({
          id: 0,
          aname: this.p,
          language: LocaleController.language,
          is_backend: true,
        });
        propertyId = propertyData.My_Result.id;
      }

      this.propertyId = propertyId;
      const [, allowedProperties] = await Promise.all([
        localeReady,
        this.propertyService.getActiveOptimExposedProperties(),
        !this.propertyid
          ? Promise.resolve(null)
          : this.roomService.getExposedProperty({
              id: this.propertyId,
              aname: this.p,
              language: LocaleController.language,
              is_backend: true,
            }),
        await this.fetchInitialDpReport(),
      ]);

      this.allowedProperties = allowedProperties && allowedProperties.length > 1 ? allowedProperties : null;
    } catch (error) {
      console.error('Error initializing DP report:', error);
    } finally {
      this.isPageLoading = false;
    }
  }

  /**
   * Loads the default 2-month lookback window, then checks whether the property's data
   * actually goes back that far. If the earliest returned booking is more recent than the
   * requested from-date, the property has less history than the default window — pin the
   * from-date and the date picker's minimum to that earliest date. Otherwise we can't tell
   * where the real history boundary is, so leave the picker unrestricted.
   */
  private async fetchInitialDpReport() {
    const from = moment().subtract(2, 'months').format('YYYY-MM-DD');
    const to = moment().format('YYYY-MM-DD');
    updateDpReportFilters({ from, to });

    await this.fetchDpReport();

    if (dp_report.rows.length === 0) {
      updateDpReportFilters({ from: to, to });
      this.minAllowedDate = undefined;
      return;
    }

    const earliestDate = dp_report.rows.reduce<string | undefined>((earliest, row) => (!earliest || row.date < earliest ? row.date : earliest), undefined);

    if (earliestDate && earliestDate > from) {
      updateDpReportFilters({ from: earliestDate });
      this.minAllowedDate = earliestDate;
    } else {
      this.minAllowedDate = undefined;
    }
  }

  private async fetchDpReport() {
    dp_report.isLoading = true;
    try {
      const params = {
        property_id: this.propertyId,
        from_date: dp_report.filters.from,
        to_date: dp_report.filters.to,
      };
      const { bookings, summary } = await this.dpReportService.getDPBookingsReport(params);

      dp_report.rows = bookings.map(mapBookingToDpRow);
      dp_report.summary = summary;
      dp_report.tablePagination = { ...dp_report.tablePagination, currentPage: 1 };
    } catch (error) {
      console.error('Error fetching DP report:', error);
    } finally {
      dp_report.isLoading = false;
    }
  }

  private handlePropertyChange = async (e: CustomEvent<string | string[]>) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const value = e.detail as string;
    const newPropertyId = value ? Number(value) : undefined;
    if (!newPropertyId || newPropertyId === this.propertyId) {
      return;
    }
    this.propertyId = newPropertyId;
    this.activeBookingNbr = null;
    this.activeGuestBookingNbr = null;
    await this.fetchInitialDpReport();
  };

  private handleTabShow = (e: CustomEvent<{ name: string }>) => {
    this.activeTab = e.detail.name as DPReportPageTabs;
  };

  private findRow(bookingNbr: string | null) {
    if (!bookingNbr) {
      return undefined;
    }
    return dp_report.rows.find(r => r.booking_nbr === bookingNbr);
  }

  render() {
    if (this.isPageLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    return (
      <ir-page
        description={t('Lcz_DynamicPricingEffectTooltip', {
          fallback:
            'The dynamic pricing effect is calculated at the time the booking is created and remains fixed thereafter, serving as an indicator of the additional profit generated or of the incentive price reduction.',
        })}
        label={t('Lcz_DynamicPricingEffect', { fallback: 'Dynamic Pricing Effect' })}
        class="dp-report__page"
      >
        {this.allowedProperties && (
          <ir-autocomplete
            slot="page-header"
            placeholder={t('Lcz_ChangeProperty', { fallback: 'Change property' })}
            withExpandIcon
            class={'dp-report__property-select'}
            value={this.allowedProperties.find(property => property.id === this.propertyId)?.name ?? ''}
            onCombobox-change={this.handlePropertyChange}
          >
            <wa-icon slot="start" name="magnifying-glass"></wa-icon>
            {this.allowedProperties.map(property => (
              <ir-autocomplete-option key={property.id} label={property.name} value={String(property.id)}>
                {property.name}
              </ir-autocomplete-option>
            ))}
          </ir-autocomplete>
        )}
        {isOptimReadOnly() && (
          <wa-callout size="s" variant="danger" class="dp-report__callout">
            <wa-icon slot="icon" name="face-frown"></wa-icon>
            <div class="dp-report__callout-header">
              <b>{t('Lcz_MissedProfit', { fallback: 'Missed Profit' })}</b>
              <wa-badge pill variant="danger">
                {t('Lcz_Simulation', { fallback: 'SIMULATION' })}
              </wa-badge>
            </div>
            <p class="dp-report__callout-text">
              {t('Lcz_MissedProfitCalloutText', {
                fallback:
                  'The figures below estimate the additional profit your hotel could have generated if Dynamic Pricing had been enabled during the selected period. Contact your account manager to subscribe.',
              })}
            </p>
          </wa-callout>
        )}
        <ir-dp-report-summary></ir-dp-report-summary>
        <wa-tab-group active={this.activeTab} activation="manual" onwa-tab-show={this.handleTabShow}>
          <wa-tab panel="chart">{t('Lcz_Chart', { fallback: 'Chart' })}</wa-tab>
          <wa-tab panel="bookings">{t('Lcz_Bookings', { fallback: 'Bookings' })}</wa-tab>
          <wa-tab-panel name="chart">
            <ir-dp-report-filters minDate={this.minAllowedDate}></ir-dp-report-filters>
            <ir-dp-report-chart></ir-dp-report-chart>
          </wa-tab-panel>
          <wa-tab-panel name="bookings">
            <ir-dp-report-filters minDate={this.minAllowedDate}></ir-dp-report-filters>
            <ir-dp-report-table></ir-dp-report-table>
          </wa-tab-panel>
        </wa-tab-group>
        <ir-booking-details-drawer
          open={!!this.activeBookingNbr}
          propertyId={this.propertyId}
          bookingNumber={this.activeBookingNbr}
          ticket={this.ticket}
          language={this.language}
          onBookingDetailsDrawerClosed={() => (this.activeBookingNbr = null)}
        ></ir-booking-details-drawer>
        <ir-guest-info-drawer
          open={!!this.activeGuestBookingNbr}
          booking_nbr={this.activeGuestBookingNbr}
          email={this.findRow(this.activeGuestBookingNbr)?.raw.guest.email}
          language={this.language}
          onGuestInfoDrawerClosed={() => (this.activeGuestBookingNbr = null)}
        ></ir-guest-info-drawer>
      </ir-page>
    );
  }
}
