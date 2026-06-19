import { Booking, ExtraService } from '@/models/booking.dto';
import { Agent } from '@/services/agents/type';
import { IEntries } from '@/models/property';
import { isRequestPending } from '@/stores/ir-interceptor.store';
import locales from '@/stores/locales.store';
import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';

@Component({
  tag: 'ir-extra-service-config',
  styleUrls: ['ir-extra-service-config.css'],
  scoped: true,
})
export class IrExtraServiceConfig {
  @Prop() booking: Booking;
  @Prop() agent: Agent;
  @Prop() svcCategories: IEntries[] = [];
  @Prop() service: ExtraService;
  @Prop() language: string;
  @Prop({ reflect: true }) open: boolean;

  @Event() closeModal: EventEmitter<null>;

  private closeDialog() {
    this.closeModal.emit();
  }

  render() {
    return (
      <ir-drawer
        style={{
          '--ir-drawer-width': '40rem',
          '--ir-drawer-background-color': 'var(--wa-color-surface-default)',
          '--ir-drawer-padding-left': 'var(--spacing)',
          '--ir-drawer-padding-right': 'var(--spacing)',
          '--ir-drawer-padding-top': 'var(--spacing)',
          '--ir-drawer-padding-bottom': 'var(--spacing)',
        }}
        open={this.open}
        onDrawerHide={e => {
          e.stopImmediatePropagation();
          e.stopPropagation();
          this.closeDialog();
        }}
        label={locales.entries.Lcz_ExtraServices}
      >
        {this.open && (
          <ir-extra-service-config-form
            language={this.language ?? 'en'}
            svcCategories={this.svcCategories}
            onCloseModal={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.closeDialog();
            }}
            booking={this.booking}
            agent={this.agent}
            service={this.service}
          ></ir-extra-service-config-form>
        )}
        <div slot="footer" class={'ir__drawer-footer'}>
          <ir-custom-button class={`flex-fill`} size="m" appearance="filled" variant="neutral" data-drawer="close">
            {locales.entries.Lcz_Cancel}
          </ir-custom-button>
          <ir-custom-button
            type="submit"
            loading={isRequestPending('/Do_Booking_Extra_Service')}
            form="extra-service-config-form"
            size="m"
            class={`flex-fill`}
            variant="brand"
          >
            {locales.entries.Lcz_Save}
          </ir-custom-button>
        </div>
      </ir-drawer>
    );
  }
}
