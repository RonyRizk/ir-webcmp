import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { v4 } from 'uuid';

@Component({
  tag: 'ir-rectifier-drawer',
  styleUrl: 'ir-rectifier-drawer.css',
  scoped: true,
})
export class IrRectifierDrawer {
  @Prop({ reflect: true }) open: boolean;

  @Event() closeDrawer: EventEmitter<void>;

  @State() isLoading: boolean;

  private formId = `rectifier-form__id-${v4()}`;

  private handleDrawerClose(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.closeDrawer.emit();
  }

  private handleLoadingChange(e: CustomEvent<boolean>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.isLoading = e.detail;
  }

  render() {
    return (
      <Host>
        <ir-drawer onDrawerHide={this.handleDrawerClose.bind(this)} label="Rectify/Extend Availability" open={this.open} class="rectifier__drawer">
          {this.open && <ir-rectifier formId={this.formId} onCloseDrawer={this.handleDrawerClose.bind(this)} onLoadingChanged={this.handleLoadingChange.bind(this)}></ir-rectifier>}
          <div slot="footer" class="ir__drawer-footer">
            <ir-custom-button size="m" variant="neutral" appearance="filled" data-drawer="close">
              Cancel
            </ir-custom-button>
            <ir-custom-button loading={this.isLoading} type="submit" form={this.formId} size="m" variant="brand">
              Confirm
            </ir-custom-button>
          </div>
        </ir-drawer>
      </Host>
    );
  }
}
