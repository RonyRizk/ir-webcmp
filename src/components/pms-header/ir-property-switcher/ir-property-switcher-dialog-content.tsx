import { Component, Element, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { FetchedProperty, LinkedProperty } from '@/services/property.service';
import axios from 'axios';
import { Debounce } from '../../../decorators/debounce';

/**
 * Internal component responsible for rendering the searchable list of properties inside the switcher dialog.
 * It owns the data fetching, filtering and keyboard navigation logic so the parent dialog stays lean.
 */
@Component({
  tag: 'ir-property-switcher-dialog-content',
  styleUrl: 'ir-property-switcher-dialog-content.css',
  scoped: true,
})
export class IrPropertySwitcherDialogContent {
  @Element() el: HTMLIrPropertySwitcherDialogContentElement;

  /** Whether the surrounding dialog is open. Used to focus and reset the search input as needed. */
  @Prop() open: boolean = false;

  /** ID of the property that is currently selected in the parent component. */
  @Prop() selectedPropertyId?: number;

  /** Linked properties provided by the parent switcher. */
  @Prop() properties: LinkedProperty[] = [];

  /** Emits whenever the user picks a property from the list. */
  @Event({ bubbles: true, composed: true }) propertySelected: EventEmitter<FetchedProperty['PROPERTY_ID']>;
  @Event({ bubbles: true, composed: true })
  linkedPropertyChange: EventEmitter<LinkedProperty>;

  @State() private filteredProperties: FetchedProperty[] = [];
  @State() private searchTerm: string = '';
  @State() private highlightedIndex: number = -1;

  private inputRef?: HTMLIrInputElement;
  private resetOnOpenFrame: number;
  private focusOnLoadFrame: number;

  @Watch('open')
  handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    this.resetOnOpenFrame = requestAnimationFrame(() => {
      // this.inputRef?.focusInput();
      this.resetSearch();
    });
  }

  componentDidLoad() {
    this.focusOnLoadFrame = requestAnimationFrame(() => {
      this.inputRef?.focusInput();
    });
  }

  disconnectedCallback() {
    if (this.resetOnOpenFrame) cancelAnimationFrame(this.resetOnOpenFrame);
    if (this.focusOnLoadFrame) cancelAnimationFrame(this.focusOnLoadFrame);
  }

  @Watch('selectedPropertyId')
  handleSelectedPropertyIdChange() {
    this.syncHighlightedIndex();
  }

  private resetSearch() {
    this.searchTerm = '';
    this.filteredProperties = [];
    this.highlightedIndex = -1;
  }

  @Debounce(300)
  private async fetchProperties(searchTerm: string) {
    const query = searchTerm.trim();
    if (!query) {
      this.filteredProperties = [];
      this.highlightedIndex = -1;
      return;
    }

    try {
      const { data } = await axios.post('/Fetch_Properties', { SEARCH_TERM: query });
      const properties = data.My_Result;
      this.filteredProperties = properties;
    } catch (error) {
      console.error('Failed to fetch properties', error);
      this.filteredProperties = [];
    }

    if (!this.filteredProperties.length) {
      this.highlightedIndex = -1;
      return;
    }

    const selectedIndex = this.getSelectedIndex(this.filteredProperties);
    this.highlightedIndex = selectedIndex >= 0 ? selectedIndex : 0;
    requestAnimationFrame(() => this.ensureHighlightedVisible());
  }

  private getSelectedIndex(list: FetchedProperty[]) {
    if (!this.selectedPropertyId) {
      return -1;
    }
    return list.findIndex(property => this.getPropertyId(property) === this.selectedPropertyId);
  }

  private syncHighlightedIndex() {
    if (!this.filteredProperties.length) {
      this.highlightedIndex = -1;
      return;
    }
    const selectedIndex = this.getSelectedIndex(this.filteredProperties);
    if (selectedIndex >= 0) {
      this.highlightedIndex = selectedIndex;
      return;
    }
    this.highlightedIndex = Math.min(Math.max(this.highlightedIndex, 0), this.filteredProperties.length - 1);
  }

  private handleSearchChange = (event: CustomEvent<string>) => {
    this.searchTerm = event.detail ?? '';
    this.fetchProperties(this.searchTerm);
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (!this.filteredProperties.length) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(this.filteredProperties.length - 1, this.highlightedIndex + 1);
        this.ensureHighlightedVisible();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(0, this.highlightedIndex - 1);
        this.ensureHighlightedVisible();
        break;
      case 'Enter':
        event.preventDefault();
        this.selectProperty(this.filteredProperties[this.highlightedIndex]);
        break;
    }
  };

  private ensureHighlightedVisible() {
    if (this.highlightedIndex < 0) {
      return;
    }
    const options = this.el.querySelectorAll('wa-option');
    const option = options?.[this.highlightedIndex];
    option?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  private selectProperty(property?: FetchedProperty | LinkedProperty) {
    if (!property) {
      return;
    }
    const propertyId = this.getPropertyId(property);
    if (typeof propertyId !== 'number') {
      return;
    }
    this.propertySelected.emit(propertyId);
  }

  private getPropertyId(property: FetchedProperty | LinkedProperty) {
    return 'PROPERTY_ID' in property ? property.PROPERTY_ID : property.property_id;
  }

  private renderStatus(text: string) {
    return <div class="property-switcher__status">{text}</div>;
  }

  render() {
    return (
      <Host>
        <ir-input
          autofocus
          ref={el => (this.inputRef = el)}
          placeholder="Property name or A number"
          class="property-switcher__search-input"
          value={this.searchTerm}
          onText-change={this.handleSearchChange}
          onKeyDown={this.handleKeyDown}
          withClear
        ></ir-input>
        <div tabIndex={-1} class="property-switcher__results">
          {!this.searchTerm && this.properties?.length > 0 && (
            <div>
              <p style={{ padding: '1rem', margin: '0', paddingTop: '0' }}>Linked Properties</p>
              {this.properties.map(property => {
                const label = `${property.name}`;
                return (
                  <wa-option
                    onClick={() => {
                      // this.selectProperty(property as any);
                      this.linkedPropertyChange.emit(property);
                    }}
                    selected={this.selectedPropertyId === property.property_id}
                    value={property.property_id?.toString()}
                    label={label}
                  >
                    {label}
                  </wa-option>
                );
              })}
            </div>
          )}
          {this.searchTerm && this.filteredProperties.length === 0 && this.renderStatus('No properties found')}
          {this.filteredProperties.map((property, index) => {
            const label = `${property.COUNTRY_CODE}: ${property.PROPERTY_NAME} - ${property.A_NAME}`;
            return (
              <wa-option
                onClick={() => this.selectProperty(property)}
                selected={this.selectedPropertyId === property.PROPERTY_ID}
                current={this.highlightedIndex === index}
                value={property.PROPERTY_ID?.toString()}
                label={label}
              >
                {label}
              </wa-option>
            );
          })}
        </div>
      </Host>
    );
  }
}
