import { Component, h, Prop, Event, EventEmitter } from '@stencil/core';
import { ICountry } from '../../models/IBooking';

@Component({
  tag: 'ir-ghs-filters',
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
      <div class="card mb-0 p-1 d-flex flex-column shadow-sm border" style={{ width: '280px', flexShrink: '0' }}>
        <div class="d-flex align-items-center justify-content-between p-2 border-bottom mb-2">
          <div class="d-flex align-items-center" style={{ gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" height={18} width={18}>
              <path
                fill="currentColor"
                d="M3.9 54.9C10.5 40.9 24.5 32 40 32l432 0c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9 320 448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6l0-79.1L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z"
              />
            </svg>
            <h4 class="m-0 p-0 flex-grow-1 font-weight-bold" style={{ fontSize: '13px' }}>Filters</h4>
            <ir-popover
                placement="right"
                trigger="click"
                renderContentAsHtml={true}
                content={`
                  <div class="p-3 shadow-sm border rounded bg-white text-dark" style="width: 600px; text-align: left; z-index: 9999;">
                    <h6 class="fw-bold border-bottom pb-2 mb-3" style="color: var(--wa-color-brand-fill); font-size: 15px;">Google Hotels Onboarding Workflow Guide</h6>
                    <ul class="ps-3 mb-0" style="list-style-type: disc; font-size: 13px; line-height: 1.8;">
                      <li class="mb-2"><b>Step 1 - Selection:</b> Select candidate properties and click <b>Generate request</b> to download the onboarding XML listing.</li>
                      <li class="mb-2"><b>Step 2 - Upload:</b> Log in to the <b>Google Hotel Center</b> portal and upload the generated XML file to the property feed section.</li>
                      <li class="mb-2"><b>Step 3 - Processing:</b> Wait for Google's automated processing confirmation email (this confirms the XML is valid).</li>
                      <li class="mb-2"><b>Step 4 - Publication:</b> Once the confirmation email is received, return to the GHS portal and click <b>Publish</b> to initiate review.</li>
                      <li class="mb-2"><b>Step 5 - Final Approval:</b> Wait <b>1-2 working days</b> for Google to complete the manual verification and approval process.</li>
                      <li><b>Step 6 - Live Sync:</b> Only enable the "GOOGLE_HOTEL_ENABLED" flag in IR <b>after</b> you have received final approval from Google.</li>
                    </ul>
                  </div>
                `}
              >
                 <span style={{ cursor: 'pointer', display: 'inline-flex' }}>
                    <wa-icon name="circle-info" style={{ fontSize: '18px', color: 'var(--wa-color-brand-fill)' }}></wa-icon>
                 </span>
              </ir-popover>
          </div>
        </div>

        <div class="p-2 d-flex flex-column" style={{ gap: '1.25rem' }}>
          <div class="filter-group m-0 p-0 border-0">
            <label class="mb-2 d-block small font-weight-bold text-dark">Countries</label>
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

          <div class="d-flex align-items-center justify-content-end pt-3 border-top filter-actions">
            <ir-custom-button 
              type="button"
              size="small" 
              variant="neutral" 
              appearance="filled"
              style={{ display: 'inline-block', marginRight: '1rem' }}
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
        </div>
      </div>
    );
  }
}
