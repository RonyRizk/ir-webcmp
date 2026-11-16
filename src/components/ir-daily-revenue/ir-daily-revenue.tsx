import ApiClient from '@/models/ApiClient';
import { SetupService } from '@/services/setup';
import { BookingListingService, ICriteriaChannel } from '@/services/booking-listing';
import { PropertyService } from '@/services/property.service';
import { RoomService } from '@/services/room.service';
import { Component, Event, EventEmitter, Host, Listen, Prop, State, Watch, h } from '@stencil/core';
import { DailyPaymentFilter, FolioPayment, GroupedFolioPayment, RevenueSourceOption, SidebarOpenEvent } from './types';
import { v4 } from 'uuid';
import moment from 'moment';
import { PaymentEntries } from '../ir-booking-details/types';
import { LocaleController } from '@/services/locale/locale.controller';
import { LanguageSync } from '@/services/locale/language-sync';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';

import { t } from '@/services/locale/t';
@Component({
  tag: 'ir-daily-revenue',
  styleUrl: 'ir-daily-revenue.css',
  scoped: true,
})
export class IrDailyRevenue {
  @Prop() language: string = '';
  @Prop() ticket: string = '';
  @Prop() propertyid: number;
  @Prop() p: string;

  @State() isPageLoading: boolean;
  @State() property_id: number;
  @State() groupedPayment: GroupedFolioPayment;
  @State() previousDateGroupedPayments: GroupedFolioPayment;
  @State() isLoading: string;
  @State() filters: DailyPaymentFilter = {
    date: moment().format('YYYY-MM-DD'),
    from_date: null,
    to_date: null,
    users: null,
    source: null,
  };
  @State() sideBarEvent: SidebarOpenEvent | null;
  @State() sources: RevenueSourceOption[] = [];

  private apiClientService = new ApiClient();
  private roomService = new RoomService();
  private propertyService = new PropertyService();
  private setupService = new SetupService();
  private bookingListingService = new BookingListingService();
  private paymentEntries: PaymentEntries;

  @Event() preventPageLoad: EventEmitter<null>;

  /** Re-runs init when the language changes so server-localized data follows. */
  private languageSync = new LanguageSync(SCREEN_TABLES.dailyRevenue, () => this.initializeApp());

  componentWillLoad() {
    if (this.ticket) {
      this.apiClientService.setApiClient(this.ticket);
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
    this.apiClientService.setApiClient(this.ticket);
    this.initializeApp();
  }

  @Listen('revenueOpenSidebar')
  handleOpenSidebar(e: CustomEvent<SidebarOpenEvent>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.sideBarEvent = e.detail;
  }
  @Listen('fetchNewReports')
  handleFetchNewReports(e: CustomEvent<DailyPaymentFilter>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.filters = { ...e.detail };
    this.getPaymentReports();
  }
  @Listen('resetBookingEvt')
  async handleResetBooking(e: CustomEvent) {
    e.stopPropagation();
    e.stopImmediatePropagation();
    this.getPaymentReports(false, true);
  }

  private handleSidebarClose = (e: CustomEvent) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.sideBarEvent = null;
  };

  private async initializeApp() {
    this.isPageLoading = true;

    try {
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.dailyRevenue });
      let propertyId = this.propertyid;
      if (!propertyId && !this.p) {
        throw new Error('Property ID or username is required');
      }
      if (!propertyId) {
        const propertyData = await this.roomService.getExposedProperty({
          id: 0,
          aname: this.p,
          language: LocaleController.language,
          is_backend: true,
          include_units_hk_status: true,
        });
        propertyId = propertyData.My_Result.id;
      }

      this.property_id = propertyId;

      const requests: Promise<any>[] = [
        this.setupService.getPaymentEntries(),
        this.getPaymentReports(),
        localeReady,
        // The source filter is optional; don't let a criteria failure block the report
        this.bookingListingService.fetchExposedBookingsCriteria({ property_id: propertyId, language: LocaleController.language }).catch(() => null),
      ];
      if (propertyId) {
        requests.push(
          this.roomService.getExposedProperty({
            id: propertyId,
            language: LocaleController.language,
            is_backend: true,
            include_units_hk_status: true,
          }),
        );
      }

      const [paymentEntries, , , criteria] = await Promise.all(requests);
      this.paymentEntries = paymentEntries;
      this.sources = this.buildSourceOptions(criteria?.channels ?? []);
    } catch (error) {
      console.log(error);
    } finally {
      this.isPageLoading = false;
    }
  }

  /**
   * All direct channels collapse into a single "Direct" option whose value is their comma-separated values;
   * every other channel stays its own option.
   */
  private buildSourceOptions(channels: ICriteriaChannel[]): RevenueSourceOption[] {
    const directValues = channels.filter(c => c.is_direct).map(c => c.value);
    const options: RevenueSourceOption[] = [];
    if (directValues.length) {
      options.push({ label: t('Lcz_Direct', { fallback: 'Direct' }), value: directValues.join(',') });
    }
    for (const channel of channels) {
      if (!channel.is_direct) {
        options.push({ label: channel.name, value: channel.value });
      }
    }
    return options;
  }

  private groupPaymentsByName(payments: FolioPayment[]): GroupedFolioPayment {
    const groupedPayment: GroupedFolioPayment = new Map();

    for (const payment of payments) {
      const key = `${payment.payTypeCode}_${payment.payMethodCode}`;
      const p = groupedPayment.get(key) ?? [];
      groupedPayment.set(key, [...p, payment]);
    }
    return new Map(
      [...groupedPayment.entries()].sort(([a], [b]) => {
        const aNum = Number(a);
        const bNum = Number(b);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return a.localeCompare(b);
      }),
    );
  }

  private async getPaymentReports(isExportToExcel = false, excludeYesterday = false) {
    try {
      const getReportObj = (report): FolioPayment => {
        return {
          method: report.METHOD,
          payTypeCode: report.PAY_TYPE_CODE,
          payMethodCode: report.PAY_METHOD_CODE,
          amount: report.AMOUNT,
          date: report.DATE,
          hour: report.HOUR,
          minute: report.MINUTE,
          user: report.USER,
          currency: report.CURRENCY,
          bookingNbr: report.BOOKING_NBR,
          id: v4(),
        };
      };
      this.isLoading = isExportToExcel ? 'export' : 'filter';

      const requests = [
        this.propertyService.getDailyRevenueReport({
          from_date: this.filters.date ? this.filters.date : this.filters.from_date,
          to_date: this.filters.date ? this.filters.date : this.filters.to_date,
          property_id: this.property_id?.toString(),
          is_export_to_excel: isExportToExcel,
          source: this.filters.source,
        }),
      ];
      if (!isExportToExcel && !excludeYesterday && this.filters.date) {
        requests.push(
          this.propertyService.getDailyRevenueReport({
            from_date: moment(this.filters.date, 'YYYY-MM-DD').add(-1, 'days').format('YYYY-MM-DD'),
            to_date: moment(this.filters.date, 'YYYY-MM-DD').add(-1, 'days').format('YYYY-MM-DD'),
            property_id: this.property_id?.toString(),
            is_export_to_excel: isExportToExcel,
            source: this.filters.source,
          }),
        );
      }

      const results = await Promise.all(requests);
      if (!isExportToExcel) {
        if (results[0]) {
          this.groupedPayment = this.groupPaymentsByName(results[0]?.map(getReportObj));
        } else {
          this.groupedPayment = new Map();
        }
        if (results[1]) this.previousDateGroupedPayments = this.groupPaymentsByName(results[1]?.map(getReportObj));
      }
    } catch (e) {
      console.log(e);
    } finally {
      this.isLoading = null;
    }
  }

  render() {
    if (this.isPageLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    return (
      <Host>
        <ir-page label={t('Lcz_DailyRevenue', { fallback: 'Daily Revenue' })}>
          <ir-custom-button
            slot="page-header"
            variant="neutral"
            appearance="outlined"
            loading={this.isLoading === 'export'}
            onClickHandler={async e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              await this.getPaymentReports(true);
            }}
          >
            <wa-icon name="download" slot="start"></wa-icon>
            {t('Lcz_Export', { fallback: 'Export' })}
          </ir-custom-button>
          <ir-revenue-summary
            filters={this.filters}
            previousDateGroupedPayments={this.previousDateGroupedPayments}
            groupedPayments={this.groupedPayment}
            paymentEntries={this.paymentEntries}
          ></ir-revenue-summary>
          <div class="revenue-content-row">
            <ir-daily-revenue-filters isLoading={this.isLoading === 'filter'} payments={this.groupedPayment} sources={this.sources}></ir-daily-revenue-filters>
            <ir-revenue-table filters={this.filters} class="revenue-table-card" paymentEntries={this.paymentEntries} payments={this.groupedPayment}></ir-revenue-table>
          </div>
        </ir-page>
        <ir-booking-details-drawer
          open={Boolean(this.sideBarEvent)}
          propertyId={this.property_id}
          bookingNumber={this.sideBarEvent?.payload?.bookingNumber?.toString()}
          ticket={this.ticket}
          language={this.language}
          onBookingDetailsDrawerClosed={e => this.handleSidebarClose(e)}
        ></ir-booking-details-drawer>
      </Host>
    );
  }
}
