import { ConnectedHK } from '@/services/housekeeping.service';
import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'ar', label: 'AR' },
  { value: 'el', label: 'EL' },
];

@Component({
  tag: 'ir-hk-staff-tasks-header',
  styleUrl: 'ir-hk-staff-tasks-header.css',
  scoped: true,
})
export class IrHkStaffTasksHeader {
  @Prop() connectedHK: ConnectedHK;
  @Prop() language: string = 'en';

  @Event() languageChanged: EventEmitter<string>;

  private handleWaChange = (e: Event) => {
    const lang = (e.target as any).value as string;
    this.languageChanged.emit(lang);
  };

  render() {
    return (
      <header class="tasks-header">
        <div class="tasks-header__inner">
          <div class="tasks-header__brand">
            <img class="tasks-header__logo" src="https://x.igloorooms.com/app-assets/images/logo/logo-dark.png" alt="IglooRooms logo" />
            <span class="tasks-header__name">{this.connectedHK.NAME}</span>
          </div>
          <div class="tasks-header__actions">
            <wa-select onchange={this.handleWaChange} defaultValue={this.language} value={this.language} size="small">
              {LANGUAGE_OPTIONS.map(opt => (
                <wa-option key={opt.value} value={opt.value}>
                  {opt.label}
                </wa-option>
              ))}
            </wa-select>
            <ir-custom-button onClick={() => (window.location.href = 'Logout.aspx')} variant="danger" appearance="plain">
              <wa-icon name="arrow-right-from-bracket" style={{ fontSize: '1.2rem' }}></wa-icon>
            </ir-custom-button>
          </div>
        </div>
      </header>
    );
  }
}
