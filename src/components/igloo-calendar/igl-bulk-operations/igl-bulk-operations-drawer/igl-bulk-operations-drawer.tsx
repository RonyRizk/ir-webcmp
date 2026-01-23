import { IrToast } from '@/components/ui/ir-toast/ir-toast';
import { Component, Event, EventEmitter, Host, Listen, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'igl-bulk-operations-drawer',
  styleUrl: 'igl-bulk-operations-drawer.css',
  scoped: true,
})
export class IglBulkOperationsDrawer {
  @Prop({ reflect: true }) open: boolean;
  @Prop() maxDatesLength = 8;
  @Prop() property_id: number;

  @Event() closeDrawer: EventEmitter<null>;
  @Event() toast: EventEmitter<IrToast>;

  @State() selectedTab: string = 'stop-sale';
  @State() isLoading: boolean;

  private formId = `bulk-operations-form`;

  private tabs = [
    {
      id: 'stop-sale',
      label: 'Stop/Open Sale',
    },
    {
      id: 'block',
      label: 'Block Unit',
    },
    {
      id: 'rectifier',
      label: 'Rectify Availability',
    },
  ];

  @Listen('loadingChanged')
  handleLoadingChange(e: CustomEvent<boolean>) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.isLoading = e.detail;
  }
  private handleDrawerClose(e: CustomEvent) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.closeDrawer.emit();
  }

  render() {
    const formId = `${this.formId}-${this.selectedTab}`;
    return (
      <Host>
        <ir-drawer label="Bulk Availability Operations" open={this.open} class="bulk-operations__drawer">
          {this.open && (
            <wa-tab-group class="bulk-operations__tab-group" active={this.selectedTab} activation="manual" onwa-tab-show={e => (this.selectedTab = e.detail.name?.toString())}>
              {this.tabs.map(tab => (
                <wa-tab panel={tab.id}>{tab.label}</wa-tab>
              ))}
              <wa-tab-panel name="stop-sale">
                {this.selectedTab === 'stop-sale' && (
                  <igl-bulk-stop-sale
                    onCloseDrawer={this.handleDrawerClose.bind(this)}
                    maxDatesLength={this.maxDatesLength}
                    formId={formId}
                    property_id={this.property_id}
                  ></igl-bulk-stop-sale>
                )}
              </wa-tab-panel>
              <wa-tab-panel name="block">
                {this.selectedTab === 'block' && (
                  <igl-bulk-block
                    onCloseDrawer={this.handleDrawerClose.bind(this)}
                    formId={formId}
                    maxDatesLength={this.maxDatesLength}
                    property_id={this.property_id}
                  ></igl-bulk-block>
                )}
              </wa-tab-panel>
              <wa-tab-panel name="rectifier">
                {this.selectedTab === 'rectifier' && <ir-rectifier onCloseDrawer={this.handleDrawerClose.bind(this)} formId={formId}></ir-rectifier>}
              </wa-tab-panel>
            </wa-tab-group>
          )}
          <div slot="footer" class="ir__drawer-footer">
            <ir-custom-button size="medium" variant="neutral" appearance="filled" data-drawer="close">
              Cancel
            </ir-custom-button>
            <ir-custom-button loading={this.isLoading} type="submit" form={formId} size="medium" variant="brand">
              Confirm
            </ir-custom-button>
          </div>
        </ir-drawer>
      </Host>
    );
  }
}
