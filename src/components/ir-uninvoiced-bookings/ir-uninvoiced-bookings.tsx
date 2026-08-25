import { Component, Element, Listen, Prop, State, Watch, h } from '@stencil/core';
import Token from '@/models/Token';
import { RoomService } from '@/services/room.service';
import { PropertyService } from '@/services/property.service';
import locales from '@/stores/locales.store';
import uninvoiced_bookings, { setUninvoicedBookingsCriteria } from '@/stores/uninvoiced_bookings.store';
import { mapBookingToUninvoicedRow } from './types';
import { BookingListingService } from '@/services/booking_listing.service';

@Component({
  tag: 'ir-uninvoiced-bookings',
  styleUrl: 'ir-uninvoiced-bookings.css',
  scoped: true,
})
export class IrUninvoicedBookings {
  @Element() el: HTMLElement;

  @Prop() language: string = '';
  @Prop() ticket: string = '';
  @Prop() propertyid: number;
  @Prop() p: string;
  @Prop() baseUrl: string;

  @State() isPageLoading = true;
  @State() activeBookingNbr: string | null = null;
  @State() activeGuestBookingNbr: string | null = null;

  private token = new Token();
  private roomService = new RoomService();
  private propertyService = new PropertyService();
  private bookingListingService = new BookingListingService();

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

  @Listen('uninvoicedBookingsFiltersChange')
  async handleFiltersChange(e: CustomEvent<{ from: string; to: string; source: string }>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    uninvoiced_bookings.tablePagination = { ...uninvoiced_bookings.tablePagination, currentPage: 1 };
    await this.fetchUninvoicedBookings();
  }

  @Listen('uninvoicedBookingsPageChange')
  async handlePageChange(e: CustomEvent<void>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    await this.fetchUninvoicedBookings();
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

      // Bookings don't depend on language/criteria, so fetch all three concurrently.
      const [languageTexts, criteria] = await Promise.all([
        this.roomService.fetchLanguage(this.language),
        this.bookingListingService.getExposedBookingsCriteria(propertyId),
        this.fetchUninvoicedBookings(),
      ]);
      if (!locales.entries) {
        locales.entries = languageTexts.entries;
        locales.direction = languageTexts.direction;
      }
      setUninvoicedBookingsCriteria(criteria);
    } catch (error) {
      console.error('Error initializing uninvoiced bookings:', error);
    } finally {
      this.isPageLoading = false;
    }
  }

  private async fetchUninvoicedBookings() {
    uninvoiced_bookings.isLoading = true;
    try {
      const { currentPage, pageSize } = uninvoiced_bookings.tablePagination;
      const start_row = (currentPage - 1) * pageSize;

      const { bookings, total_count } = await this.propertyService.getExposedBookingsByInvoicedStatus({
        property_id: this.propertyId,
        booking_nbr: '',
        from_date: uninvoiced_bookings.filters.from,
        to_date: uninvoiced_bookings.filters.to,
        source: uninvoiced_bookings.filters.source,
        is_totally_invoiced: false,
        start_row,
        end_row: start_row + pageSize,
      });

      uninvoiced_bookings.rows = bookings.map(mapBookingToUninvoicedRow);
      uninvoiced_bookings.totalCount = total_count;
    } catch (error) {
      console.error('Error fetching uninvoiced bookings:', error);
    } finally {
      uninvoiced_bookings.isLoading = false;
    }
  }

  private findRow(bookingNbr: string | null) {
    if (!bookingNbr) {
      return undefined;
    }
    return uninvoiced_bookings.rows.find(row => row.booking_nbr === bookingNbr);
  }

  render() {
    if (this.isPageLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }

    return (
      <ir-page description="List of ended bookings with some services that have not been invoiced yet." label="Uninvoiced Past Bookings" class="uninvoiced-bookings__page">
        <ir-unvoiced-bookings-filters></ir-unvoiced-bookings-filters>
        <ir-unvoiced-bookings-table></ir-unvoiced-bookings-table>
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
