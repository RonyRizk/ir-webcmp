import { IRoomNightsDataEventPayload } from '@/models/property-types';
import { Component, Event, EventEmitter, h, Prop, State } from '@stencil/core';

@Component({
  tag: 'igl-rate-extender-drawer',
  styleUrl: 'igl-rate-extender-drawer.css',
  scoped: true,
})
export class IglRateExtenderDrawer {
  @Prop() open: boolean = false;
  @Prop() bookingNumber: string;
  @Prop() propertyId: number;
  @Prop() language: string;
  @Prop() identifier: string;
  @Prop() toDate: string;
  @Prop() fromDate: string;
  @Prop() pool: string;
  @Prop() ticket: string;
  @Prop() defaultDates: { from_date: string; to_date: string };

  @State() isLoading: boolean = false;
  @State() hasInventory: boolean = false;

  @Event() closeRoomNightsDialog: EventEmitter<IRoomNightsDataEventPayload>;

  private get label(): string {
    return `Adding Room Nights`;
  }

  private handleDrawerHide = (e: CustomEvent) => {
    e.stopImmediatePropagation();
    e.stopPropagation();
    this.hasInventory = false;
    this.closeRoomNightsDialog.emit({ type: 'cancel', pool: this.pool });
  };

  render() {
    return (
      <ir-drawer open={this.open} label={this.label} onDrawerHide={this.handleDrawerHide}>
        {this.open && (
          <igl-rate-extender-form
            bookingNumber={this.bookingNumber}
            propertyId={this.propertyId}
            language={this.language}
            identifier={this.identifier}
            toDate={this.toDate}
            fromDate={this.fromDate}
            pool={this.pool}
            defaultDates={this.defaultDates}
            onLoadingChanged={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.isLoading = e.detail;
            }}
            onAvailabilityChanged={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.hasInventory = e.detail;
            }}
            onCloseRoomNightsDialog={(e: CustomEvent<IRoomNightsDataEventPayload>) => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.closeRoomNightsDialog.emit(e.detail);
            }}
          ></igl-rate-extender-form>
        )}
        <div slot="footer" class={'ir__drawer-footer'}>
          <ir-custom-button size="m" appearance="filled" variant="neutral" data-drawer="close">
            Cancel
          </ir-custom-button>
          <ir-custom-button loading={this.isLoading} disabled={!this.hasInventory} size="m" type="submit" form="rate-extender-form" appearance="accent" variant="brand">
            Confirm
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
