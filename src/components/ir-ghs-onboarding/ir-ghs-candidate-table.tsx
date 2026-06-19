import { Component, h, Prop, Event, EventEmitter, State } from '@stencil/core';
import { GHS_Candidate_Property } from '../../services/ghs/types';
import { ICountry } from '../../models/IBooking';
import axios from 'axios';

@Component({
  tag: 'ir-ghs-candidate-table',
  styleUrls: ['ir-ghs-candidate-table.css', '../../common/table.css'],
  scoped: true,
})
export class IrGhsCandidateTable {
  @Prop() properties: GHS_Candidate_Property[] = [];
  @Prop() countries: ICountry[] = [];
  @Prop() selectedCountryId: number | null = null;
  @Prop() selectedProperties: GHS_Candidate_Property[] = [];
  @Prop() propertyToActivate: GHS_Candidate_Property | null = null;
  @Prop() isLoading: boolean = false;
  @Prop() baseUrl: string;

  @State() searchQuery: string = '';

  @Event() toggleSelection: EventEmitter<GHS_Candidate_Property>;
  @Event() toggleAll: EventEmitter<boolean>;
  @Event() activateProperty: EventEmitter<GHS_Candidate_Property>;
  @Event() countryChange: EventEmitter<number | null>;

  private async handlePropertyLinkClick(e: MouseEvent, p: GHS_Candidate_Property) {
    e.preventDefault();
    e.stopPropagation();

    try {
      console.log('Switching context to property:', p.AC_ID);
      const { data } = await axios.post(`${this.baseUrl ?? ''}/Get_Ac_By_AC_ID_Adv`, {
        AC_ID: p.AC_ID,
        Bypass_Caching: true,
        IS_BACK_OFFICE: true,
      });

      if (data.ExceptionMsg) {
        throw new Error(data.ExceptionMsg);
      }

      if (data.My_Result) {
        const propertyJson = JSON.stringify(data.My_Result);
        localStorage.setItem('_Selected_Ac', propertyJson);
        sessionStorage.setItem('_Selected_Ac', propertyJson);
        sessionStorage.setItem('_Page', 'acgeneral.aspx');
        
        console.log('Storage updated. Opening link...');
        window.open(`https://x.igloorooms.com/manage/acgeneral.aspx`, '_blank');
      }
    } catch (error) {
      console.error('Failed to switch property context', error);
      window.open(`https://x.igloorooms.com/manage/acgeneral.aspx`, '_blank');
    }
  }

  render() {
    const selectedIds = this.selectedProperties.map(p => p.AC_ID);
    const allVisibleSelected = this.properties.length > 0 && this.properties.every(p => selectedIds.includes(p.AC_ID));

    return (
      <wa-card class="ir-ghs-candidate-table__container">
         <div slot="header" class="ir-ghs-candidate-table__header">
            <div class="d-flex align-items-center gap-2">
              <h3 class="ir-ghs-candidate-table__title">
                Candidate properties
              </h3>
              <span id="ghs-help-icon" style={{ cursor: 'pointer', display: 'inline-flex' }}>
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
            <div class="ir-ghs-candidate-table__controls">
              <wa-select 
                size="s"
                value={this.selectedCountryId?.toString() || ''}
                defaultValue={this.selectedCountryId?.toString() || ''}
                class="ir-ghs-candidate-table__country-select"
                onwa-hide={e => {
                  e.stopImmediatePropagation();
                  e.stopPropagation();
                }}
                onchange={(e: Event) => {
                  const val = (e.target as HTMLSelectElement).value;
                  this.countryChange.emit(val ? parseInt(val, 10) : null);
                }}
              >
                <wa-option value="">All countries</wa-option>
                {this.countries.map(c => (
                  <wa-option value={c.id.toString()}>{c.name}</wa-option>
                ))}
              </wa-select>
              <div class="ir-ghs-candidate-table__search-wrapper">
                <ir-input 
                    size="s" 
                    placeholder="Search by name or aname..." 
                    value={this.searchQuery}
                    onText-change={(e: CustomEvent) => {
                        this.searchQuery = e.detail;
                    }}
                >
                    <wa-icon name="search" slot="start" style={{ fontSize: '12px' }}></wa-icon>
                </ir-input>
              </div>
            </div>
         </div>

         <div class="ir-ghs-candidate-table__body">
            {this.isLoading && (
              <div class="ir-ghs-candidate-table__loading-overlay">
                  <ir-spinner></ir-spinner>
              </div>
            )}

            <div class="ir-ghs-candidate-table__table-wrapper table--container">
                <table class="ir-ghs-candidate-table__table table align-middle mb-0 w-100" style={{ tableLayout: 'fixed', minWidth: '380px' }}>
                  <thead>
                    <tr class="ir-ghs-candidate-table__header-row table-header">
                      <th class="ir-ghs-candidate-table__header-cell ir-ghs-candidate-table__header-cell--center" style={{ width: '30px' }}>
                        {this.properties.length > 0 && (
                          <div class="ir-ghs-candidate-table__checkbox-wrapper">
                              <wa-checkbox 
                                checked={allVisibleSelected}
                                indeterminate={this.selectedProperties.length > 0 && !allVisibleSelected}
                                onchange={(e) => {
                                    this.toggleAll.emit((e.target as any).checked);
                                }}
                                disabled={this.properties.length === 0}
                              ></wa-checkbox>
                          </div>
                        )}
                      </th>
                      <th class="ir-ghs-candidate-table__header-cell" style={{ width: '70px' }}>Country</th>
                      <th class="ir-ghs-candidate-table__header-cell" style={{ width: '60px' }}>Level2</th>
                      <th class="ir-ghs-candidate-table__header-cell" style={{ width: '60px' }}>Username</th>
                      <th class="ir-ghs-candidate-table__header-cell" style={{ width: '140px' }}>Property name</th>
                      <th class="ir-ghs-candidate-table__header-cell ir-ghs-candidate-table__header-cell--center" style={{ width: '65px' }}>
                        <div class="ir-ghs-candidate-table__header-center-wrapper">Activate?</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.properties
                      .filter(
                        p =>
                          !this.searchQuery ||
                          p.aname.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          p.NAME.toLowerCase().includes(this.searchQuery.toLowerCase()),
                      )
                      .map(p => ({
                        ...p,
                        countryName: this.countries.find(c => c.id === p.COUNTRY_ID)?.name || 'Unknown',
                      }))
                      .sort((a, b) => {
                        const countryCompare = a.countryName.localeCompare(b.countryName);
                        if (countryCompare !== 0) return countryCompare;
                        return a.NAME.localeCompare(b.NAME);
                      })
                      .map(p => {
                        return (
                          <tr 
                            class="ir-ghs-candidate-table__row ir-table-row" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                this.toggleSelection.emit(p);
                            }}
                          >
                            <td class="ir-ghs-candidate-table__cell ir-ghs-candidate-table__cell--center">
                              <div 
                                class="ir-ghs-candidate-table__checkbox-wrapper"
                                onClick={(e) => e.stopPropagation()}
                              >
                                  <wa-checkbox
                                    checked={selectedIds.includes(p.AC_ID)}
                                    onchange={(e) => {
                                        e.stopPropagation();
                                        this.toggleSelection.emit(p);
                                    }}
                                  ></wa-checkbox>
                              </div>
                            </td>
                            <td class="ir-ghs-candidate-table__cell ir-ghs-candidate-table__cell--muted ir-ghs-candidate-table__cell--truncate" title={p.countryName}>
                              {p.countryName}
                            </td>
                            <td class="ir-ghs-candidate-table__cell ir-ghs-candidate-table__cell--muted ir-ghs-candidate-table__cell--truncate" title={p.level2}>
                              {p.level2}
                            </td>
                            <td class="ir-ghs-candidate-table__cell ir-ghs-candidate-table__cell--muted ir-ghs-candidate-table__cell--truncate" title={p.aname}>
                              <div onClick={(e) => this.handlePropertyLinkClick(e, p)}>
                                <a 
                                  href={`https://x.igloorooms.com/manage/acgeneral.aspx?p=${p.aname}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  class="ir-ghs-candidate-table__property-link"
                                >
                                  {p.aname}
                                </a>
                              </div>
                            </td>
                            <td class="ir-ghs-candidate-table__cell ir-ghs-candidate-table__cell--bold ir-ghs-candidate-table__cell--truncate" title={p.NAME}>
                              {p.NAME}
                            </td>
                            <td class="ir-ghs-candidate-table__cell ir-ghs-candidate-table__cell--center">
                                <div class="ir-ghs-candidate-table__checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                                    <wa-switch
                                        key={`switch-${p.AC_ID}-${this.propertyToActivate?.AC_ID === p.AC_ID}`}
                                        checked={this.propertyToActivate?.AC_ID === p.AC_ID}
                                        onchange={(e: Event) => {
                                            const checked = (e.target as HTMLInputElement).checked;
                                            if (checked) {
                                                this.activateProperty.emit(p);
                                            } else {
                                                // Prevent default toggle off visually if we only allow activation
                                                // Actually the parent component controls state via propertyToActivate
                                            }
                                        }}
                                    ></wa-switch>
                                </div>
                            </td>
                          </tr>
                        );
                      })}
                    {!this.isLoading && this.properties.length === 0 && (
                      <tr>
                        <td colSpan={6} class="ir-ghs-candidate-table__empty-state border-0 bg-white">
                          <p class="mb-0 small">No candidate properties found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
            </div>
         </div>
      </wa-card>
    );
  }
}
