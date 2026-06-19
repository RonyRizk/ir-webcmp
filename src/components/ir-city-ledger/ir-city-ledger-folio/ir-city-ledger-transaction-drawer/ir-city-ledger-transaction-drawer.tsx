import { Component, Event, EventEmitter, Prop, State, h } from '@stencil/core';
import type { LinkedOption, ServiceCategoryOption, TransactionType } from './ir-city-ledger-transaction-form/ir-city-ledger-transaction-form.schema';
import { Agent } from '@/services/agents/type';
import { Booking } from '@/models/booking.dto';
import type { ClTx } from '@/services/city-ledger';

@Component({
  tag: 'ir-city-ledger-transaction-drawer',
  styleUrl: 'ir-city-ledger-transaction-drawer.css',
  scoped: true,
})
export class IrCityLedgerTransactionDrawer {
  @Prop({ reflect: true }) open: boolean = false;
  @Prop() formId: string = 'city-ledger-transaction-form';
  @Prop() drawerLabel: string = 'New Entry';
  @Prop() agent: Agent | null = null;
  @Prop() booking: Booking | null = null;
  @Prop() initialTransactionType: TransactionType = 'OB';
  @Prop() unpaidInvoiceOptions: LinkedOption[] = [];
  @Prop() bookingOptions: LinkedOption[] = [];
  @Prop() serviceCategoryOptions: ServiceCategoryOption[] = [];
  @Prop() transaction: ClTx | null = null;

  @State() saveDisabled: boolean = false;

  @Event() closeDrawer: EventEmitter<void>;
  @Event() transactionSaved: EventEmitter<void>;

  private stopEventPropagation(event: Event) {
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  render() {
    return (
      <ir-drawer
        open={this.open}
        style={{
          '--ir-drawer-width': '40rem',
          '--ir-drawer-background-color': 'var(--wa-color-surface-default)',
          '--ir-drawer-padding-left': 'var(--spacing)',
          '--ir-drawer-padding-right': 'var(--spacing)',
          '--ir-drawer-padding-top': 'var(--spacing)',
          '--ir-drawer-padding-bottom': 'var(--spacing)',
        }}
        label={this.drawerLabel}
        onDrawerHide={event => {
          this.stopEventPropagation(event);
          if (event.detail) {
            this.closeDrawer.emit();
          }
        }}
      >
        {this.open && (
          <ir-city-ledger-transaction-form
            booking={this.booking}
            formId={this.formId}
            agent={this.agent}
            initialTransactionType={this.initialTransactionType}
            unpaidInvoiceOptions={this.unpaidInvoiceOptions}
            bookingOptions={this.bookingOptions}
            serviceCategoryOptions={this.serviceCategoryOptions}
            transaction={this.transaction}
            onTransactionSaved={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.transactionSaved.emit();
              this.closeDrawer.emit();
            }}
            onSubmitDisabledChange={(e: CustomEvent<boolean>) => {
              this.saveDisabled = e.detail;
            }}
          ></ir-city-ledger-transaction-form>
        )}

        <div slot="footer" class={'ir__drawer-footer'}>
          <ir-custom-button appearance="filled" size="m" variant="neutral" class="city-ledger-transaction-drawer__btn" onClickHandler={() => this.closeDrawer.emit()}>
            Cancel
          </ir-custom-button>
          <ir-custom-button form={this.formId} size="m" type="submit" variant="brand" class="city-ledger-transaction-drawer__btn" disabled={this.saveDisabled}>
            Save
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
