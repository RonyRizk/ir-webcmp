import { Component, Element, Listen, Prop, State, Watch, h } from '@stencil/core';
import Token from '@/models/Token';
import { RoomService } from '@/services/room.service';
import { DpReportService } from '@/services/dp-report.service';
import locales from '@/stores/locales.store';
import dp_report from '@/stores/dp_report.store';
import { mapBookingToDpRow } from './types';

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

  private token = new Token();
  private roomService = new RoomService();
  private dpReportService = new DpReportService();

  private propertyId: number;

  componentWillLoad() {
    if (this.baseUrl) {
      this.token.setBaseUrl(this.baseUrl);
    }
    if (this.ticket !== '') {
      this.token.setToken(this.ticket);
      this.initializeApp();
    }
  }

  @Watch('ticket')
  ticketChanged(newValue: string, oldValue: string) {
    if (newValue === oldValue) {
      return;
    }
    this.token.setToken(this.ticket);
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
      if (!this.propertyid && !this.p) {
        throw new Error('Property ID or username is required');
      }
      let propertyId = this.propertyid;
      if (!propertyId) {
        const propertyData = await this.roomService.getExposedProperty({
          id: 0,
          aname: this.p,
          language: this.language,
          is_backend: true,
        });
        propertyId = propertyData.My_Result.id;
      }
      this.propertyId = propertyId;

      const languageTexts = await this.roomService.fetchLanguage(this.language);
      if (!locales.entries) {
        locales.entries = languageTexts.entries;
        locales.direction = languageTexts.direction;
      }

      await this.fetchDpReport();
    } catch (error) {
      console.error('Error initializing DP report:', error);
    } finally {
      this.isPageLoading = false;
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
        description="The dynamic pricing effect is calculated at the time the booking is
created and remains fixed thereafter, serving as an indicator of the additional profit generated or of
the incentive price reduction."
        label="Dynamic Pricing Report"
        class="dp-report__page"
      >
        <ir-dp-report-summary></ir-dp-report-summary>
        <wa-tab-group active={this.activeTab} activation="manual" onwa-tab-show={this.handleTabShow}>
          <wa-tab panel="chart">Chart</wa-tab>
          <wa-tab panel="bookings">Bookings</wa-tab>
          <wa-tab-panel name="chart">
            <ir-dp-report-filters></ir-dp-report-filters>
            <ir-dp-report-chart></ir-dp-report-chart>
          </wa-tab-panel>
          <wa-tab-panel name="bookings">
            <ir-dp-report-filters></ir-dp-report-filters>
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
