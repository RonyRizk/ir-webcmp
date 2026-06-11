import Token from '@/models/Token';
import { PropertyService } from '@/services/property.service';
import calendar_data from '@/stores/calendar-data';
import { checkUserAuthState, manageAnchorSession } from '@/utils/utils';
import { Component, Element, Host, Prop, State, Watch, h } from '@stencil/core';

export type SecureScreens =
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
  | 'payment-options'
  | 'ghs'
  | 'meal-report';

@Component({
  tag: 'ir-secure-tasks',
  styleUrl: 'ir-secure-tasks.css',
  shadow: false,
})
export class IrSecureTasks {
  @Element() el: HTMLElement;

  @Prop({ mutable: true }) propertyid: number;
  @Prop() p: string;
  @Prop() bookingNumber: string;
  @Prop() ticket: string;

  @State() isAuthenticated: boolean = false;
  @State() currentPage: SecureScreens = 'front';
  @State() inputValue: string;
  @State() canScrollLeft: boolean = false;
  @State() canScrollRight: boolean = true;
  @State() isLoading = true;

  private token = new Token();
  private dates: any = {};
  private tabsTrackRef: HTMLElement;
  private resizeObserver: ResizeObserver;

  async componentWillLoad() {
    const isAuthenticated = checkUserAuthState();
    this.generateDates();
    if (this.ticket) {
      this.isAuthenticated = true;
      this.token.setToken(this.ticket);
    }
    if (isAuthenticated) {
      this.isAuthenticated = true;
      this.token.setToken(isAuthenticated.token);
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
      this.token.setToken(this.ticket);
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
    this.canScrollLeft = scrollLeft > 2;
    this.canScrollRight = scrollLeft + clientWidth < scrollWidth - 2;
  }

  private scrollTabs(dir: 'left' | 'right') {
    this.tabsTrackRef?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
  }

  private readonly validPages = new Set<SecureScreens>([
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
    'payment-options',
    'meal-report',
    'ghs',
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
        { name: 'Meal report', value: 'meal-report' },
      ],
    },
    {
      routes: [
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
        { name: 'Payment Options', value: 'payment-options' },
      ],
    },
  ];

  private async resolvePropertyId() {
    if (this.propertyid) {
      this.isLoading = false;
    } else if (this.p) {
      const propertyService = new PropertyService();
      await propertyService.getExposedProperty({ aname: this.p, id: 42, language: 'en' });
      this.propertyid = calendar_data?.property?.id;
      this.isLoading = false;
    }
  }

  private async handleAuthFinish(e: CustomEvent) {
    const token = e.detail.token;
    this.token.setToken(token);
    this.isAuthenticated = true;
    manageAnchorSession({ login: { method: 'direct', isLoggedIn: true, token } });
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
                  size="small"
                  pill
                  value={this.inputValue}
                  placeholder="Property"
                  aria-label="Property AName"
                  onText-change={e => (this.inputValue = e.detail)}
                >
                  <wa-icon slot="start" name="building" aria-hidden="true"></wa-icon>
                  <button slot="end" class="secure-header__aname-save" type="submit" aria-label="Save property">
                    <wa-icon name="arrow-right"></wa-icon>
                  </button>
                </ir-input>
              </form>

              <div class="secure-header__sep" role="separator"></div>

              <wa-tooltip for="secure-logout-btn" placement="bottom">
                Sign out
              </wa-tooltip>
              <wa-button id="secure-logout-btn" size="small" appearance="plain" variant="neutral" pill aria-label="Sign out" onClick={() => this.logout()}>
                <wa-icon name="arrow-right-from-bracket"></wa-icon>
              </wa-button>
            </div>
          </div>

          {/* ── Tab bar ── */}
          <nav class="secure-header__tabbar" aria-label="Secure screens navigation">
            <wa-button
              class={`secure-header__scroll-btn${this.canScrollLeft ? '' : ' secure-header__scroll-btn--hidden'}`}
              size="small"
              appearance="plain"
              variant="neutral"
              pill
              aria-label="Scroll tabs left"
              tabIndex={-1}
              onClick={() => this.scrollTabs('left')}
            >
              <wa-icon name="chevron-left"></wa-icon>
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
              class={`secure-header__scroll-btn${this.canScrollRight ? '' : ' secure-header__scroll-btn--hidden'}`}
              size="small"
              appearance="plain"
              variant="neutral"
              pill
              aria-label="Scroll tabs right"
              tabIndex={-1}
              onClick={() => this.scrollTabs('right')}
            >
              <wa-icon name="chevron-right"></wa-icon>
            </wa-button>
          </nav>
        </header>
        <div class="ir-page__container" style={{ padding: '0' }}>
          {this.renderPage()}
        </div>
      </div>
    );
  }

  renderPage() {
    switch (this.currentPage) {
      case 'front':
        return (
          <div style={{ flex: '1 1 0%', display: 'block' }}>
            <igloo-calendar
              currencyName="USD"
              propertyid={this.propertyid}
              p={this.p}
              ticket={this.token.getToken()}
              from_date={this.dates.from_date}
              to_date={this.dates.to_date}
              language="en"
            ></igloo-calendar>
          </div>
        );
      case 'arrivals':
        return <ir-arrivals p={this.p} language="en" propertyid={this.propertyid} ticket={this.token.getToken()}></ir-arrivals>;
      case 'departures':
        return <ir-departures p={this.p} language="en" propertyid={this.propertyid} ticket={this.token.getToken()}></ir-departures>;
      case 'tasks':
        return <ir-hk-tasks p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-hk-tasks>;
      case 'hk':
        return <ir-housekeeping p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-housekeeping>;
      case 'daily-revenue':
        return <ir-daily-revenue p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-daily-revenue>;
      case 'daily-occupancy':
        return <ir-monthly-bookings-report p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-monthly-bookings-report>;
      case 'country-sales':
        return <ir-sales-by-country p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-sales-by-country>;
      case 'channel-sales':
        return <ir-sales-by-channel language="en" propertyid={this.propertyid.toString()} ticket={this.token.getToken()}></ir-sales-by-channel>;
      case 'booking-listing':
        return <ir-booking-listing p={this.p} language="en" propertyid={this.propertyid} ticket={this.token.getToken()}></ir-booking-listing>;
      case 'email-logs':
        return <ir-booking-email-logs ticket={this.token.getToken()}></ir-booking-email-logs>;
      case 'users':
        return <ir-user-management userTypeCode={5} p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-user-management>;
      case 'agents':
        return <ir-agents style={{ gap: '1.5rem' }} p={this.p} language="en" propertyid={this.propertyid} ticket={this.token.getToken()}></ir-agents>;
      case 'city-ledger':
        return <ir-city-ledger p={this.p} language="en" propertyid={this.propertyid} ticket={this.token.getToken()}></ir-city-ledger>;
      case 'channels':
        return <ir-channel p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-channel>;
      case 'tax-services':
        return <ir-tax-service-categories p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-tax-service-categories>;
      case 'payment-options':
        return <ir-payment-option p={this.p} propertyid={this.propertyid.toString()} language="en" ticket={this.token.getToken()}></ir-payment-option>;
      case 'ghs':
        return <ir-ghs-onboarding ticket={this.token.getToken()}></ir-ghs-onboarding>;
      case 'meal-report':
        return <ir-meal-report propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-meal-report>;
      default:
        return null;
    }
  }
}
