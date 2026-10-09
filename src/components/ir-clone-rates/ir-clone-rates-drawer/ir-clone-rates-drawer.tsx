import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-clone-rates-drawer',
  styleUrl: 'ir-clone-rates-drawer.css',
  scoped: true,
})
export class IrCloneRatesDrawer {
  @Prop() open: boolean = false;
  @Prop() ticket: string;
  @Prop() p: string;
  @Prop() language: string = 'en';
  @Prop() propertyid: number;

  /** Fired when the drawer closes: Cancel, the close button, Escape, light dismiss, or a successful copy. The parent should set `open` to false. */
  @Event() cloneRatesDrawerClosed: EventEmitter<void>;

  private handleDrawerHide = (e: CustomEvent) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.cloneRatesDrawerClosed.emit();
  };

  render() {
    return (
      <ir-drawer open={this.open} label="Copy rates to future dates" onDrawerHide={this.handleDrawerHide}>
        {this.open && (
          <ir-clone-rates
            mode="drawer"
            ticket={this.ticket}
            p={this.p}
            language={this.language}
            propertyid={this.propertyid}
            onRatesCloned={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.cloneRatesDrawerClosed.emit();
            }}
          ></ir-clone-rates>
        )}
        <div slot="footer" class="ir__drawer-footer">
          <ir-custom-button size="m" appearance="filled" variant="neutral" data-drawer="close">
            Cancel
          </ir-custom-button>
          <ir-custom-button size="m" variant="brand" type="submit" form="clone-rates-form">
            Review
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
