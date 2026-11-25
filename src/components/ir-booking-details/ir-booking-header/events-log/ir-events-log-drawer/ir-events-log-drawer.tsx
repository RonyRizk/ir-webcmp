import { Component, Element, Event, EventEmitter, Prop, h } from '@stencil/core';
import { ExposedBookingEvent } from '@/models/booking.dto';
import { t } from '@/services/locale/t';

/**
 * Side drawer showing a booking's events log (who did what, and when).
 */
@Component({
  tag: 'ir-events-log-drawer',
  styleUrl: 'ir-events-log-drawer.css',
  scoped: true,
})
export class IrEventsLogDrawer {
  @Element() hostElement: HTMLIrEventsLogDrawerElement;

  /** Controls whether the drawer is open. */
  @Prop({ reflect: true }) open: boolean;

  /** Booking events, rendered in the order received. */
  @Prop() events: ExposedBookingEvent[] = [];

  /** Emitted when the drawer is dismissed (close button, Escape or light dismiss). */
  @Event() eventsLogDrawerClosed: EventEmitter<{ source: Element }>;

  private handleDrawerHide = (event: CustomEvent<{ source: Element }>) => {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.eventsLogDrawerClosed.emit({ source: event.detail?.source ?? this.hostElement });
  };

  render() {
    return (
      <ir-drawer
        open={this.open}
        label={t('Lcz_EventsLog', { fallback: 'Events log' })}
        onDrawerHide={this.handleDrawerHide}
        style={{
          '--ir-drawer-width': '52rem',
          '--ir-drawer-background-color': 'var(--wa-color-surface-default)',
        }}
      >
        {this.open && <ir-events-log events={this.events}></ir-events-log>}
      </ir-drawer>
    );
  }
}
