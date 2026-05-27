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
  clearGhsPropertySelections 
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
      clearGhsPropertySelections();
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setGhsLoading(false);
    }
  }

  private handleCountryChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const val = target.value ? parseInt(target.value, 10) : null;
    setGhsSelectedCountry(val);
  }

  private async handleApplyFilters() {
    await this.fetchProperties();
  }

  private async handleResetFilters() {
    setGhsSelectedCountry(null);
    await this.fetchProperties();
  }

  private handleToggleAll(e: Event) {
    const target = e.target as HTMLInputElement;
    toggleAllGhsProperties(target.checked);
  }

  private async handleGenerateRequest() {
    if (ghsStore.selectedPropertyIds.length === 0) {
      // Could use ir-toast here, but standard alert for now if toast not configured
      alert('Please select at least one property.');
      return;
    }

    this.isGenerating = true;
    try {
      const downloadUrl = await this.ghsService.Generate_GHS_Listing_For_Selection({
        Selected_AC_IDs: ghsStore.selectedPropertyIds,
      });

      if (downloadUrl) {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.setAttribute('download', '');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
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

    return (
      <Host>
        <ir-toast></ir-toast>
        <ir-interceptor></ir-interceptor>
        <section class="p-2 d-flex flex-column" style={{ gap: '1rem' }}>
          
          <div class="d-flex align-items-center justify-content-between">
             <h3 class="mb-1 mb-md-0">Google hotels request</h3>
             <ir-custom-button 
               size="small" 
               variant="brand" 
               appearance="filled"
               onClickHandler={() => this.handleGenerateRequest()} 
               loading={this.isGenerating}
               disabled={ghsStore.selectedPropertyIds.length === 0}
             >
               Generate request
             </ir-custom-button>
          </div>

          <div class="d-flex flex-column flex-lg-row mt-1" style={{ gap: '1rem' }}>
            
            {/* Filter Card */}
            <div class="card mb-0 p-1 d-flex flex-column shadow-sm border" style={{ width: '300px', flexShrink: '0' }}>
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
                  <label class="mb-2 d-block small font-weight-bold text-dark">Country</label>
                  <select class="form-select form-select-sm" onInput={(e) => this.handleCountryChange(e)}>
                    <option value="">Show all</option>
                    {ghsStore.countries.map(c => (
                      <option value={c.id} selected={ghsStore.selectedCountryId === c.id}>{c.name}</option>
                    ))}
                  </select>
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
            <div class="flex-grow-1 card mb-0 overflow-hidden shadow-sm border-0 position-relative">
               <div class="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center">
                  <h3 class="h6 fw-bold mb-0 text-dark flex-grow-1">
                    Candidate properties
                    <span class="text-muted small ms-2 fw-normal">
                        ({countryName})
                    </span>
                  </h3>
                  {ghsStore.properties.length > 0 && (
                      <span class="badge bg-light text-dark border extra-small">
                        {ghsStore.selectedPropertyIds.length} / {ghsStore.properties.length} Properties
                      </span>
                  )}
               </div>

               <div class="card-body p-0 position-relative" style={{ minHeight: '400px' }}>
                  {ghsStore.isLoading && (
                    <div class="loading-overlay position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-50 z-index-2">
                        <ir-spinner></ir-spinner>
                    </div>
                  )}

                  <div class="table-container p-0 m-0 table-responsive bg-white shadow-sm d-inline-block" style={{ maxWidth: '100%' }}>
                    <table class="table align-middle mb-0" style={{ width: 'auto' }}>
                      <thead>
                        <tr class="table-header bg-light">
                          <th class="ps-4 text-center py-2" style={{ width: '40px', textTransform: 'none', fontSize: '11px', whiteSpace: 'nowrap' }}>
                            <input 
                              type="checkbox" 
                              class="form-check-input m-0"
                              checked={ghsStore.properties.length > 0 && ghsStore.selectedPropertyIds.length === ghsStore.properties.length}
                              onChange={(e) => this.handleToggleAll(e)}
                              disabled={ghsStore.properties.length === 0}
                            />
                          </th>
                          <th class="px-4 text-start py-2" style={{ textTransform: 'none', fontSize: '11px', whiteSpace: 'nowrap' }}>Country</th>
                          <th class="px-4 text-start py-2" style={{ textTransform: 'none', fontSize: '11px', whiteSpace: 'nowrap' }}>[Level2]</th>
                          <th class="px-4 text-start py-2" style={{ textTransform: 'none', fontSize: '11px', whiteSpace: 'nowrap' }}>Username</th>
                          <th class="pe-4 text-start py-2" style={{ textTransform: 'none', fontSize: '11px', whiteSpace: 'nowrap' }}>Property name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ghsStore.properties.map(p => {
                          const rowCountry = ghsStore.countries.find(c => c.id === p.COUNTRY_ID)?.name || 'Unknown';
                          return (
                            <tr class="ir-table-row border-bottom">
                              <td class="ps-4 text-center py-2" style={{ whiteSpace: 'nowrap' }}>
                                <input 
                                  type="checkbox" 
                                  class="form-check-input m-0"
                                  checked={ghsStore.selectedPropertyIds.includes(p.AC_ID)}
                                  onChange={() => toggleGhsPropertySelection(p.AC_ID)}
                                />
                              </td>
                              <td class="px-4 text-muted text-start py-2" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{rowCountry}</td>
                              <td class="px-4 text-muted text-start py-2" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{p.level2}</td>
                              <td class="px-4 text-muted text-start py-2" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{p.aname}</td>
                              <td class="pe-4 text-dark fw-bold text-start py-2" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{p.NAME}</td>
                            </tr>
                          )
                        })}
                        {ghsStore.properties.length === 0 && !ghsStore.isLoading && (
                          <tr>
                            <td colSpan={5} class="text-center p-4 text-muted border-0 bg-white">
                              <p class="mb-0 small">No candidate properties found.</p>
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
