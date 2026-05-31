import { Component, h, Prop, Event, EventEmitter, State } from '@stencil/core';
import { GHS_Candidate_Property } from '../../services/ghs/types';
import { ICountry } from '../../models/IBooking';

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

  @State() searchQuery: string = '';

  @Event() toggleSelection: EventEmitter<GHS_Candidate_Property>;
  @Event() toggleAll: EventEmitter<boolean>;
  @Event() activateProperty: EventEmitter<GHS_Candidate_Property>;

  render() {
    const countryName = this.countries.find(c => c.id === this.selectedCountryId)?.name || 'All';
    const selectedIds = this.selectedProperties.map(p => p.AC_ID);
    const allVisibleSelected = this.properties.length > 0 && this.properties.every(p => selectedIds.includes(p.AC_ID));

    return (
      <div class="ir-ghs-candidate-table__container">
         <div class="ir-ghs-candidate-table__header">
            <h3 class="ir-ghs-candidate-table__title">
              Candidate properties
              <span class="ir-ghs-candidate-table__subtitle">
                  ({countryName})
              </span>
            </h3>
            <div class="ir-ghs-candidate-table__search-wrapper">
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
                      <th class="ir-ghs-candidate-table__header-cell ir-ghs-candidate-table__header-cell--center" style={{ width: '65px' }}>Activate?</th>
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
                              {p.aname}
                            </td>
                            <td class="ir-ghs-candidate-table__cell ir-ghs-candidate-table__cell--bold ir-ghs-candidate-table__cell--truncate" title={p.NAME}>
                              {p.NAME}
                            </td>
                            <td class="ir-ghs-candidate-table__cell ir-ghs-candidate-table__cell--center">
                                <div class="ir-ghs-candidate-table__checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
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
      </div>
    );
  }
}
