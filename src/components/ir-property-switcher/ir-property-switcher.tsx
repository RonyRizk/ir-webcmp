import { Component, Element, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { AllowedProperties } from '@/services/property.service';

type AllowedProperty = NonNullable<AllowedProperties>[number];

@Component({
  tag: 'ir-property-switcher',
  styleUrl: 'ir-property-switcher.css',
  scoped: true,
})
export class IrPropertySwitcher {
  @Element() el: HTMLIrPropertySwitcherElement;

  @Prop() mode: 'dropdown' | 'dialog' = 'dialog';

  @State() open: boolean = false;
  @State() selectedProperty?: AllowedProperty;

  /** Emits whenever the user selects a new property from the switcher dialog. */
  @Event({ bubbles: true, composed: true }) propertyChange: EventEmitter<AllowedProperty>;

  private trigger() {
    return (
      <ir-custom-button
        onClickHandler={() => {
          this.open = !this.open;
        }}
        withCaret
        variant="neutral"
        appearance="plain"
      >
        <p class="property-switcher__trigger">
          {this.selectedProperty?.name ?? 'Select property'}
        </p>
      </ir-custom-button>
    );
  }

  private handlePropertySelected = (event: CustomEvent<AllowedProperty>) => {
    this.selectedProperty = event.detail;
    this.open = false;
    this.propertyChange.emit(event.detail);
  };

  render() {
    return (
      <Host>
        {this.trigger()}
        <ir-dialog
          onIrDialogAfterHide={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();

            this.open = false;
          }}
          withoutHeader
          open={this.open}
          label="Find property"
          class="property-switcher__dialog"
        >
          {this.open && (
            <ir-property-switcher-dialog-content
              open={this.open}
              selectedPropertyId={this.selectedProperty?.id}
              onPropertySelected={this.handlePropertySelected}
            ></ir-property-switcher-dialog-content>
          )}
        </ir-dialog>
      </Host>
    );
  }
}
