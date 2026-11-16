import ApiClient from '@/models/ApiClient';
import { SetupEntries } from '@/models/IBooking';
import { HouseKeepingService } from '@/services/housekeeping';
import { RoomService } from '@/services/room.service';
import calendar_data from '@/stores/calendar-data';
import { updateHKStore } from '@/stores/housekeeping.store';
import { Component, Listen, Prop, State, Watch, h } from '@stencil/core';
import { SetupService } from '@/services/setup';
import { LocaleController } from '@/services/locale/locale.controller';
import { LanguageSync } from '@/services/locale/language-sync';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';
import { t } from '@/services/locale/t';
@Component({
  tag: 'ir-housekeeping',
  styleUrl: 'ir-housekeeping.css',
  scoped: true,
})
export class IrHousekeeping {
  @Prop() language: string = '';
  @Prop() ticket: string = '';

  @Prop() propertyid: number;
  @Prop() p: string;
  @Prop() baseUrl: string;

  @State() isLoading = false;
  @State() frequencies: SetupEntries[] = [];

  private roomService = new RoomService();
  private houseKeepingService = new HouseKeepingService();
  private setupService = new SetupService();
  private ApiClient = new ApiClient();

  /** Re-runs init when the language changes so server-localized data follows. */
  private languageSync = new LanguageSync(SCREEN_TABLES.housekeeping, () => this.initializeApp());

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
  @Listen('resetData')
  async handleResetData(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    await this.houseKeepingService.getExposedHKSetup({ property_id: this.propertyid });
  }
  @Watch('ticket')
  ticketChanged(newValue: string, oldValue: string) {
    if (newValue === oldValue) {
      return;
    }
    this.ApiClient.setApiClient(this.ticket);
    this.initializeApp();
  }

  async initializeApp() {
    try {
      this.isLoading = true;
      // Started first: it seeds `LocaleController.language` from the host prop synchronously,
      // so the requests below are built with the right language on first mount.
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.housekeeping });
      let propertyId = this.propertyid;
      if (!propertyId) {
        const propertyData = await this.roomService.getExposedProperty({
          id: 0,
          aname: this.p,
          language: LocaleController.language,
          is_backend: true,
          include_sales_rate_plans: true,
        });
        propertyId = propertyData.My_Result.id;
      }

      updateHKStore('default_properties', { ApiClient: this.ticket, property_id: propertyId, language: LocaleController.language });

      const [frequencies] = await Promise.all([
        this.setupService.getSetupEntriesByTableName('_HK_FREQUENCY'),
        localeReady,
        this.propertyid &&
          this.roomService.getExposedProperty({
            id: propertyId,
            language: LocaleController.language,
            is_backend: true,
            include_sales_rate_plans: true,
          }),
        calendar_data.housekeeping_enabled && this.houseKeepingService.getExposedHKSetup({ property_id: propertyId }),
      ]);

      this.frequencies = frequencies;
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  render() {
    if (this.isLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    return (
      <ir-page label={t('Lcz_HouseKeepingAndCheckInSetup', { fallback: 'Housekeeping & Check-In Setup' })}>
        <ir-hk-operations-card frequencies={this.frequencies}></ir-hk-operations-card>
        {calendar_data.housekeeping_enabled && <ir-hk-team></ir-hk-team>}
      </ir-page>
    );
  }
}
