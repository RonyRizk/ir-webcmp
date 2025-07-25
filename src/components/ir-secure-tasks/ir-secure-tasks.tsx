import Token from '@/models/Token';
import { checkUserAuthState, manageAnchorSession } from '@/utils/utils';
import { Component, Host, Prop, State, Watch, h } from '@stencil/core';
export type SecureScreens = 'hk' | 'tasks' | 'front' | 'users' | 'country-sales' | 'daily-occupancy';
@Component({
  tag: 'ir-secure-tasks',
  styleUrl: 'ir-secure-tasks.css',
  shadow: false,
})
export class IrSecureTasks {
  @Prop() propertyid: number;
  @Prop() p: string;
  @Prop() bookingNumber: string;
  @Prop() ticket: string;

  @State() isAuthenticated: boolean = false;
  @State() currentPage: SecureScreens;
  @State() inputValue: string;

  private token = new Token();
  private dates: any = {};

  componentWillLoad() {
    const isAuthenticated = checkUserAuthState();

    this.generateDates();
    if (this.ticket) {
      this.isAuthenticated = true;
      this.token.setToken(this.ticket);
      this.propertyid = this.propertyid;
    }
    if (isAuthenticated) {
      this.isAuthenticated = true;
      this.token.setToken(isAuthenticated.token);
    }
    this.inputValue = this.p;
  }
  @Watch('p')
  handlePChange() {
    this.inputValue = this.p;
  }
  @Watch('ticket')
  handleTicketChange(newValue, oldValue) {
    if (newValue !== oldValue) {
      this.isAuthenticated = true;
      this.token.setToken(this.ticket);
      this.propertyid = this.propertyid;
    }
  }
  private generateDates() {
    var today = new Date();
    today.setDate(today.getDate() - 1);
    var _FROM_DATE = today.toISOString().substring(0, 10);
    today.setDate(today.getDate() + 60);
    var _TO_DATE = today.toISOString().substring(0, 10);

    this.dates = {
      from_date: _FROM_DATE,
      to_date: _TO_DATE,
    };
  }
  private routes: { name: string; value: SecureScreens }[] = [
    { name: 'Housekeepers', value: 'hk' },
    { name: 'Tasks', value: 'tasks' },
    { name: 'Front', value: 'front' },
    { name: 'Users', value: 'users' },
    { name: 'Sales By Country', value: 'country-sales' },
    { name: 'Daily Occupancy', value: 'daily-occupancy' },
  ];
  private handleAuthFinish(e: CustomEvent) {
    const token = e.detail.token;
    this.token.setToken(token);
    this.isAuthenticated = true;
    manageAnchorSession({ login: { method: 'direct', isLoggedIn: true, token } });
  }
  render() {
    if (!this.isAuthenticated)
      return (
        <Host>
          <ir-login onAuthFinish={this.handleAuthFinish.bind(this)}></ir-login>
        </Host>
      );
    return (
      <Host>
        <div class="px-1 nav flex-column flex-sm-row d-flex align-items-center justify-content-between">
          <div class="d-flex  align-items-center">
            <div class="d-flex align-items-center p-0 m-0" style={{ gap: '0.5rem' }}>
              <h4 class="m-0 p-0">AName: </h4>
              <form
                class="input-group"
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
                <input
                  type="text"
                  value={this.inputValue}
                  onInput={e => (this.inputValue = (e.target as HTMLInputElement).value)}
                  style={{ maxWidth: '60px' }}
                  class="form-control"
                  placeholder="AName"
                  aria-label="AName"
                  aria-describedby="button-save"
                ></input>
                <div class="input-group-append">
                  <button class="btn btn-sm btn-outline-secondary" type="submit" id="button-save">
                    save
                  </button>
                </div>
              </form>
            </div>
            <ul class="nav  m-0 p-0">
              {this.routes.map(route => (
                <li key={route.name} class=" nav-item">
                  <a
                    class={{ 'nav-link': true, 'active': this.currentPage === route.value }}
                    href="#"
                    onClick={() => {
                      this.currentPage = route.value;
                    }}
                  >
                    {route.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <button
            class="btn btn-sm btn-primary"
            onClick={() => {
              this.logout();
            }}
          >
            Logout
          </button>
        </div>
        {this.renderPage()}
      </Host>
    );
  }
  private logout() {
    sessionStorage.removeItem('backend_anchor');
    window.location.reload();
  }
  renderPage() {
    switch (this.currentPage) {
      case 'tasks':
        return <ir-hk-tasks p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-hk-tasks>;

      case 'front':
        return (
          <igloo-calendar
            currencyName="USD"
            propertyid={this.propertyid}
            p={this.p}
            ticket={this.token.getToken()}
            from_date={this.dates.from_date}
            to_date={this.dates.to_date}
            language="en"
          ></igloo-calendar>
        );
      case 'hk':
        return <ir-housekeeping p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-housekeeping>;
      case 'users':
        return <ir-user-management userTypeCode={5} p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-user-management>;
      case 'country-sales':
        return <ir-sales-by-country p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-sales-by-country>;
      case 'daily-occupancy':
        return <ir-monthly-bookings-report p={this.p} propertyid={this.propertyid} language="en" ticket={this.token.getToken()}></ir-monthly-bookings-report>;

      default:
        return null;
    }
  }
}
