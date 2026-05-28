import { Component, Host, h, Element, Prop, State } from '@stencil/core';
import { GHSService } from '../../services/ghs/ghs.service';
import { BookingService } from '../../services/booking-service/booking.service';
import Token from '../../models/Token';
import ghsStore, { 
  setGhsCountries, 
  setGhsProperties, 
  setGhsLoading, 
  setGhsSelectedCountry, 
  toggleGhsPropertySelection,
  toggleAllGhsProperties,
  clearGhsPropertySelections,
  removeGhsPropertySelection
} from '../../stores/ghs.store';

@Component({
  tag: 'ir-ghs-onboarding',
  styleUrl: 'ir-ghs-onboarding.css',
  scoped: true,
})
export class IrGhsOnboarding {
  @Element() el: HTMLElement;
  @Prop() ticket: string;

  @State() isGenerating: boolean = false;
  @State() searchQuery: string = '';

  private ghsService = new GHSService();
  private bookingService = new BookingService();
  private tokenService = new Token();

  async componentWillLoad() {
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
    }
    await this.init();
  }

  private async init() {
    setGhsLoading(true);
    try {
      const countries = await this.bookingService.getCountries('EN');
      setGhsCountries(countries);
      await this.fetchProperties();
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setGhsLoading(false);
    }
  }

  private async fetchProperties() {
    setGhsLoading(true);
    try {
      const props = await this.ghsService.Get_GHS_Candidate_Properties({
        COUNTRY_ID: ghsStore.selectedCountryId,
      });
      setGhsProperties(props);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setGhsLoading(false);
    }
  }

  private async handleApplyFilters() {
    await this.fetchProperties();
  }

  private async handleResetFilters() {
    setGhsSelectedCountry(null);
    await this.fetchProperties();
  }

  private handleToggleAll(e: CustomEvent) {
    const target = e.target as any;
    toggleAllGhsProperties(target.checked);
  }

  private async handleGenerateRequest() {
    if (ghsStore.selectedProperties.length === 0) {
      alert('Please select at least one property.');
      return;
    }

    this.isGenerating = true;
    try {
      const downloadUrl = await this.ghsService.Generate_GHS_Listing_For_Selection({
        Selected_AC_IDs: ghsStore.selectedProperties.map(p => p.AC_ID),
      });

      if (downloadUrl) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.setAttribute('download', '');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        clearGhsPropertySelections();
        await this.fetchProperties();
      } else {
        alert('Failed to generate listing. URL not returned.');
      }
    } catch (error) {
      console.error('Error generating request:', error);
      alert('An error occurred while generating the request.');
    } finally {
      this.isGenerating = false;
    }
  }

  render() {
    const countryName = ghsStore.countries.find(c => c.id === ghsStore.selectedCountryId)?.name || 'All';
    const selectedIds = ghsStore.selectedProperties.map(p => p.AC_ID);
    const allVisibleSelected = ghsStore.properties.length > 0 && ghsStore.properties.every(p => selectedIds.includes(p.AC_ID));

    return (
      <Host>
        <ir-toast></ir-toast>
        <ir-interceptor></ir-interceptor>
        <section class="p-2 d-flex flex-column" style={{ gap: '1rem' }}>
          
          <div class="d-flex align-items-center justify-content-between">
             <h3 class="mb-1 mb-md-0">Google hotels request</h3>
          </div>

          <div class="d-flex flex-column flex-lg-row mt-1" style={{ gap: '1rem' }}>
            
            {/* Filter Card */}
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
                </div>
              </div>

              <div class="p-2 d-flex flex-column" style={{ gap: '1.25rem' }}>
                <fieldset class="filter-group m-0 p-0 border-0">
                  <label class="mb-2 d-block small font-weight-bold text-dark">Countries</label>
                  <ir-select 
                    size="sm"
                    showFirstOption={true}
                    firstOption="Show all countries"
                    selectedValue={ghsStore.selectedCountryId?.toString() || ''}
                    data={ghsStore.countries.map(c => ({ value: c.id.toString(), text: c.name }))}
                    onSelectChange={(e: CustomEvent) => setGhsSelectedCountry(e.detail ? parseInt(e.detail, 10) : null)}
                  ></ir-select>
                </fieldset>

                <div class="d-flex align-items-center justify-content-end gap-2 mt-auto pt-3 border-top filter-actions">
                  <ir-custom-button 
                    size="small" 
                    variant="neutral" 
                    appearance="filled"
                    onClickHandler={() => this.handleResetFilters()} 
                    disabled={ghsStore.isLoading}
                  >
                    Reset
                  </ir-custom-button>
                  <ir-custom-button 
                    size="small" 
                    variant="brand" 
                    onClickHandler={() => this.handleApplyFilters()} 
                    disabled={ghsStore.isLoading}
                  >
                    Apply
                  </ir-custom-button>
                </div>
              </div>
            </div>

            {/* Results Card */}
            <div class="card mb-0 overflow-hidden shadow-sm border-0 position-relative" style={{ flex: '1 1 0', minWidth: '0' }}>
               <div class="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center gap-3">
                  <h3 class="h6 fw-bold mb-0 text-dark flex-grow-1 text-nowrap">
                    Candidate properties
                    <span class="text-muted extra-small ms-2 fw-normal">
                        ({countryName})
                    </span>
                  </h3>
                  <div style={{ width: '180px' }}>
                    <ir-input 
                        size="small" 
                        placeholder="Search aname..." 
                        value={this.searchQuery}
                        onText-change={(e: CustomEvent) => {
                            console.log('Search Query changed:', e.detail);
                            this.searchQuery = e.detail;
                        }}
                    >
                        <wa-icon name="search" slot="start" style={{ fontSize: '12px' }}></wa-icon>
                    </ir-input>
                  </div>
               </div>

               <div class="card-body p-0 position-relative overflow-auto" style={{ maxHeight: '600px', minHeight: '400px' }}>
                  {ghsStore.isLoading && (
                    <div class="loading-overlay position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-50 z-index-2">
                        <ir-spinner></ir-spinner>
                    </div>
                  )}

                  <div class="table-container p-0 m-0 table-responsive bg-white overflow-auto">
                    {ghsStore.isLoading ? (
                      <div class="d-flex align-items-center justify-content-center p-5" style={{ minHeight: '300px' }}>
                        <ir-spinner></ir-spinner>
                      </div>
                    ) : (
                      <table class="table align-middle mb-0 w-100" style={{ tableLayout: 'fixed', minWidth: '380px' }}>
                        <thead>
                          <tr class="table-header bg-light">
                            <th class="text-center py-1" style={{ width: '30px' }}>
                              <div class="d-flex align-items-center justify-content-center">
                                  <wa-checkbox 
                                    checked={allVisibleSelected}
                                    indeterminate={ghsStore.selectedProperties.length > 0 && !allVisibleSelected}
                                    onchange={(e) => {
                                        console.log('Toggle All:', (e.target as any).checked);
                                        this.handleToggleAll(e);
                                    }}
                                    disabled={ghsStore.properties.length === 0}
                                  ></wa-checkbox>
                              </div>
                            </th>
                            <th class="px-1 text-start py-1 extra-small fw-bold" style={{ width: '70px' }}>Country</th>
                            <th class="px-1 text-start py-1 extra-small fw-bold" style={{ width: '60px' }}>Level2</th>
                            <th class="px-1 text-start py-1 extra-small fw-bold" style={{ width: '60px' }}>Username</th>
                            <th class="px-1 text-start py-1 extra-small fw-bold" style={{ width: '140px' }}>Property name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ghsStore.properties
                            .filter(p => !this.searchQuery || p.aname.toLowerCase().includes(this.searchQuery.toLowerCase()))
                            .map(p => ({
                              ...p,
                              countryName: ghsStore.countries.find(c => c.id === p.COUNTRY_ID)?.name || 'Unknown',
                            }))
                            .sort((a, b) => {
                              const countryCompare = a.countryName.localeCompare(b.countryName);
                              if (countryCompare !== 0) return countryCompare;
                              return (a.level2 || '').localeCompare(b.level2 || '');
                            })
                            .map(p => {
                              return (
                                <tr class="ir-table-row border-bottom">
                                  <td class="text-center py-1">
                                    <div class="d-flex align-items-center justify-content-center">
                                        <wa-checkbox
                                          checked={selectedIds.includes(p.AC_ID)}
                                          onchange={() => {
                                              console.log('Toggling property:', p.AC_ID);
                                              toggleGhsPropertySelection(p);
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
                                </tr>
                              );
                            })}
                          {ghsStore.properties.length === 0 && (
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

            {/* Selection Card (Right Grid) */}
            <div class="card mb-0 overflow-hidden shadow-sm border-0 position-relative" style={{ flex: '0 0 350px' }}>
                <div class="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center justify-content-between flex-nowrap" style={{ gap: '0.5rem' }}>
                  <div class="d-flex align-items-center flex-nowrap overflow-hidden" style={{ gap: '0.5rem' }}>
                    <h3 class="h6 fw-bold mb-0 text-dark text-nowrap">To be added</h3>
                    <span class="badge bg-primary text-white extra-small" style={{ minWidth: '20px' }}>
                        {ghsStore.selectedProperties.length}
                    </span>
                  </div>
                  <ir-custom-button 
                    size="small" 
                    variant="brand" 
                    appearance="filled"
                    onClickHandler={() => this.handleGenerateRequest()} 
                    loading={this.isGenerating}
                    disabled={ghsStore.selectedProperties.length === 0}
                  >
                    Generate request
                  </ir-custom-button>
               </div>

               <div class="card-body p-0 position-relative overflow-auto" style={{ maxHeight: '600px', minHeight: '400px' }}>
                  <div class="table-container p-0 m-0 table-responsive bg-white">
                    <table class="table align-middle mb-0">
                      <thead>
                        <tr class="table-header bg-light">
                          <th class="ps-3 text-start py-2 small fw-bold">Property name</th>
                          <th class="pe-3 text-end py-2 small fw-bold" style={{ width: '50px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {ghsStore.selectedProperties.map(p => (
                          <tr class="ir-table-row border-bottom">
                            <td class="ps-3 text-dark text-start py-2 small font-weight-bold">
                                {p.NAME}
                                <div class="text-muted extra-small fw-normal">{p.aname}</div>
                            </td>
                            <td class="pe-3 text-end py-2">
                                <button 
                                    class="btn btn-sm btn-link text-danger p-0" 
                                    onClick={() => removeGhsPropertySelection(p.AC_ID)}
                                    title="Remove from list"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </td>
                          </tr>
                        ))}
                        {ghsStore.selectedProperties.length === 0 && (
                          <tr>
                            <td colSpan={2} class="text-center p-4 text-muted border-0 bg-white">
                              <p class="mb-0 small italic">No properties selected yet.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>

          </div>
        </section>
      </Host>
    );
  }
}
