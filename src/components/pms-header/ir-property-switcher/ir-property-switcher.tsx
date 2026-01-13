import { Component, Element, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';

import { FetchedProperty, LinkedProperty } from '@/services/property.service';
import { GetACByACID } from './legacy.types';
import Token from '@/models/Token';
import axios from 'axios';
import WaDropdownItem from '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item';

type SwitcherMode = 'dropdown' | 'dialog' | 'read-only';

@Component({
  tag: 'ir-property-switcher',
  styleUrl: 'ir-property-switcher.css',
  scoped: true,
})
export class IrPropertySwitcher {
  @Element() el: HTMLIrPropertySwitcherElement;

  @Prop() mode: 'dropdown' | 'dialog' = 'dialog';
  @Prop() ticket: string;
  @Prop() baseUrl: string;

  @State() open = false;
  @State() selectedProperty?: FetchedProperty;
  @State() linkedProperties: LinkedProperty[] = [];
  @State() displayMode: SwitcherMode = 'read-only';

  private token = new Token();

  /** Emits whenever the user selects a new property */
  @Event({ bubbles: true, composed: true })
  propertyChange: EventEmitter<FetchedProperty>;
  @Event({ bubbles: true, composed: true })
  linkedPropertyChange: EventEmitter<{ linkedProperty: LinkedProperty; property: FetchedProperty }>;

  private storagePoller?: number;
  private userInfoPoller?: number;
  private lastSelectedAcRaw: string | null = null;
  private lastUserInfoRaw: string | null = null;

  async componentWillLoad() {
    if (this.baseUrl) this.token.setBaseUrl(this.baseUrl);
    if (this.ticket) {
      this.token.setToken(this.ticket);
      this.init();
    }

    // Listen for cross-tab updates
    window.addEventListener('storage', this.handleStorageEvent);
  }

  disconnectedCallback() {
    this.stopSelectedAcPolling();
    this.stopUserInfoPolling();
    window.removeEventListener('storage', this.handleStorageEvent);
  }

  @Watch('ticket')
  async handleTicketChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.token.setToken(newValue);
      this.init();
    }
  }

  private async init() {
    await this.pollSelectedAcStorage();
    this.pollUserInfoStorage();

    if (!this.selectedProperty) {
      this.startSelectedAcPolling();
    }
    if (!this.lastUserInfoRaw) {
      this.startUserInfoPolling();
    }
  }

  private startSelectedAcPolling() {
    if (this.storagePoller) return;

    this.storagePoller = window.setInterval(this.pollSelectedAcStorage, 300);
  }

  private stopSelectedAcPolling() {
    if (this.storagePoller) {
      clearInterval(this.storagePoller);
      this.storagePoller = undefined;
    }
  }

  private startUserInfoPolling() {
    if (this.userInfoPoller) return;

    this.userInfoPoller = window.setInterval(this.pollUserInfoStorage, 300);
  }

  private stopUserInfoPolling() {
    if (this.userInfoPoller) {
      clearInterval(this.userInfoPoller);
      this.userInfoPoller = undefined;
    }
  }

  private handleStorageEvent = () => {
    // Cross-tab change - re-enable polling briefly
    this.startSelectedAcPolling();
    this.startUserInfoPolling();
  };

  private pollSelectedAcStorage = async () => {
    const selectedAcRaw = localStorage.getItem('_Selected_Ac');

    // Nothing changed - skip work
    if (selectedAcRaw === this.lastSelectedAcRaw) {
      return;
    }

    this.lastSelectedAcRaw = selectedAcRaw;

    if (!selectedAcRaw) {
      return;
    }

    let selectedAc: GetACByACID;

    try {
      selectedAc = JSON.parse(selectedAcRaw);
    } catch {
      return;
    }

    // ? Storage is now valid
    this.updateSelectedProperty(selectedAc);
    await this.fetchLinkedProperties(selectedAc.AC_ID);
    this.resolveDisplayMode(true);

    // ?? Stop polling once initialized
    this.stopSelectedAcPolling();
  };

  private pollUserInfoStorage = () => {
    const userInfoRaw = localStorage.getItem('UserInfo_b');

    if (userInfoRaw === this.lastUserInfoRaw) {
      return;
    }

    this.lastUserInfoRaw = userInfoRaw;

    if (!userInfoRaw) {
      return;
    }

    this.resolveDisplayMode(!!this.selectedProperty);
    this.stopUserInfoPolling();
  };

  private updateSelectedProperty(selectedAc: GetACByACID) {
    this.selectedProperty = {
      A_NAME: selectedAc.My_User?.USERNAME ?? '',
      COUNTRY_CODE: selectedAc.COUNTRY_ID as any,
      COUNTRY_NAME: selectedAc.My_Country?.L1_NAME_REF ?? '',
      PROPERTY_ID: selectedAc.AC_ID,
      PROPERTY_NAME: selectedAc.NAME,
    };
    this.propertyChange.emit(this.selectedProperty);
  }

  private async fetchLinkedProperties(acId: number) {
    try {
      const { data } = await axios.post(`${this.baseUrl ?? ''}/Fetch_Linked_Properties`, {
        property_id: acId,
      });

      if (data.ExceptionMsg) {
        throw new Error(data.ExceptionMsg);
      }

      this.linkedProperties = Array.isArray(data.My_Result) ? data.My_Result : [];
    } catch (error) {
      console.error('Failed to fetch linked properties', error);
      this.linkedProperties = [];
    }
  }

  private resolveDisplayMode(hasSelectedAc: boolean) {
    const userInfoRaw = localStorage.getItem('UserInfo_b');

    let userInfo: any = null;
    try {
      if (userInfoRaw) userInfo = JSON.parse(userInfoRaw);
    } catch {
      /* noop */
    }

    const userTypeCode = String(userInfo?.USER_TYPE_CODE ?? '');

    if (userTypeCode === '1' || userTypeCode === '4') {
      this.displayMode = 'dialog';
      return;
    }

    if (!hasSelectedAc || !this.linkedProperties.length) {
      this.displayMode = 'read-only';
      return;
    }

    this.displayMode = 'dropdown';
  }

  private handlePropertySelected = async (event: CustomEvent<FetchedProperty['PROPERTY_ID']>) => {
    event.stopImmediatePropagation();
    event.stopPropagation();
    await this.applySelectedProperty(event.detail);
  };

  private handleDropdownSelect = async (selectedProperty: LinkedProperty['property_id']) => {
    const selectedId = Number(selectedProperty);
    const property = this.linkedProperties.find(p => p.property_id === selectedId);
    if (!property) return;

    await this.applySelectedProperty(property.property_id, property);
  };

  private async applySelectedProperty(propertyId: FetchedProperty['PROPERTY_ID'], linkedProperty?: LinkedProperty) {
    this.open = false;
    try {
      const { data } = await axios.post(`${this.baseUrl ?? ''}/Get_Ac_By_AC_ID_Adv`, {
        AC_ID: propertyId,
        Bypass_Caching: true,
        IS_BACK_OFFICE: true,
      });

      if (data.ExceptionMsg) {
        throw new Error(data.ExceptionMsg);
      }

      const property = data.My_Result;
      if (linkedProperty) {
        this.linkedPropertyChange.emit({ linkedProperty, property });
      }
      // localStorage.setItem('_Selected_Ac', JSON.stringify(property));
      this.propertyChange.emit({
        A_NAME: property.My_User?.USERNAME ?? '',
        COUNTRY_CODE: property.COUNTRY_ID as any,
        COUNTRY_NAME: property.My_Country?.L1_NAME_REF ?? '',
        PROPERTY_ID: property.AC_ID,
        PROPERTY_NAME: property.NAME,
      });
      this.updateSelectedProperty(property);
    } catch (error) {
      console.error('Failed to fetch selected property details', error);
    }

    // Re-init via polling-safe path
    this.startSelectedAcPolling();
    this.startUserInfoPolling();
  }

  private renderReadOnly() {
    return <p class="property-switcher__trigger">{this.selectedProperty?.PROPERTY_NAME ?? 'Property'}</p>;
  }

  private trigger() {
    return (
      <ir-custom-button withCaret variant="neutral" appearance="plain" onClickHandler={() => (this.open = !this.open)}>
        <p class="property-switcher__trigger">{this.selectedProperty?.PROPERTY_NAME ?? 'Select property'}</p>
      </ir-custom-button>
    );
  }

  render() {
    return (
      <Host>
        {this.displayMode === 'read-only' && this.renderReadOnly()}

        {this.displayMode === 'dropdown' && (
          <wa-dropdown
            onwa-hide={e => {
              e.stopPropagation();
              e.stopImmediatePropagation();
            }}
            onwa-select={(e: CustomEvent<{ item: WaDropdownItem }>) => {
              e.stopPropagation();
              e.stopImmediatePropagation();
              this.handleDropdownSelect(Number(e.detail.item.value));
            }}
          >
            <ir-custom-button slot="trigger" withCaret variant="neutral" appearance="plain">
              {this.selectedProperty?.PROPERTY_NAME}
            </ir-custom-button>
            {this.linkedProperties?.map(property => (
              <wa-dropdown-item value={property.property_id?.toString()} key={`dropdown-item-${property.property_id}`}>
                {property.name}
              </wa-dropdown-item>
            ))}
          </wa-dropdown>
        )}

        {this.displayMode === 'dialog' && (
          <div>
            {this.trigger()}
            <ir-dialog
              withoutHeader
              open={this.open}
              label="Find property"
              class="property-switcher__dialog"
              onIrDialogAfterHide={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.open = false;
              }}
            >
              {this.open && (
                <ir-property-switcher-dialog-content
                  onLinkedPropertyChange={e => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    this.handleDropdownSelect(Number(e.detail.property_id));
                  }}
                  open={this.open}
                  selectedPropertyId={this.selectedProperty?.PROPERTY_ID}
                  properties={this.linkedProperties}
                  onPropertySelected={this.handlePropertySelected}
                />
              )}
            </ir-dialog>
          </div>
        )}
      </Host>
    );
  }
}
