import ApiClient from '@/models/ApiClient';
import { PropertyService } from '@/services/property.service';
import calendar_data from '@/stores/calendar-data';
import { checkUserAuthState, manageAnchorSession } from '@/utils/utils';
import { inlineSign } from '@/utils/direction';
import { Component, Element, Fragment, Host, Prop, State, Watch, h } from '@stencil/core';
import { LocaleController } from '@/services/locale/locale.controller';

export type SecureScreens =
  | 'dashboard'
  | 'hk'
  | 'tasks'
  | 'daily-revenue'
  | 'arrivals'
  | 'departures'
  | 'front'
  | 'users'
  | 'email-logs'
  | 'country-sales'
  | 'daily-occupancy'
  | 'booking-listing'
  | 'channel-sales'
  | 'city-ledger'
  | 'agents'
  | 'channels'
  | 'tax-services'
  | 'extra-services'
  | 'payment-options'
  | 'ghs'
  | 'meal-report'
  | 'fiscal-documents'
  | 'uninvoiced-bookings';

@Component({
  tag: 'ir-secure-tasks',
  styleUrl: 'ir-secure-tasks.css',
  shadow: false,
})
export class IrSecureTasks {
  @Element() el: HTMLElement;

  @Prop({ mutable: true }) propertyid: number;
  @Prop() language: string;
  @Prop() p: string;
  @Prop() bookingNumber: string;
  @Prop() ticket: string;

  @State() isAuthenticated: boolean = false;
  @State() currentPage: SecureScreens = 'front';
  @State() inputValue: string;
  @State() canScrollTowardsStart: boolean = false;
  @State() canScrollTowardsEnd: boolean = true;
  @State() isLoading = true;

  private ApiClient = new ApiClient();
  private dates: any = {};
  private tabsTrackRef: HTMLElement;
  private resizeObserver: ResizeObserver;

  async componentWillLoad() {
    const isAuthenticated = checkUserAuthState();
    this.generateDates();
    if (this.ticket) {
      this.isAuthenticated = true;
      this.ApiClient.setApiClient(this.ticket);
    }
    if (isAuthenticated) {
      this.isAuthenticated = true;
      this.ApiClient.setApiClient(isAuthenticated.ApiClient);
    }
    this.inputValue = this.p;

    const pageParam = new URLSearchParams(window.location.search).get('page') as SecureScreens | null;
    if (pageParam && this.isValidPage(pageParam)) {
      this.currentPage = pageParam;
    }

    if (this.isAuthenticated) {
      await this.resolvePropertyId();
    }
  }

  componentDidLoad() {
    if (this.tabsTrackRef) {
      this.tabsTrackRef.addEventListener('scroll', () => this.updateScrollState(), { passive: true });
      this.resizeObserver = new ResizeObserver(() => this.updateScrollState());
      this.resizeObserver.observe(this.tabsTrackRef);
      this.updateScrollState();
    }
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
  }

  @Watch('p')
  handlePChange() {
    this.inputValue = this.p;
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.isAuthenticated = true;
      this.ApiClient.setApiClient(this.ticket);
    }
  }

  private generateDates() {
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const _FROM_DATE = today.toISOString().substring(0, 10);
    today.setDate(today.getDate() + 60);
    const _TO_DATE = today.toISOString().substring(0, 10);
    this.dates = { from_date: _FROM_DATE, to_date: _TO_DATE };
  }

  private updateScrollState() {
    if (!this.tabsTrackRef) return;
    const { scrollLeft, scrollWidth, clientWidth } = this.tabsTrackRef;
    // An RTL scroller reports `scrollLeft` as <= 0, so normalise it to a distance travelled
    // from the inline start; the two arrows are "earlier"/"later", not physical sides.
    const inlineOffset = Math.abs(scrollLeft);
    this.canScrollTowardsStart = inlineOffset > 2;
    this.canScrollTowardsEnd = inlineOffset + clientWidth < scrollWidth - 2;
  }

  private scrollTabs(towards: 'start' | 'end') {
    // `scrollBy` still takes a physical x delta, and the inline axis points the other way in RTL.
    this.tabsTrackRef?.scrollBy({ left: 240 * inlineSign() * (towards === 'end' ? 1 : -1), behavior: 'smooth' });
  }

  private readonly validPages = new Set<SecureScreens>([
    'dashboard',
    'hk',
    'tasks',
    'daily-revenue',
    'arrivals',
    'departures',
    'front',
    'users',
    'email-logs',
    'country-sales',
    'daily-occupancy',
    'booking-listing',
    'channel-sales',
    'city-ledger',
    'agents',
    'channels',
    'tax-services',
    'extra-services',
    'payment-options',
    'meal-report',
    'ghs',
    'fiscal-documents',
    'uninvoiced-bookings',
  ]);

  private isValidPage(value: string): value is SecureScreens {
    return this.validPages.has(value as SecureScreens);
  }

  private navigateTo(page: SecureScreens) {
    this.currentPage = page;
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);
    window.history.pushState({}, '', url);
  }

  private routeGroups: { routes: { name: string; value: SecureScreens }[] }[] = [
    {
      routes: [
        { name: 'GHS', value: 'ghs' },
        { name: 'Meal Report', value: 'meal-report' },
      ],
    },
    {
      routes: [
        { name: 'Dashboard', value: 'dashboard' },
        { name: 'Front Desk', value: 'front' },
        { name: 'Arrivals', value: 'arrivals' },
        { name: 'Departures', value: 'departures' },
        { name: 'Tasks', value: 'tasks' },
        { name: 'Housekeeping', value: 'hk' },
      ],
    },
    {
      routes: [
        { name: 'Daily Revenue', value: 'daily-revenue' },
        { name: 'Occupancy', value: 'daily-occupancy' },
        { name: 'Country Sales', value: 'country-sales' },
        { name: 'Channel Sales', value: 'channel-sales' },
        { name: 'Booking Listing', value: 'booking-listing' },
        { name: 'Fiscal Documents', value: 'fiscal-documents' },
        { name: 'Uninvoiced Bookings', value: 'uninvoiced-bookings' },
        { name: 'Email Logs', value: 'email-logs' },
      ],
    },
    {
      routes: [
        { name: 'Users', value: 'users' },
        { name: 'Agents', value: 'agents' },
        { name: 'City Ledger', value: 'city-ledger' },
        { name: 'Channels', value: 'channels' },
        { name: 'Tax & Services', value: 'tax-services' },
        { name: 'Extra Services', value: 'extra-services' },
        { name: 'Payment Options', value: 'payment-options' },
      ],
    },
  ];

  private async resolvePropertyId() {
    if (this.propertyid) {
      this.isLoading = false;
    } else if (this.p) {
      const propertyService = new PropertyService();
      await propertyService.getExposedProperty({ aname: this.p, id: 42, language: LocaleController.language });
      this.propertyid = calendar_data?.property?.id;
      this.isLoading = false;
    }
  }

  private async handleAuthFinish(e: CustomEvent) {
    const ApiClient = e.detail.ApiClient;
    this.ApiClient.setApiClient(ApiClient);
    this.isAuthenticated = true;
    manageAnchorSession({ login: { method: 'direct', isLoggedIn: true, ApiClient } });
    await this.resolvePropertyId();
  }

  private logout() {
    sessionStorage.removeItem('backend_anchor');
    window.location.reload();
  }

  render() {
    if (!this.isAuthenticated)
      return (
        <Host>
          <ir-login onAuthFinish={this.handleAuthFinish.bind(this)}></ir-login>
        </Host>
      );
    if (this.isLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    return (
      <div class="main__container">
        <header class="secure-header">
          {/* ── Top bar ── */}
          <div class="secure-header__topbar">
            <div class="secure-header__brand">
              <div class="secure-header__brand-icon">
                <img src="https://x.igloorooms.com/app-assets/images/portrait/small/avatar-s-19.png" alt="" />
              </div>
              <span class="secure-header__brand-name">IglooRooms</span>
            </div>

            <div class="secure-header__controls">
              {calendar_data?.property && (
                <Fragment>
                  <ir-booking-new-form ticket={this.ApiClient.getToken()} propertyid={calendar_data?.property?.id?.toString()} language={this.language}>
                    <ir-custom-button slot="trigger" id="add-booking-btn" size="s" appearance="plain" variant="brand">
                      <wa-icon name="plus" style={{ fontSize: '1.2rem' }}></wa-icon>
                    </ir-custom-button>
                  </ir-booking-new-form>
                  <div class="secure-header__sep" role="separator"></div>
                </Fragment>
              )}

              <form
                class="secure-header__aname-form"
                onSubmit={e => {
                  e.preventDefault();
                  if (this.inputValue) {
                    const url = new URL(window.location.href);
                    url.searchParams.set('aname', this.inputValue);
                    window.history.pushState({}, '', url);
                  }
                  this.logout();
                }}
              >
                <ir-input
                  class="secure-header__aname-input"
                  size="s"
                  pill
                  value={this.inputValue}
                  placeholder="Property"
                  aria-label="Property AName"
                  onText-change={e => (this.inputValue = e.detail)}
                >
                  <wa-icon slot="start" name="building" aria-hidden="true"></wa-icon>
                  <button slot="end" class="secure-header__aname-save" type="submit" aria-label="Save property">
                    <wa-icon class="ir-flip-rtl" name="arrow-right"></wa-icon>
                  </button>
                </ir-input>
              </form>

              <div class="secure-header__sep" role="separator"></div>

              <wa-tooltip for="secure-logout-btn" placement="bottom">
                Sign out
              </wa-tooltip>
              <wa-button id="secure-logout-btn" size="s" appearance="plain" variant="neutral" pill aria-label="Sign out" onClick={() => this.logout()}>
                <wa-icon name="arrow-right-from-bracket"></wa-icon>
              </wa-button>
            </div>
          </div>

          {/* ── Tab bar ── */}
          <nav class="secure-header__tabbar" aria-label="Secure screens navigation">
            <wa-button
              class={`secure-header__scroll-btn${this.canScrollTowardsStart ? '' : ' secure-header__scroll-btn--hidden'}`}
              size="s"
              appearance="plain"
              variant="neutral"
              pill
              aria-label="Scroll tabs to earlier items"
              tabIndex={-1}
              onClick={() => this.scrollTabs('start')}
            >
              <wa-icon class="ir-flip-rtl" name="chevron-left"></wa-icon>
            </wa-button>

            <div
              class="secure-tabs-track"
              ref={el => {
                this.tabsTrackRef = el as HTMLElement;
              }}
            >
              <ul class="secure-tabs" role="tablist">
                {this.routeGroups.map((group, gi) => [
                  gi > 0 && <li class="secure-tabs__sep" role="none" aria-hidden="true"></li>,
                  ...group.routes.map(route => (
                    <li key={route.value} class="secure-tabs__item" role="none">
                      <button
                        type="button"
                        role="tab"
                        class={{ 'secure-tabs__btn': true, 'active': this.currentPage === route.value }}
                        aria-selected={this.currentPage === route.value ? 'true' : 'false'}
                        onClick={() => this.navigateTo(route.value)}
                      >
                        {route.name}
                      </button>
                    </li>
                  )),
                ])}
              </ul>
            </div>

            <wa-button
              class={`secure-header__scroll-btn${this.canScrollTowardsEnd ? '' : ' secure-header__scroll-btn--hidden'}`}
              size="s"
              appearance="plain"
              variant="neutral"
              pill
              aria-label="Scroll tabs to later items"
              tabIndex={-1}
              onClick={() => this.scrollTabs('end')}
            >
              <wa-icon class="ir-flip-rtl" name="chevron-right"></wa-icon>
            </wa-button>
          </nav>
        </header>
        <div class="ir-page__container" style={{ padding: '0' }}>
          <ir-locale-switcher placement="bottom-end"></ir-locale-switcher>
          {this.renderPage()}
        </div>
      </div>
    );
  }

  renderPage() {
    switch (this.currentPage) {
      case 'dashboard':
        return <ir-dashboard p={this.p} propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-dashboard>;
      case 'front':
        return (
          <div style={{ flex: '1 1 0%', display: 'block' }}>
            <igloo-calendar
              currencyName="USD"
              propertyid={this.propertyid}
              p={this.p}
              ticket={this.ApiClient.getToken()}
              from_date={this.dates.from_date}
              to_date={this.dates.to_date}
              language={this.language}
            ></igloo-calendar>
          </div>
        );
      case 'arrivals':
        return <ir-arrivals p={this.p} language={this.language} propertyid={this.propertyid} ticket={this.ApiClient.getToken()}></ir-arrivals>;
      case 'departures':
        return <ir-departures p={this.p} language={this.language} propertyid={this.propertyid} ticket={this.ApiClient.getToken()}></ir-departures>;
      case 'tasks':
        return <ir-hk-tasks p={this.p} propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-hk-tasks>;
      case 'hk':
        return <ir-housekeeping p={this.p} propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-housekeeping>;
      case 'daily-revenue':
        return <ir-daily-revenue p={this.p} propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-daily-revenue>;
      case 'daily-occupancy':
        return <ir-monthly-bookings-report p={this.p} propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-monthly-bookings-report>;
      case 'country-sales':
        return <ir-sales-by-country p={this.p} propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-sales-by-country>;
      case 'channel-sales':
        return <ir-sales-by-channel mode="property" language={this.language} propertyid={this.propertyid.toString()} ticket={this.ApiClient.getToken()}></ir-sales-by-channel>;
      case 'booking-listing':
        return <ir-booking-listing p={this.p} language={this.language} propertyid={this.propertyid} ticket={this.ApiClient.getToken()}></ir-booking-listing>;
      case 'email-logs':
        return <ir-booking-email-logs ticket={this.ApiClient.getToken()}></ir-booking-email-logs>;
      case 'users':
        return <ir-user-management userTypeCode={5} p={this.p} propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-user-management>;
      case 'agents':
        return <ir-agents style={{ gap: '1.5rem' }} p={this.p} language={this.language} propertyid={this.propertyid} ticket={this.ApiClient.getToken()}></ir-agents>;
      case 'city-ledger':
        return <ir-city-ledger p={this.p} language={this.language} propertyid={this.propertyid} ticket={this.ApiClient.getToken()}></ir-city-ledger>;
      case 'channels':
        return <ir-channel p={this.p} propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-channel>;
      case 'tax-services':
        return <ir-tax-service-categories p={this.p} propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-tax-service-categories>;
      case 'extra-services':
        return <ir-extra-services-settings p={this.p} propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-extra-services-settings>;
      case 'payment-options':
        return <ir-payment-option p={this.p} propertyid={this.propertyid.toString()} language={this.language} ticket={this.ApiClient.getToken()}></ir-payment-option>;
      case 'ghs':
        return <ir-ghs-onboarding ticket={this.ApiClient.getToken()}></ir-ghs-onboarding>;
      case 'meal-report':
        return <ir-meal-report propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-meal-report>;
      case 'fiscal-documents':
        return <ir-fiscal-documents p={this.p} propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-fiscal-documents>;
      case 'uninvoiced-bookings':
        return <ir-uninvoiced-bookings p={this.p} propertyid={this.propertyid} language={this.language} ticket={this.ApiClient.getToken()}></ir-uninvoiced-bookings>;
      default:
        return null;
    }
  }
}
