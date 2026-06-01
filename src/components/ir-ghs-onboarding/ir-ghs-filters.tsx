import { Component, h, Prop, Event, EventEmitter } from '@stencil/core';
import { ICountry } from '../../models/IBooking';

@Component({
  tag: 'ir-ghs-filters',
  styleUrl: 'ir-ghs-filters.css',
  scoped: true,
})
export class IrGhsFilters {
  @Prop() countries: ICountry[] = [];
  @Prop() selectedCountryId: number | null = null;
  @Prop() isLoading: boolean = false;

  @Event() filterApply: EventEmitter<void>;
  @Event() filterReset: EventEmitter<void>;
  @Event() countryChange: EventEmitter<number | null>;

  render() {
    return (
      <wa-card class="ir-ghs-filters__container">
        <div slot="header" class="ir-ghs-filters__header">
          <div class="ir-ghs-filters__header-content">
            <wa-icon name="filter" style={{ fontSize: '18px' }}></wa-icon>
            <h4 class="ir-ghs-filters__title">Filters</h4>
          </div>
        </div>

        <div class="ir-ghs-filters__body">
          <div class="ir-ghs-filters__group">
            <label class="ir-ghs-filters__label">Countries</label>
            <wa-select 
              size="small"
              value={this.selectedCountryId?.toString() || ''}
              defaultValue={this.selectedCountryId?.toString() || ''}
              onwa-hide={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
              }}
              onchange={(e: Event) => {
                const val = (e.target as HTMLSelectElement).value;
                this.countryChange.emit(val ? parseInt(val, 10) : null);
              }}
            >
              <wa-option value="">Show all countries</wa-option>
              {this.countries.map(c => (
                <wa-option value={c.id.toString()}>{c.name}</wa-option>
              ))}
            </wa-select>
          </div>
        </div>

        <div slot="footer" class="ir-ghs-filters__footer">
            <div class="d-flex align-items-center gap-2">
                <ir-custom-button 
                type="button"
                size="small" 
                variant="neutral" 
                appearance="filled"
                class="ir-ghs-filters__reset-btn"
                onClickHandler={(e: CustomEvent) => {
                    const ev = e.detail as MouseEvent;
                    if (ev && typeof ev.preventDefault === 'function') {
                        ev.preventDefault();
                        ev.stopPropagation();
                    }
                    this.filterReset.emit();
                }} 
                disabled={this.isLoading}
                >
                Reset
                </ir-custom-button>
                <ir-custom-button 
                type="button"
                size="small" 
                variant="brand" 
                appearance="accent"
                loading={this.isLoading}
                onClickHandler={(e: CustomEvent) => {
                    const ev = e.detail as MouseEvent;
                    if (ev && typeof ev.preventDefault === 'function') {
                        ev.preventDefault();
                        ev.stopPropagation();
                    }
                    this.filterApply.emit();
                }} 
                >
                Apply
                </ir-custom-button>
            </div>
            <span id="ghs-help-icon" style={{ cursor: 'pointer', display: 'inline-flex', marginLeft: 'auto' }}>
                <wa-icon name="circle-info" style={{ fontSize: '18px', color: 'var(--wa-color-brand-fill)' }}></wa-icon>
            </span>
            <wa-popover
                for="ghs-help-icon"
                placement="right"
            >
                <div style={{ padding: 'var(--wa-space-m)', background: 'var(--wa-color-neutral-0)', border: '1px solid var(--wa-color-neutral-200)', borderRadius: 'var(--wa-border-radius-m)', boxShadow: 'var(--wa-shadow-m)', maxWidth: '500px', width: 'auto', textAlign: 'left', zIndex: '9999' }}>
                    <h6 style={{ color: 'var(--wa-color-brand-fill)', fontSize: '15px', fontWeight: 'var(--wa-font-weight-bold)', borderBottom: '1px solid var(--wa-color-neutral-200)', paddingBottom: 'var(--wa-space-xs)', marginBottom: 'var(--wa-space-m)', marginTop: '0' }}>Google Hotels Onboarding Workflow Guide</h6>
                    <ul style={{ listStyleType: 'disc', fontSize: '13px', lineHeight: '1.6', paddingInlineStart: 'var(--wa-space-l)', marginBottom: '0' }}>
                    <li style={{ marginBottom: 'var(--wa-space-s)' }}><b>Step 1 - Selection:</b> Select candidate properties and click <b>Generate request</b> to download the onboarding XML listing.</li>
                    <li style={{ marginBottom: 'var(--wa-space-s)' }}><b>Step 2 - Upload:</b> Log in to the <b>Google Hotel Center</b> portal and upload the generated XML file to the property feed section.</li>
                    <li style={{ marginBottom: 'var(--wa-space-s)' }}><b>Step 3 - Processing:</b> Wait for Google's automated processing confirmation email (this confirms the XML is valid).</li>
                    <li style={{ marginBottom: 'var(--wa-space-s)' }}><b>Step 4 - Publication:</b> Once the confirmation email is received, return to the GHS portal and click <b>Publish</b> to initiate review.</li>
                    <li style={{ marginBottom: 'var(--wa-space-s)' }}><b>Step 5 - Final Approval:</b> Wait <b>1-2 working days</b> for Google to complete the manual verification and approval process.</li>
                    <li><b>Step 6 - Live Sync:</b> Only enable the "GOOGLE_HOTEL_ENABLED" flag in IR <b>after</b> you have received final approval from Google.</li>
                    </ul>
                </div>
            </wa-popover>
        </div>
      </wa-card>
    );
  }
}
