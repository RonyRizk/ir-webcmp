import { Component, h, Prop, Event, EventEmitter } from '@stencil/core';
import { ICountry } from '../../models/IBooking';
import { t } from '@/services/locale/t';

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
            <h4 class="ir-ghs-filters__title">{t('Lcz_Filters', { fallback: 'Filters' })}</h4>
          </div>
        </div>

        <div class="ir-ghs-filters__body">
          <div class="ir-ghs-filters__group">
            <label class="ir-ghs-filters__label">{t('Lcz_Countries', { fallback: 'Countries' })}</label>
            <wa-select
              size="s"
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
              <wa-option value="">{t('Lcz_ShowAllCountries', { fallback: 'Show all countries' })}</wa-option>
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
              size="s"
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
              {t('Lcz_Reset', { fallback: 'Reset' })}
            </ir-custom-button>
            <ir-custom-button
              type="button"
              size="s"
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
              {t('Lcz_Apply', { fallback: 'Apply' })}
            </ir-custom-button>
          </div>
          <span id="ghs-help-icon" style={{ cursor: 'pointer', display: 'inline-flex', marginInlineStart: 'auto' }}>
            <wa-icon name="circle-info" style={{ fontSize: '18px', color: 'var(--wa-color-brand-fill)' }}></wa-icon>
          </span>
          <wa-popover for="ghs-help-icon" placement="right">
            <div
              style={{
                padding: 'var(--wa-space-m)',
                background: 'var(--wa-color-neutral-0)',
                border: '1px solid var(--wa-color-neutral-200)',
                borderRadius: 'var(--wa-border-radius-m)',
                boxShadow: 'var(--wa-shadow-m)',
                maxWidth: '500px',
                width: 'auto',
                textAlign: 'start',
                zIndex: '9999',
              }}
            >
              <h6
                style={{
                  color: 'var(--wa-color-brand-fill)',
                  fontSize: '15px',
                  fontWeight: 'var(--wa-font-weight-bold)',
                  borderBottom: '1px solid var(--wa-color-neutral-200)',
                  paddingBottom: 'var(--wa-space-xs)',
                  marginBottom: 'var(--wa-space-m)',
                  marginTop: '0',
                }}
              >
                {t('Lcz_GoogleHotelsOnboardingWorkflowGuide', { fallback: 'Google Hotels Onboarding Workflow Guide' })}
              </h6>
              <ul style={{ listStyleType: 'disc', fontSize: '13px', lineHeight: '1.6', paddingInlineStart: 'var(--wa-space-l)', marginBottom: '0' }}>
                <li style={{ marginBottom: 'var(--wa-space-s)' }}>
                  {t('Lcz_GhsStep1Selection', {
                    fallback: 'Step 1 - Selection: Select candidate properties and click Generate request to download the onboarding XML listing.',
                  })}
                </li>
                <li style={{ marginBottom: 'var(--wa-space-s)' }}>
                  {t('Lcz_GhsStep2Upload', {
                    fallback: 'Step 2 - Upload: Log in to the Google Hotel Center portal and upload the generated XML file to the property feed section.',
                  })}
                </li>
                <li style={{ marginBottom: 'var(--wa-space-s)' }}>
                  {t('Lcz_GhsStep3Processing', { fallback: "Step 3 - Processing: Wait for Google's automated processing confirmation email (this confirms the XML is valid)." })}
                </li>
                <li style={{ marginBottom: 'var(--wa-space-s)' }}>
                  {t('Lcz_GhsStep4Publication', {
                    fallback: 'Step 4 - Publication: Once the confirmation email is received, return to the GHS portal and click Publish to initiate review.',
                  })}
                </li>
                <li style={{ marginBottom: 'var(--wa-space-s)' }}>
                  {t('Lcz_GhsStep5FinalApproval', {
                    fallback: 'Step 5 - Final Approval: Wait 1-2 working days for Google to complete the manual verification and approval process.',
                  })}
                </li>
                <li>
                  {t('Lcz_GhsStep6LiveSyncFull', {
                    fallback: 'Step 6 - Live Sync: Only enable the "GOOGLE_HOTEL_ENABLED" flag in IR after you have received final approval from Google.',
                  })}
                </li>
              </ul>
            </div>
          </wa-popover>
        </div>
      </wa-card>
    );
  }
}
