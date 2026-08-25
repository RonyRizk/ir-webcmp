import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { v4 } from 'uuid';
import { ExtraServiceDefinition, ExtraServiceSection } from '@/services/extra-services/types';

@Component({
  tag: 'ir-extra-service-editor-drawer',
  styleUrl: 'ir-extra-service-editor-drawer.css',
  scoped: true,
})
export class IrExtraServiceEditorDrawer {
  @Prop({ reflect: true }) open: boolean = false;
  @Prop() service?: ExtraServiceDefinition;

  @State() loading: boolean = false;

  @Event() extraServiceEditorClose: EventEmitter<void>;

  private baseId = `extra-service-form__id-${v4()}`;

  private handleDrawerClose(e: CustomEvent<{ source: Element }>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    if (!e.detail) {
      return;
    }
    this.extraServiceEditorClose.emit();
  }

  render() {
    const isAddon = this.service?.section === ExtraServiceSection.BookingEngineAddon;
    const isNewAddon = isAddon && this.service?.id === -1;
    return (
      <Host data-testid="extra-service-editor-drawer">
        <ir-drawer
          class="extra-service__drawer"
          style={{ '--ir-drawer-width': '32rem' }}
          label={isNewAddon ? 'New Add-On' : `Edit ${this.service?.name ?? 'Extra Service'}`}
          open={this.open}
          data-testid="extra-service-editor-drawer-container"
          onDrawerHide={e => this.handleDrawerClose(e)}
        >
          {this.open && (
            <ir-extra-service-editor-form
              onCloseDrawer={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.extraServiceEditorClose.emit();
              }}
              onLoadingChanged={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.loading = e.detail;
              }}
              service={this.service}
              formId={this.baseId}
              data-testid="extra-service-editor-form"
            ></ir-extra-service-editor-form>
          )}
          <div slot="footer" class="ir__drawer-footer" data-testid="extra-service-editor-drawer-footer">
            <ir-custom-button size="m" data-drawer="close" appearance="filled" variant="neutral" data-testid="extra-service-editor-cancel-button">
              Cancel
            </ir-custom-button>
            <ir-custom-button loading={this.loading} type="submit" form={this.baseId} size="m" appearance="accent" variant="brand" data-testid="extra-service-editor-save-button">
              Save
            </ir-custom-button>
          </div>
        </ir-drawer>
      </Host>
    );
  }
}
