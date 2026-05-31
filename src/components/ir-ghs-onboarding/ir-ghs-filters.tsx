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
      <div class="ir-ghs-filters__container">
        <div class="ir-ghs-filters__header">
          <div class="ir-ghs-filters__header-content">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" height={18} width={18}>
              <path
                fill="currentColor"
                d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z"
              />
            </svg>
            <h4 class="ir-ghs-filters__title">Filters</h4>
          </div>
        </div>

        <div class="ir-ghs-filters__body">
          <div class="ir-ghs-filters__group">
            <label class="ir-ghs-filters__label">Countries</label>
            <ir-select 
              size="sm"
              showFirstOption={true}
              firstOption="Show all countries"
              selectedValue={this.selectedCountryId?.toString() || ''}
              data={this.countries.map(c => ({ value: c.id.toString(), text: c.name }))}
              onSelectChange={(e: CustomEvent) => {
                this.countryChange.emit(e.detail ? parseInt(e.detail, 10) : null);
              }}
            ></ir-select>
          </div>

          <div class="ir-ghs-filters__footer">
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
                <ir-popover
                    placement="right"
                    trigger="click"
                    renderContentAsHtml={true}
                    content={`
                    <div style="padding: var(--wa-space-m); background: var(--wa-color-neutral-0); border: 1px solid var(--wa-color-neutral-200); border-radius: var(--wa-border-radius-m); box-shadow: var(--wa-shadow-m); width: 600px; text-align: left; z-index: 9999;">
                        <h6 style="color: var(--wa-color-brand-fill); font-size: 15px; font-weight: var(--wa-font-weight-bold); border-bottom: 1px solid var(--wa-color-neutral-200); padding-bottom: var(--wa-space-xs); margin-bottom: var(--wa-space-m);">Google Hotels Onboarding Workflow Guide</h6>
                        <ul style="list-style-type: disc; font-size: 13px; line-height: 1.8; padding-inline-start: var(--wa-space-m); margin-bottom: 0;">
                        <li style="margin-bottom: var(--wa-space-xs);"><b>Step 1 - Selection:</b> Select candidate properties and click <b>Generate request</b> to download the onboarding XML listing.</li>
                        <li style="margin-bottom: var(--wa-space-xs);"><b>Step 2 - Upload:</b> Log in to the <b>Google Hotel Center</b> portal and upload the generated XML file to the property feed section.</li>
                        <li style="margin-bottom: var(--wa-space-xs);"><b>Step 3 - Processing:</b> Wait for Google's automated processing confirmation email (this confirms the XML is valid).</li>
                        <li style="margin-bottom: var(--wa-space-xs);"><b>Step 4 - Publication:</b> Once the confirmation email is received, return to the GHS portal and click <b>Publish</b> to initiate review.</li>
                        <li style="margin-bottom: var(--wa-space-xs);"><b>Step 5 - Final Approval:</b> Wait <b>1-2 working days</b> for Google to complete the manual verification and approval process.</li>
                        <li><b>Step 6 - Live Sync:</b> Only enable the "GOOGLE_HOTEL_ENABLED" flag in IR <b>after</b> you have received final approval from Google.</li>
                        </ul>
                    </div>
                    `}
                >
                    <span style={{ cursor: 'pointer', display: 'inline-flex', marginLeft: 'auto' }}>
                        <wa-icon name="circle-info" style={{ fontSize: '18px', color: 'var(--wa-color-brand-fill)' }}></wa-icon>
                    </span>
                </ir-popover>
          </div>
        </div>
      </div>
    );
  }
}
