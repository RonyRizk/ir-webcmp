import { Component, Element, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { AllowedProperties } from '@/services/property.service';

type AllowedProperty = NonNullable<AllowedProperties>[number];

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

  /** Emits whenever the user picks a property from the list. */
  @Event({ bubbles: true, composed: true }) propertySelected: EventEmitter<AllowedProperty>;

  @State() private properties: AllowedProperty[] = [];
  @State() private filteredProperties: AllowedProperty[] = [];
  @State() private searchTerm: string = '';
  @State() private highlightedIndex: number = -1;
  @State() private isLoading = false;
  @State() private error: string | null = null;

  // private propertyService = new PropertyService();
  private inputRef?: HTMLIrInputElement;

  componentWillLoad() {
    this.loadProperties();
  }

  @Watch('open')
  handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    requestAnimationFrame(() => {
      this.inputRef?.focusInput();
      this.resetFilters();
    });
  }

  @Watch('selectedPropertyId')
  handleSelectedPropertyIdChange() {
    this.syncHighlightedIndex();
  }

  private async loadProperties() {
    this.isLoading = true;
    this.error = null;
    try {
      // const result = await this.propertyService.getExposedAllowedProperties();
      // this.properties = Array.isArray(result) ? result : [];
      // this.applyFilters(true);
    } catch (error) {
      console.error('Failed to fetch allowed properties', error);
      this.error = (error as Error)?.message ?? 'Unable to fetch properties.';
      this.properties = [];
      this.applyFilters(true);
    } finally {
      this.isLoading = false;
    }
  }

  private resetFilters() {
    this.searchTerm = '';
    this.applyFilters(true);
  }

  private applyFilters(resetHighlight = false) {
    const query = this.searchTerm.trim().toLowerCase();
    const filtered = !query ? [...this.properties] : this.properties.filter(property => property.name.toLowerCase().includes(query));
    this.filteredProperties = filtered;

    if (!filtered.length) {
      this.highlightedIndex = -1;
      return;
    }

    if (resetHighlight) {
      const selectedIndex = this.getSelectedIndex(filtered);
      this.highlightedIndex = selectedIndex >= 0 ? selectedIndex : 0;
    } else {
      this.syncHighlightedIndex();
    }
    requestAnimationFrame(() => this.ensureHighlightedVisible());
  }

  private getSelectedIndex(list: AllowedProperty[]) {
    if (!this.selectedPropertyId) {
      return -1;
    }
    return list.findIndex(property => property.id === this.selectedPropertyId);
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
    this.applyFilters(true);
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

  private selectProperty(property?: AllowedProperty) {
    if (!property) {
      return;
    }
    this.propertySelected.emit(property);
  }

  private renderStatus(text: string) {
    return <div class="property-switcher__status">{text}</div>;
  }

  render() {
    return (
      <Host>
        <ir-input
          autoFocus
          ref={el => (this.inputRef = el)}
          placeholder="Find property"
          class="property-switcher__search-input"
          value={this.searchTerm}
          onText-change={this.handleSearchChange}
          onKeyDown={this.handleKeyDown}
          withClear
        ></ir-input>
        <div tabIndex={-1} class="property-switcher__results">
          {this.isLoading && this.renderStatus('Loading properties...')}
          {!this.isLoading && this.error && this.renderStatus(this.error)}
          {!this.isLoading && !this.error && this.filteredProperties.length === 0 && this.renderStatus('No properties found')}
          {!this.isLoading &&
            !this.error &&
            this.filteredProperties.map((property, index) => (
              <wa-option
                value={property.id?.toString()}
                onClick={() => this.selectProperty(property)}
                selected={this.selectedPropertyId === property.id}
                current={this.highlightedIndex === index}
              >
                {property.name}
              </wa-option>
            ))}
        </div>
      </Host>
    );
  }
}
