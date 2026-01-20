import { Component, Host, Prop, State, Watch, h } from '@stencil/core';
import Token from '@/models/Token';
import { AllowedProperties, FetchUnBookableRoomsResult, PropertyService } from '@/services/property.service';

type UnbookableRoomsMode = 'default' | 'mpo';
type UnbookableRoomsFilters = { period_to_check: number; consecutive_period: number; country: string };

@Component({
  tag: 'ir-unbookable-rooms',
  styleUrl: 'ir-unbookable-rooms.css',
  scoped: true,
})
export class IrUnbookableRooms {
  @Prop() ticket: string = '';
  @Prop() propertyid: number;
  @Prop({ reflect: true }) mode: UnbookableRoomsMode = 'default';
  //number in months
  @Prop() period_to_check: number = 2;
  //number in days
  @Prop() consecutive_period: number = 14;

  @State() isLoading = false;
  @State() errorMessage: string = '';
  @State() unbookableRooms: FetchUnBookableRoomsResult = [];
  @State() allowedProperties: AllowedProperties = null;
  @State() filters: UnbookableRoomsFilters = { period_to_check: 2, consecutive_period: 14, country: 'all' };
  @State() progressFilters = { period_to_check: 2, consecutive_period: 14 };
  @State() lastUpdatedLabel = '';
  @State() isPageLoading = true;

  private tokenService = new Token();
  private propertyService = new PropertyService();

  componentWillLoad() {
    this.filters = {
      country: 'all',
      period_to_check: this.normalizePositiveNumber(this.period_to_check, 2),
      consecutive_period: this.normalizePositiveNumber(this.consecutive_period, 14),
    };

    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
      this.initializeApp();
    }
  }

  @Watch('ticket')
  ticketChanged(newValue: string, oldValue: string) {
    if (newValue === oldValue) {
      return;
    }
    this.tokenService.setToken(this.ticket);
    this.initializeApp();
  }

  @Watch('mode')
  modeChanged(newValue: UnbookableRoomsMode, oldValue: UnbookableRoomsMode) {
    if (newValue === oldValue) {
      return;
    }
    this.initializeApp();
  }

  @Watch('property_id')
  propertyIdChanged(newValue: number, oldValue: number) {
    if (newValue === oldValue) {
      return;
    }
    if (this.resolveMode() === 'default') {
      this.initializeApp();
    }
  }

  @Watch('period_to_check')
  periodToCheckChanged(newValue: number) {
    this.filters = { ...this.filters, period_to_check: this.normalizePositiveNumber(newValue, this.filters.period_to_check) };
  }

  @Watch('consecutive_period')
  consecutivePeriodChanged(newValue: number) {
    this.filters = { ...this.filters, consecutive_period: this.normalizePositiveNumber(newValue, this.filters.consecutive_period) };
  }

  private normalizePositiveNumber(value: number, fallback: number) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
    return fallback;
  }

  private resolveMode(): UnbookableRoomsMode {
    return this.mode === 'mpo' ? 'mpo' : 'default';
  }

  private async initializeApp() {
    if (!this.ticket) {
      return;
    }
    try {
      this.errorMessage = '';
      this.isLoading = true;
      this.unbookableRooms = [];

      if (this.resolveMode() === 'mpo') {
        this.allowedProperties = await this.propertyService.getExposedAllowedProperties();
      } else {
        this.allowedProperties = null;
      }

      await this.fetchUnbookableRooms();
    } catch (error) {
      console.error('Failed to load unbookable rooms', error);
      this.errorMessage = 'Unable to load unbookable rooms right now. Please try again.';
    } finally {
      this.isLoading = false;
      if (this.isPageLoading) {
        this.isPageLoading = false;
      }
    }
  }

  private async fetchUnbookableRooms() {
    const propertyIds = this.getPropertyIds();
    if (!propertyIds.length) {
      this.unbookableRooms = [];
      this.errorMessage = this.resolveMode() === 'mpo' ? 'No properties available to check.' : 'Property ID is required to load unbookable rooms.';
      return;
    }

    const results = await this.propertyService.fetchUnBookableRooms({
      property_ids: propertyIds,
      period_to_check: this.filters.period_to_check * 30,
      consecutive_period: this.filters.consecutive_period,
    });

    this.unbookableRooms = results ?? [];
    this.lastUpdatedLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private getPropertyIds(): number[] {
    if (this.resolveMode() === 'mpo') {
      return this.allowedProperties?.map(property => property.id) ?? [];
    }
    const propertyId = Number(this.propertyid);
    return Number.isFinite(propertyId) && propertyId > 0 ? [propertyId] : [];
  }

  private handleFiltersChange = (event: CustomEvent<Partial<UnbookableRoomsFilters>>) => {
    this.filters = { ...this.filters, ...event.detail };
  };

  private handleRefresh = async () => {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      if (this.resolveMode() === 'mpo' && !this.allowedProperties) {
        this.allowedProperties = await this.propertyService.getExposedAllowedProperties();
      }
      await this.fetchUnbookableRooms();
      this.progressFilters = {
        period_to_check: this.filters.period_to_check,
        consecutive_period: this.filters.consecutive_period,
      };
    } catch (error) {
      console.error('Failed to refresh unbookable rooms', error);
      this.errorMessage = 'Unable to refresh unbookable rooms right now.';
    } finally {
      this.isLoading = false;
    }
  };
  private handleFiltersReset = () => {
    this.filters = {
      country: 'all',
      consecutive_period: 14,
      period_to_check: 2,
    };
    this.handleRefresh();
  };

  render() {
    if (this.isPageLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    const totalIssues = this.unbookableRooms?.length ?? 0;
    const propertiesWithIssues = new Set(this.unbookableRooms?.map(entry => entry.property_id)).size;
    return (
      <Host>
        <ir-toast></ir-toast>
        <ir-interceptor></ir-interceptor>
        <section class="ir-page__container">
          <h3 class="page-title">Availability Alert</h3>

          {this.mode === 'mpo' && (
            <section class="summary" aria-live="polite">
              <wa-card>
                <span class="summary__value">{totalIssues}</span>
                <span class="summary__label">room types affected</span>
              </wa-card>
              <wa-card>
                <span class="summary__value">{propertiesWithIssues}</span>
                <span class="summary__label">properties impacted</span>
              </wa-card>
            </section>
          )}

          {/* {this.errorMessage && <p class="error">{this.errorMessage}</p>} */}

          <section class="unbookable-rooms__content">
            <ir-unbookable-rooms-filters
              mode={this.mode}
              filters={this.filters}
              unbookableRooms={this.unbookableRooms}
              isLoading={this.isLoading}
              onFiltersChange={this.handleFiltersChange}
              onFiltersReset={this.handleFiltersReset}
              onFiltersSave={this.handleRefresh}
            ></ir-unbookable-rooms-filters>
            <ir-unbookable-rooms-data
              mode={this.mode}
              isLoading={this.isLoading}
              errorMessage={this.errorMessage}
              unbookableRooms={this.unbookableRooms}
              allowedProperties={this.allowedProperties}
              filters={this.filters}
              progressFilters={this.progressFilters}
            ></ir-unbookable-rooms-data>
          </section>
        </section>
      </Host>
    );
  }
}
