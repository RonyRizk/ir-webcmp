import Token from '@/models/Token';
import { IEntries } from '@/models/IBooking';
import { HouseKeepingService } from '@/services/housekeeping.service';
import { RoomService } from '@/services/room.service';
import calendar_data from '@/stores/calendar-data';
import { updateHKStore } from '@/stores/housekeeping.store';
import { Component, Event, EventEmitter, Host, Listen, Prop, State, Watch, h } from '@stencil/core';
import { IToast } from '@components/ui/ir-toast/toast';
import locales from '@/stores/locales.store';
import { BookingService } from '@/services/booking-service/booking.service';
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
  @State() frequencies: IEntries[] = [];

  @Event() toast: EventEmitter<IToast>;

  private roomService = new RoomService();
  private houseKeepingService = new HouseKeepingService();
  private bookingService = new BookingService();
  private token = new Token();

  componentWillLoad() {
    if (this.baseUrl) {
      this.token.setBaseUrl(this.baseUrl);
    }
    if (this.ticket !== '') {
      this.token.setToken(this.ticket);
      this.initializeApp();
    }
  }
  @Listen('resetData')
  async handleResetData(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    await this.houseKeepingService.getExposedHKSetup(this.propertyid);
  }
  @Watch('ticket')
  ticketChanged(newValue: string, oldValue: string) {
    if (newValue === oldValue) {
      return;
    }
    this.token.setToken(this.ticket);
    this.initializeApp();
  }

  async initializeApp() {
    try {
      this.isLoading = true;
      let propertyId = this.propertyid;
      if (!propertyId) {
        const propertyData = await this.roomService.getExposedProperty({
          id: 0,
          aname: this.p,
          language: this.language,
          is_backend: true,
          include_sales_rate_plans: true,
        });
        propertyId = propertyData.My_Result.id;
      }

      updateHKStore('default_properties', { token: this.ticket, property_id: propertyId, language: this.language });

      const [frequencies] = await Promise.all([
        this.bookingService.getSetupEntriesByTableName('_HK_FREQUENCY'),
        this.roomService.fetchLanguage(this.language, ['_HK_FRONT', '_PMS_FRONT']),
        this.propertyid &&
          this.roomService.getExposedProperty({
            id: propertyId,
            language: this.language,
            is_backend: true,
            include_sales_rate_plans: true,
          }),
        calendar_data.housekeeping_enabled && this.houseKeepingService.getExposedHKSetup(propertyId),
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
      <Host>
        <ir-interceptor></ir-interceptor>
        <ir-toast></ir-toast>
        <section class="ir-page__container">
          <h3 class="page-title">{locales.entries.Lcz_HouseKeepingAndCheckInSetup}</h3>
          <ir-hk-operations-card frequencies={this.frequencies}></ir-hk-operations-card>
          {calendar_data.housekeeping_enabled && <ir-hk-team></ir-hk-team>}
        </section>
      </Host>
    );
  }
}
