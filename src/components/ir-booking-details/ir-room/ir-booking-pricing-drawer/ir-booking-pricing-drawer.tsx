import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import { Booking, IUnit, Room } from '@/models/booking.dto';
import { ClTx } from '@/services/city-ledger/types';
import { Agent } from '@/services/agents/type';

@Component({
  tag: 'ir-booking-pricing-drawer',
  styleUrl: 'ir-booking-pricing-drawer.css',
  scoped: true,
})
export class IrBookingPricingDrawer {
  @Prop({ reflect: true }) open: boolean = false;
  @Prop() formId: string = 'booking-pricing-form';
  @Prop() booking: Booking;
  @Prop() room: Room;
  @Prop() agent: Agent | null = null;
  @Prop() folioEntries: ClTx[] = [];
  @Prop() currencySymbol: string = '';

  @State() saveDisabled: boolean = false;
  @State() allItemsDisabled: boolean = false;

  @Event() closeDrawer: EventEmitter<void>;
  @Event() pricingSaved: EventEmitter<void>;

  private get drawerLabel(): string {
    if (!this.room) return 'Edit Nightly Rates';
    const parts = [this.room.roomtype?.name, this.room.rateplan?.short_name].filter(Boolean);
    const unitName = (this.room.unit as IUnit)?.name;
    if (unitName) parts.push(unitName);
    return parts.join(' ');
  }

  private stopEventPropagation(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  render() {
    return (
      <ir-drawer
        open={this.open}
        label={this.drawerLabel}
        style={{
          '--ir-drawer-width': '40rem',
          '--ir-drawer-background-color': 'var(--wa-color-surface-default)',
          '--ir-drawer-padding-left': 'var(--spacing)',
          '--ir-drawer-padding-right': 'var(--spacing)',
          '--ir-drawer-padding-top': 'var(--spacing)',
          '--ir-drawer-padding-bottom': 'var(--spacing)',
        }}
        onDrawerHide={event => {
          this.stopEventPropagation(event);
          if (event.detail) {
            this.allItemsDisabled = false;
            this.closeDrawer.emit();
          }
        }}
      >
        {this.open && (
          <ir-booking-pricing-form
            formId={this.formId}
            booking={this.booking}
            room={this.room}
            agent={this.agent}
            folioEntries={this.folioEntries}
            currencySymbol={this.currencySymbol}
            onPricingSaved={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.pricingSaved.emit();
              this.closeDrawer.emit();
            }}
            onSubmitDisabledChange={(e: CustomEvent<boolean>) => {
              this.saveDisabled = e.detail;
            }}
            onAllDisabled={(e: CustomEvent<boolean>) => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.allItemsDisabled = e.detail;
            }}
          ></ir-booking-pricing-form>
        )}

        <div slot="footer" class="ir__drawer-footer">
          <ir-custom-button appearance="filled" size="medium" variant="neutral" onClickHandler={() => this.closeDrawer.emit()}>
            Cancel
          </ir-custom-button>
          <ir-custom-button form={this.formId} size="medium" type="submit" variant="brand" loading={this.saveDisabled} disabled={this.allItemsDisabled}>
            Confirm
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
