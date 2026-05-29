import { Component, Host, h, Element, Prop, State, Watch, EventEmitter, Event } from '@stencil/core';
import axios from 'axios';
import { GHSService } from '../../services/ghs/ghs.service';
import { BookingService } from '../../services/booking-service/booking.service';
import Token from '../../models/Token';
import { GHS_Candidate_Property } from '../../services/ghs/types';
import { ICountry } from '../../models/IBooking';
import { IToast } from '../ui/ir-toast/toast';

@Component({
  tag: 'ir-ghs-onboarding',
  styleUrl: 'ir-ghs-onboarding.css',
  scoped: true,
})
export class IrGhsOnboarding {
  @Element() el: HTMLElement;
  @Prop() ticket: string;
  @Prop() baseurl: string;

  @State() properties: GHS_Candidate_Property[] = [];
  @State() countries: ICountry[] = [];
  @State() selectedCountryId: number | null = null;
  @State() selectedProperties: GHS_Candidate_Property[] = [];
  @State() isLoading: boolean = false;
  @State() isGenerating: boolean = false;

  @Event() toast: EventEmitter<IToast>;

  private ghsService = new GHSService();
  private bookingService = new BookingService();
  private tokenService = new Token();

  private removeAllModal: HTMLIrDialogElement;

  @Watch('ticket')
  ticketChanged(newValue: string) {
    if (newValue) {
      this.tokenService.setToken(newValue);
      this.init();
    }
  }

  async componentWillLoad() {
    if (this.baseurl) {
      this.tokenService.setBaseUrl(this.baseurl);
    }
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
      await this.init();
    }
  }

  private async init() {
    this.isLoading = true;
    try {
      const [allCountries, allProperties] = await Promise.all([
        this.bookingService.getCountries('EN'),
        this.ghsService.Get_GHS_Candidate_Properties({ COUNTRY_ID: null }),
      ]);

      const validCountryIds = new Set(allProperties.map(p => p.COUNTRY_ID));

      this.countries = allCountries
        .filter(c => validCountryIds.has(c.id))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.properties = allProperties;
    } catch (error) {
      this.showToast('error', 'Initialization Error', error.message || 'Failed to load properties');
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchProperties() {
    this.isLoading = true;
    this.properties = [];
    try {
      const props = await this.ghsService.Get_GHS_Candidate_Properties({
        COUNTRY_ID: this.selectedCountryId,
      });
      this.properties = props;
    } catch (error) {
      this.showToast('error', 'Error', error.message || 'Failed to fetch properties');
    } finally {
      this.isLoading = false;
    }
  }

  private handleToggleAll(selectAll: boolean) {
    if (selectAll) {
      const currentSelectedIds = this.selectedProperties.map(p => p.AC_ID);
      const newSelections = this.properties.filter(p => !currentSelectedIds.includes(p.AC_ID));
      this.selectedProperties = [...this.selectedProperties, ...newSelections];
    } else {
      const candidateIds = this.properties.map(p => p.AC_ID);
      this.selectedProperties = this.selectedProperties.filter(p => !candidateIds.includes(p.AC_ID));
    }
  }

  private togglePropertySelection(property: GHS_Candidate_Property) {
    const index = this.selectedProperties.findIndex(p => p.AC_ID === property.AC_ID);
    if (index !== -1) {
      this.selectedProperties = this.selectedProperties.filter(p => p.AC_ID !== property.AC_ID);
    } else {
      this.selectedProperties = [...this.selectedProperties, property];
    }
  }

  private removePropertySelection(acId: number) {
    this.selectedProperties = this.selectedProperties.filter(p => p.AC_ID !== acId);
  }

  private handleRemoveAll() {
    if (this.selectedProperties.length === 0) return;
    this.removeAllModal.openModal();
  }

  private handleConfirmRemoveAll() {
    this.selectedProperties = [];
    this.removeAllModal.closeModal();
  }

  private async handleGenerateRequest() {
    if (this.selectedProperties.length === 0) {
      this.showToast('error', 'Selection Required', 'Please select at least one property.');
      return;
    }

    this.isGenerating = true;
    try {
      const downloadUrl = await this.ghsService.Generate_GHS_Listing_For_Selection({
        Selected_AC_IDs: this.selectedProperties.map(p => p.AC_ID),
      });

      if (downloadUrl) {
        // Create a clean axios instance to bypass global interceptors (avoiding network errors)
        const cleanAxios = axios.create();
        const response = await cleanAxios.get(downloadUrl, { responseType: 'blob' });
        
        // Create a local blob URL
        const blob = new Blob([response.data], { type: 'application/xml' });
        const localUrl = window.URL.createObjectURL(blob);
        
        // Trigger download of the local blob
        const a = document.createElement('a');
        a.href = localUrl;
        const filename = downloadUrl.split('/').pop() || 'ghs_onboarding.xml';
        a.setAttribute('download', filename);
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        window.URL.revokeObjectURL(localUrl);
        
        this.selectedProperties = [];
        await this.fetchProperties();
        this.showToast('success', 'Success', 'GHS onboarding request downloaded.');
      }
    } catch (error) {
      console.error('Download Error Details:', error);
      this.showToast('error', 'Generation Error', error.message || 'An error occurred while generating the request.');
    } finally {
      this.isGenerating = false;
    }
  }

  private showToast(type: 'success' | 'error', title: string, description: string) {
    this.toast.emit({
      type,
      title,
      description,
      position: 'top-right',
    });
  }

  render() {
    return (
      <Host>
        <ir-toast></ir-toast>
        <ir-interceptor></ir-interceptor>
        {this.isLoading && this.properties.length === 0 && <ir-loading-screen></ir-loading-screen>}
        <ir-dialog
          ref={el => (this.removeAllModal = el)}
          label="Confirmation"
          onIrDialogHide={() => this.removeAllModal.closeModal()}
        >
          <div class="p-0 d-flex flex-column align-items-center justify-content-center">
            <p class="m-0 text-center">Are you sure you want to remove all selected properties from the list?</p>
          </div>
          <div slot="footer" class="ir-dialog__footer">
            <ir-custom-button 
                variant="neutral" 
                appearance="filled" 
                size="medium" 
                onClickHandler={() => this.removeAllModal.closeModal()}
            >
              Cancel
            </ir-custom-button>
            <ir-custom-button 
                variant="danger" 
                appearance="accent" 
                size="medium" 
                onClickHandler={() => this.handleConfirmRemoveAll()}
            >
              Confirm
            </ir-custom-button>
          </div>
        </ir-dialog>
        <section class="p-2 d-flex flex-column" style={{ gap: '1rem' }}>
          
          <div class="d-flex align-items-center justify-content-between">
             <h3 class="mb-1 mb-md-0">Google hotels request</h3>
          </div>

          <div class="d-flex flex-column flex-lg-row mt-1" style={{ gap: '1rem' }}>
            
            <ir-ghs-filters
                countries={this.countries}
                selectedCountryId={this.selectedCountryId}
                isLoading={this.isLoading}
                onCountryChange={(e) => {
                    this.selectedCountryId = e.detail;
                    this.fetchProperties();
                }}
                onFilterApply={() => this.fetchProperties()}
                onFilterReset={() => {
                    this.selectedCountryId = null;
                    this.fetchProperties();
                }}
            ></ir-ghs-filters>

            <ir-ghs-candidate-table
                properties={this.properties}
                countries={this.countries}
                selectedCountryId={this.selectedCountryId}
                selectedProperties={this.selectedProperties}
                isLoading={this.isLoading}
                onToggleSelection={(e) => this.togglePropertySelection(e.detail)}
                onToggleAll={(e) => this.handleToggleAll(e.detail)}
            ></ir-ghs-candidate-table>

            <ir-ghs-selection-bucket
                selectedProperties={this.selectedProperties}
                isGenerating={this.isGenerating}
                onGenerateRequest={() => this.handleGenerateRequest()}
                onRemoveAll={() => this.handleRemoveAll()}
                onRemoveProperty={(e) => this.removePropertySelection(e.detail)}
            ></ir-ghs-selection-bucket>

          </div>
        </section>
      </Host>
    );
  }
}
