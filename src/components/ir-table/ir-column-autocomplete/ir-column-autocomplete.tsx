import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';

export interface ColumnAutocompleteSelectionChange {
  query: string;
  selected: string[];
}

@Component({
  tag: 'ir-column-autocomplete',
  styleUrl: 'ir-column-autocomplete.css',
  scoped: true,
})
export class IrColumnAutocomplete {
  @Prop() options: string[] = [];
  @Prop() selectedValues: string[] = [];
  @Prop() placeholder: string = 'Search...';
  @Prop() selectAllLabel: string = 'Select all';
  @Prop() emptyLabel: string = 'No results found';
  @Prop() showSelectAll: boolean = true;
  @Prop() triggerId?: string;

  @State() query: string = '';
  @State() normalizedOptions: string[] = [];
  @State() selected: string[] = [];

  @Event() queryChange: EventEmitter<string>;
  @Event() autocompleteSelectionChange: EventEmitter<ColumnAutocompleteSelectionChange>;

  private static instanceCount = 0;
  private generatedTriggerId: string;

  componentWillLoad() {
    IrColumnAutocomplete.instanceCount += 1;
    this.generatedTriggerId = this.triggerId ?? `ir-column-autocomplete-trigger-${IrColumnAutocomplete.instanceCount}`;
    this.normalizedOptions = this.normalizeOptions(this.options);
    this.selected = this.normalizeSelection(this.selectedValues);
  }

  @Watch('options')
  handleOptionsChange(newOptions: string[]) {
    this.normalizedOptions = this.normalizeOptions(newOptions);
    this.selected = this.selected.filter(item => this.normalizedOptions.includes(item));
  }

  @Watch('selectedValues')
  handleSelectedValuesChange(newSelectedValues: string[]) {
    this.selected = this.normalizeSelection(newSelectedValues);
  }

  private normalizeOptions(values: string[] = []): string[] {
    const uniqueValues = new Set(values.filter(Boolean).map(v => String(v)));
    return Array.from(uniqueValues);
  }

  private normalizeSelection(values: string[] = []): string[] {
    if (!Array.isArray(values)) return [];
    const uniqueValues = new Set(values.filter(Boolean).map(v => String(v)));
    return Array.from(uniqueValues).filter(v => this.normalizedOptions.includes(v));
  }

  private get filteredOptions(): string[] {
    const trimmedQuery = this.query.trim().toLowerCase();
    if (!trimmedQuery) return this.normalizedOptions;
    return this.normalizedOptions.filter(option => option.toLowerCase().includes(trimmedQuery));
  }

  private get areAllFilteredSelected(): boolean {
    const filtered = this.filteredOptions;
    if (!filtered.length) return false;
    return filtered.every(option => this.selected.includes(option));
  }

  private get areSomeFilteredSelected(): boolean {
    const filtered = this.filteredOptions;
    if (!filtered.length) return false;
    const selectedCount = filtered.filter(option => this.selected.includes(option)).length;
    return selectedCount > 0 && selectedCount < filtered.length;
  }

  private emitSelectionChange() {
    this.autocompleteSelectionChange.emit({
      query: this.query,
      selected: this.selected,
    });
  }

  private onQueryInput = (event: Event) => {
    this.query = ((event.target as HTMLInputElement)?.value ?? '').toString();
    this.queryChange.emit(this.query);
  };

  private onToggleAll = (event: Event) => {
    const checked = (event.target as HTMLInputElement)?.checked;
    const filtered = this.filteredOptions;
    const selectedSet = new Set(this.selected);

    if (checked) {
      filtered.forEach(value => selectedSet.add(value));
    } else {
      filtered.forEach(value => selectedSet.delete(value));
    }

    this.selected = Array.from(selectedSet);
    this.emitSelectionChange();
  };

  private onToggleOption = (event: Event, option: string) => {
    const checked = (event.target as HTMLInputElement)?.checked;
    if (checked) {
      if (!this.selected.includes(option)) {
        this.selected = [...this.selected, option];
      }
    } else {
      this.selected = this.selected.filter(value => value !== option);
    }
    this.emitSelectionChange();
  };

  render() {
    const filteredOptions = this.filteredOptions;

    return (
      <Host>
        <wa-popover placement="bottom" for={this.generatedTriggerId} class="column-autocomplete__popover">
          <div class="column-autocomplete__input-container">
            <wa-input size="s" value={this.query} placeholder={this.placeholder} oninput={this.onQueryInput}></wa-input>
          </div>
          <div class="column-autocomplete__list">
            {this.showSelectAll && (
              <wa-checkbox checked={this.areAllFilteredSelected} indeterminate={this.areSomeFilteredSelected} onchange={this.onToggleAll}>
                {this.selectAllLabel}
              </wa-checkbox>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <wa-checkbox checked={this.selected.includes(option)} onchange={event => this.onToggleOption(event, option)}>
                  {option}
                </wa-checkbox>
              ))
            ) : (
              <div class="column-autocomplete__empty">{this.emptyLabel}</div>
            )}
          </div>
        </wa-popover>

        <div id={this.generatedTriggerId}>
          <slot name="trigger">
            <wa-button size="s" variant="neutral" appearance="plain" class="header-button">
              <wa-icon name="filter"></wa-icon>
            </wa-button>
          </slot>
        </div>
      </Host>
    );
  }
}
