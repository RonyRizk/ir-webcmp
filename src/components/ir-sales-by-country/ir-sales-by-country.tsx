import ApiClient from '@/models/ApiClient';
import { PropertyService } from '@/services/property.service';
import { RoomService } from '@/services/room.service';
import { Component, Host, Prop, State, Watch, h } from '@stencil/core';
import { BaseSalesRecord, CountrySalesFilter, MappedCountries, SalesRecord } from './types';
import moment from 'moment';
import { v4 } from 'uuid';
import { BookingService } from '@/services/booking-service/booking.service';
import { ICountry } from '@/models/IBooking';
import { LocaleController } from '@/services/locale/locale.controller';
import { LanguageSync } from '@/services/locale/language-sync';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';

import { t } from '@/services/locale/t';
@Component({
  tag: 'ir-sales-by-country',
  styleUrl: 'ir-sales-by-country.css',
  scoped: true,
})
export class IrSalesByCountry {
  @Prop() language: string = '';
  @Prop() ticket: string = '';
  @Prop() propertyid: number;
  @Prop() p: string;

  @State() isLoading: 'filter' | 'export' | null = null;
  @State() isPageLoading = true;
  @State() property_id: number;
  @State() salesData: SalesRecord[];
  @State() salesFilters: CountrySalesFilter;
  @State() countries: MappedCountries = new Map();

  private ApiClient = new ApiClient();
  private roomService = new RoomService();
  private propertyService = new PropertyService();
  private bookingService = new BookingService();

  private baseFilters = {
    FROM_DATE: moment().add(-7, 'days').format('YYYY-MM-DD'),
    TO_DATE: moment().format('YYYY-MM-DD'),
    BOOK_CASE: '001',
    WINDOW: 7,
    include_previous_year: false,
  };

  /** Re-runs init when the language changes so server-localized data follows. */
  private languageSync = new LanguageSync(SCREEN_TABLES.salesByCountry, () => this.initializeApp());

  componentWillLoad() {
    this.salesFilters = this.baseFilters;
    if (this.ticket) {
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

  private async initializeApp() {
    try {
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.salesByCountry });
      let propertyId = this.propertyid;
      if (!this.propertyid && !this.p) {
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
      const requests = [this.bookingService.getCountries(LocaleController.language), localeReady, this.getCountrySales()];
      if (this.propertyid) {
        requests.push(
          this.roomService.getExposedProperty({
            id: this.propertyid,
            language: LocaleController.language,
            is_backend: true,
            include_units_hk_status: true,
          }),
        );
      }

      const [countries] = await Promise.all(requests);
      const mappedCountries = new Map();
      (countries as ICountry[]).map(country => {
        mappedCountries.set(country.id, {
          flag: country.flag,
          name: country.name,
        });
      });
      this.countries = mappedCountries;
    } catch (error) {
      console.log(error);
    } finally {
      this.isPageLoading = false;
    }
  }

  private async getCountrySales(isExportToExcel = false) {
    const formatSalesData = (data): Omit<BaseSalesRecord, 'id'> => {
      return {
        country: data.COUNTRY,
        country_id: data.COUNTRY_ID,
        nights: data.NIGHTS,
        percentage: data.PCT,
        revenue: data.REVENUE,
        number_of_guests: data.Total_Guests,
      };
    };
    try {
      const { include_previous_year, ...filterParams } = this.salesFilters;
      this.isLoading = isExportToExcel ? 'export' : 'filter';

      const currentSales = await this.propertyService.getCountrySales({
        AC_ID: this.property_id,
        is_export_to_excel: isExportToExcel,
        ...filterParams,
      });

      const shouldFetchPreviousYear = !isExportToExcel && include_previous_year;

      let enrichedSales: SalesRecord[] = [];

      if (shouldFetchPreviousYear) {
        const previousYearSales = await this.propertyService.getCountrySales({
          AC_ID: this.property_id,
          is_export_to_excel: false,
          ...filterParams,
          FROM_DATE: moment(filterParams.FROM_DATE).subtract(1, 'year').format('YYYY-MM-DD'),
          TO_DATE: moment(filterParams.TO_DATE).subtract(1, 'year').format('YYYY-MM-DD'),
        });

        enrichedSales = currentSales.map(current => {
          const previous = previousYearSales.find(prev => prev.COUNTRY.toLowerCase() === current.COUNTRY.toLowerCase());
          return {
            id: v4(),
            ...formatSalesData(current),
            last_year: previous ? formatSalesData(previous) : null,
          };
        });
      } else {
        enrichedSales = currentSales.map(record => ({
          id: v4(),
          ...formatSalesData(record),
          last_year: null,
        }));
      }

      this.salesData = [...enrichedSales];
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
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
        <ir-page label={t('Lcz_SalesByCountry', { fallback: 'Sales by Country' })}>
          <ir-custom-button
            slot="page-header"
            variant="neutral"
            appearance="outlined"
            loading={this.isLoading === 'export'}
            onClickHandler={async e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              await this.getCountrySales(true);
            }}
          >
            <wa-icon name="download" slot="start"></wa-icon>
            {t('Lcz_Export', { fallback: 'Export' })}
          </ir-custom-button>
          <ir-sales-by-country-summary salesReports={this.salesData}></ir-sales-by-country-summary>
          <div class="sales-content-row">
            <ir-sales-filters
              isLoading={this.isLoading === 'filter'}
              onApplyFilters={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.salesFilters = e.detail;
                this.getCountrySales();
              }}
              baseFilters={this.baseFilters}
            ></ir-sales-filters>
            <ir-sales-table mappedCountries={this.countries} class="sales-table-card" records={this.salesData}></ir-sales-table>
          </div>
        </ir-page>
      </Host>
    );
  }
}
