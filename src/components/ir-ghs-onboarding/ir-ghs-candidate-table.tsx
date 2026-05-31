import { Component, h, Prop, Event, EventEmitter, State } from '@stencil/core';
import { GHS_Candidate_Property } from '../../services/ghs/types';
import { ICountry } from '../../models/IBooking';

@Component({
  tag: 'ir-ghs-candidate-table',
  scoped: true,
})
export class IrGhsCandidateTable {
  @Prop() properties: GHS_Candidate_Property[] = [];
  @Prop() countries: ICountry[] = [];
  @Prop() selectedCountryId: number | null = null;
  @Prop() selectedProperties: GHS_Candidate_Property[] = [];
  @Prop() propertyToActivate: GHS_Candidate_Property | null = null;
  @Prop() isLoading: boolean = false;

  @State() searchQuery: string = '';

  @Event() toggleSelection: EventEmitter<GHS_Candidate_Property>;
  @Event() toggleAll: EventEmitter<boolean>;
  @Event() activateProperty: EventEmitter<GHS_Candidate_Property>;

  render() {
    const countryName = this.countries.find(c => c.id === this.selectedCountryId)?.name || 'All';
    const selectedIds = this.selectedProperties.map(p => p.AC_ID);
    const allVisibleSelected = this.properties.length > 0 && this.properties.every(p => selectedIds.includes(p.AC_ID));

    return (
      <div class="card mb-0 overflow-hidden shadow-sm border-0 position-relative" style={{ flex: '1 1 0', minWidth: '0' }}>
         <div class="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center gap-3">
            <h3 class="h6 fw-bold mb-0 text-dark flex-grow-1 text-nowrap">
              Candidate properties
              <span class="text-muted extra-small ms-2 fw-normal">
                  ({countryName})
              </span>
            </h3>
            <div 
              style={{ width: '180px' }}
            >
              <ir-input 
                  size="small" 
                  placeholder="Search aname..." 
                  value={this.searchQuery}
                  onText-change={(e: CustomEvent) => {
                      this.searchQuery = e.detail;
                  }}
              >
                  <wa-icon name="search" slot="start" style={{ fontSize: '12px' }}></wa-icon>
              </ir-input>
            </div>
         </div>

         <div class="card-body p-0 position-relative overflow-auto" style={{ maxHeight: '600px', minHeight: '400px' }}>
            {this.isLoading && (
              <div class="loading-overlay position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-50 z-index-2">
                  <ir-spinner></ir-spinner>
              </div>
            )}

            <div class="table-container p-0 m-0 table-responsive bg-white overflow-auto">
              {this.isLoading && this.properties.length === 0 ? (
                <div class="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '300px' }}>
                  <ir-spinner></ir-spinner>
                </div>
              ) : (
                <table class="table align-middle mb-0 w-100" style={{ tableLayout: 'fixed', minWidth: '380px' }}>
                  <thead>
                    <tr class="table-header bg-light">
                      <th class="text-center py-1" style={{ width: '30px' }}>
                        {this.properties.length > 0 && (
                          <div class="d-flex align-items-center justify-content-center">
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
                      <th class="px-1 text-start py-1 extra-small fw-bold" style={{ width: '70px' }}>Country</th>
                      <th class="px-1 text-start py-1 extra-small fw-bold" style={{ width: '60px' }}>Level2</th>
                      <th class="px-1 text-start py-1 extra-small fw-bold" style={{ width: '60px' }}>Username</th>
                      <th class="px-1 text-start py-1 extra-small fw-bold" style={{ width: '140px' }}>Property name</th>
                      <th class="px-1 text-center py-1 extra-small fw-bold" style={{ width: '50px' }}>Activate?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.properties
                      .filter(p => !this.searchQuery || p.aname.toLowerCase().includes(this.searchQuery.toLowerCase()))
                      .map(p => ({
                        ...p,
                        countryName: this.countries.find(c => c.id === p.COUNTRY_ID)?.name || 'Unknown',
                      }))
                      .sort((a, b) => {
                        const countryCompare = a.countryName.localeCompare(b.countryName);
                        if (countryCompare !== 0) return countryCompare;
                        return (a.level2 || '').localeCompare(b.level2 || '');
                      })
                      .map(p => {
                        return (
                          <tr 
                            class="ir-table-row border-bottom" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                this.toggleSelection.emit(p);
                            }}
                          >
                            <td class="text-center py-1">
                              <div 
                                class="d-flex align-items-center justify-content-center"
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
                            <td class="px-1 text-muted text-start py-1 extra-small text-truncate" title={p.countryName}>
                              {p.countryName}
                            </td>
                            <td class="px-1 text-muted text-start py-1 extra-small text-truncate" title={p.level2}>
                              {p.level2}
                            </td>
                            <td class="px-1 text-muted text-start py-1 extra-small text-truncate" title={p.aname}>
                              {p.aname}
                            </td>
                            <td class="px-1 text-dark fw-bold text-start py-1 extra-small text-truncate" title={p.NAME}>
                              {p.NAME}
                            </td>
                            <td class="px-1 text-center py-1">
                                <div class="d-flex align-items-center justify-content-center" onClick={(e) => e.stopPropagation()}>
                                    <ir-switch
                                        key={`switch-${p.AC_ID}-${this.propertyToActivate?.AC_ID === p.AC_ID}`}
                                        checked={this.propertyToActivate?.AC_ID === p.AC_ID}
                                        onCheckChange={(e) => {
                                            if (e.detail) {
                                                this.activateProperty.emit(p);
                                            }
                                        }}
                                    ></ir-switch>
                                </div>
                            </td>
                          </tr>
                        );
                      })}
                    {this.properties.length === 0 && (
                      <tr>
                        <td colSpan={5} class="text-center p-4 text-muted border-0 bg-white">
                          <p class="mb-0 small">No candidate properties found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
         </div>
      </div>
    );
  }
}
