import { Component, Element, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';

import { FetchedProperty, LinkedProperty } from '@/services/property.service';
import { GetACByACID } from './legacy.types';
import Token from '@/models/Token';
import axios from 'axios';
import WaDropdownItem from '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item';

type SwitcherMode = 'dropdown' | 'dialog' | 'read-only';

// Unified property state
interface PropertyState {
  selected: FetchedProperty | null;
  linked: LinkedProperty[];
  source: 'storage' | 'external' | 'user-selection';
}

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

  // NEW: Allow external property binding
  @Prop({ mutable: true }) propertyId?: number;
  @Prop({ mutable: true }) selectedLinkedPropertyId?: number;

  @State() open = false;
  @State() isLinkedLoading = false;
  @State() linkedLoaded = false;
  @State() hasPool = false;
  @State() propertyState: PropertyState = {
    selected: null,
    linked: [],
    source: 'storage',
  };
  @State() displayMode: SwitcherMode = 'read-only';

  private token = new Token();

  /** Single unified event - emitted when dialog confirms selection OR dropdown selects linked property */
  @Event({ bubbles: true, composed: true })
  propertyChange: EventEmitter<{
    property: GetACByACID;
    linkedProperty: LinkedProperty | null;
    allLinkedProperties: LinkedProperty[];
  }>;

  private storagePoller?: number;
  private userInfoPoller?: number;
  private lastSelectedAcRaw: string | null = null;
  private lastUserInfoRaw: string | null = null;
  private isUpdating = false; // Prevent circular updates

  async componentWillLoad() {
    if (this.baseUrl) this.token.setBaseUrl(this.baseUrl);
    if (this.ticket) {
      this.token.setToken(this.ticket);
      await this.init();
    }

    window.addEventListener('storage', this.handleStorageEvent);
  }

  disconnectedCallback() {
    this.stopPolling();
    window.removeEventListener('storage', this.handleStorageEvent);
  }

  @Watch('ticket')
  async handleTicketChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.token.setToken(newValue);
      await this.init();
    }
  }

  // NEW: React to external property ID changes
  @Watch('propertyId')
  async handlePropertyIdChange(newId: number | undefined) {
    if (this.isUpdating) return;
    if (newId && newId !== this.propertyState.selected?.PROPERTY_ID) {
      // External changes don't emit propertyChange event
      await this.loadPropertyById(newId, 'external', undefined, false);
    }
  }

  @Watch('selectedLinkedPropertyId')
  handleLinkedPropertyIdChange(newId: number | undefined) {
    // Validate that the linked property exists
    if (newId && !this.propertyState.linked.find(p => p.property_id === newId)) {
      console.warn(`Linked property ${newId} not found in available properties`);
    }
  }

  private async init() {
    await this.pollSelectedAcStorage();
    this.pollUserInfoStorage();

    if (!this.propertyState.selected) {
      this.startPolling();
    }
  }

  private startPolling() {
    if (this.storagePoller) return;
    this.storagePoller = window.setInterval(() => {
      this.pollSelectedAcStorage();
      this.pollUserInfoStorage();
    }, 300);
  }

  private stopPolling() {
    if (this.storagePoller) {
      clearInterval(this.storagePoller);
      this.storagePoller = undefined;
    }
    if (this.userInfoPoller) {
      clearInterval(this.userInfoPoller);
      this.userInfoPoller = undefined;
    }
  }

  private handleStorageEvent = () => {
    this.startPolling();
  };

  private pollSelectedAcStorage = async () => {
    const selectedAcRaw = localStorage.getItem('_Selected_Ac');

    if (selectedAcRaw === this.lastSelectedAcRaw) return;
    this.lastSelectedAcRaw = selectedAcRaw;

    if (!selectedAcRaw) return;

    let selectedAc: GetACByACID;
    try {
      selectedAc = JSON.parse(selectedAcRaw);
    } catch {
      return;
    }

    await this.updatePropertyState(selectedAc, null, 'storage');
    this.stopPolling();
  };

  private pollUserInfoStorage = () => {
    const userInfoRaw = localStorage.getItem('UserInfo_b');

    if (userInfoRaw === this.lastUserInfoRaw) return;
    this.lastUserInfoRaw = userInfoRaw;

    if (!userInfoRaw) return;

    this.resolveDisplayMode();
    if (this.userInfoPoller) {
      clearInterval(this.userInfoPoller);
      this.userInfoPoller = undefined;
    }
  };

  // NEW: Unified state update method
  private async updatePropertyState(
    selectedAc: GetACByACID,
    linkedProperty: LinkedProperty | null,
    source: PropertyState['source'],
    emitEvent: boolean = false, // Control when to emit propertyChange
  ) {
    this.isUpdating = true;

    const selected: FetchedProperty = {
      A_NAME: selectedAc.My_User?.USERNAME ?? '',
      COUNTRY_CODE: selectedAc.COUNTRY_ID as any,
      COUNTRY_NAME: selectedAc.My_Country?.L1_NAME_REF ?? '',
      PROPERTY_ID: selectedAc.AC_ID,
      PROPERTY_NAME: selectedAc.NAME,
    };

    const hasPool = Boolean(selectedAc.POOL);
    const sameProperty = this.propertyState.selected?.PROPERTY_ID === selectedAc.AC_ID;
    const keepLinked = sameProperty && this.linkedLoaded && hasPool;
    const linked = keepLinked ? this.propertyState.linked : [];

    // Update state atomically
    this.propertyState = {
      selected,
      linked,
      source,
    };
    this.hasPool = hasPool;
    this.linkedLoaded = keepLinked;
    if (!keepLinked) {
      this.isLinkedLoading = false;
    }

    // Sync external props
    this.propertyId = selected.PROPERTY_ID;
    this.selectedLinkedPropertyId = linkedProperty?.property_id;

    this.resolveDisplayMode();

    // Only emit event when explicitly requested (user selection from dialog)
    if (emitEvent) {
      this.propertyChange.emit({
        property: selectedAc,
        linkedProperty,
        allLinkedProperties: linked,
      });
    }

    if (this.open) {
      this.ensureLinkedPropertiesLoaded();
    }

    this.isUpdating = false;
  }

  private async ensureLinkedPropertiesLoaded() {
    if (!this.hasPool || this.linkedLoaded || this.isLinkedLoading) return;
    if (!this.propertyState.selected?.PROPERTY_ID) return;

    this.isLinkedLoading = true;
    const linked = await this.fetchLinkedProperties(this.propertyState.selected.PROPERTY_ID);
    this.propertyState = {
      ...this.propertyState,
      linked,
    };
    this.linkedLoaded = true;
    this.isLinkedLoading = false;
  }

  private async fetchLinkedProperties(acId: number): Promise<LinkedProperty[]> {
    try {
      const { data } = await axios.post(`${this.baseUrl ?? ''}/Fetch_Linked_Properties`, {
        property_id: acId,
      });

      if (data.ExceptionMsg) {
        throw new Error(data.ExceptionMsg);
      }

      return Array.isArray(data.My_Result) ? data.My_Result : [];
    } catch (error) {
      console.error('Failed to fetch linked properties', error);
      return [];
    }
  }

  private resolveDisplayMode() {
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

    if (!this.propertyState?.selected || !this.hasPool) {
      this.displayMode = 'read-only';
      return;
    }

    this.displayMode = 'dropdown';
  }

  private handlePropertySelected = async (event: CustomEvent<FetchedProperty['PROPERTY_ID']>) => {
    event.stopImmediatePropagation();
    event.stopPropagation();
    // This is the ONLY place where propertyChange event is emitted
    // Only fired when dialog content confirms selection
    await this.loadPropertyById(event.detail, 'user-selection', undefined, true);
  };

  private handleDropdownSelect = async (selectedProperty: LinkedProperty['property_id']) => {
    const selectedId = Number(selectedProperty);
    const linkedProperty = this.propertyState.linked.find(p => p.property_id === selectedId);
    if (!linkedProperty) return;

    // Dropdown selection also emits propertyChange with linkedProperty context
    await this.loadPropertyById(linkedProperty.property_id, 'user-selection', linkedProperty, true);
  };

  // NEW: Consolidated loading method
  private async loadPropertyById(
    propertyId: number,
    source: PropertyState['source'],
    linkedProperty?: LinkedProperty,
    emitEvent: boolean = false, // Only emit when true
  ) {
    if (this.isUpdating) return;

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

      await this.updatePropertyState(data.My_Result, linkedProperty ?? null, source, emitEvent);
    } catch (error) {
      console.error('Failed to fetch selected property details', error);
    }
  }

  private renderReadOnly() {
    return <p class="property-switcher__trigger">{this.propertyState.selected?.PROPERTY_NAME ?? 'Property'}</p>;
  }

  private trigger() {
    return (
      <wa-button
        size="small"
        withCaret
        class="property-switcher__trigger-btn"
        variant="neutral"
        appearance="outlined"
        onClick={() => {
          this.open = !this.open;
          if (this.open) {
            this.ensureLinkedPropertiesLoaded();
          }
        }}
      >
        <p class="property-switcher__trigger">{this.propertyState.selected?.PROPERTY_NAME ?? 'Select property'}</p>
      </wa-button>
    );
  }

  render() {
    return (
      <Host>
        {this.displayMode === 'read-only' && this.renderReadOnly()}

        {this.displayMode === 'dropdown' && (
          <wa-dropdown
            onwa-show={() => {
              this.ensureLinkedPropertiesLoaded();
            }}
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
            <wa-button size="small" class="property-switcher__trigger-btn" slot="trigger" withCaret variant="neutral" appearance="outlined">
              <p class="property-switcher__trigger">{this.propertyState.selected?.PROPERTY_NAME}</p>
            </wa-button>
            {this.isLinkedLoading && (
              <wa-dropdown-item disabled class="property-switcher__dropdown-loader">
                <wa-spinner></wa-spinner>
              </wa-dropdown-item>
            )}
            {this.propertyState.linked?.map(property => (
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
              // withoutHeader
              open={this.open}
              label="Search"
              class="property-switcher__dialog"
              style={{ '--ir-dialog-width': '40rem' }}
              onIrDialogAfterHide={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.open = false;
              }}
            >
              {this.open &&
                (this.isLinkedLoading ? (
                  <div class="property-switcher__loader">
                    <ir-spinner></ir-spinner>
                  </div>
                ) : (
                  <ir-property-switcher-dialog-content
                    onLinkedPropertyChange={e => {
                      e.stopImmediatePropagation();
                      e.stopPropagation();
                      this.handleDropdownSelect(Number(e.detail.property_id));
                    }}
                    open={this.open}
                    selectedPropertyId={this.propertyState.selected?.PROPERTY_ID}
                    properties={this.propertyState.linked}
                    onPropertySelected={this.handlePropertySelected}
                  />
                ))}
            </ir-dialog>
          </div>
        )}
      </Host>
    );
  }
}
