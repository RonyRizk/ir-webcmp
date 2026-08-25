import { Component, h, Prop, State, Event, EventEmitter, Fragment } from '@stencil/core';
import { Booking, ExtraService, IUnit, Room } from '@/models/booking.dto';
import { Agent } from '@/services/agents/type';
import { IEntries } from '@/models/IBooking';
import { ClTx } from '@/services/city-ledger/types';
import { isAgentMode } from '../../functions';

/** Extra-service category codes that are never tucked inside the collapsible list — always shown for the room, e.g. Early Check-In / Late Check-Out fees. */
const ALWAYS_VISIBLE_EXTRA_SERVICE_CODES = new Set(['ECI', 'LCO', 'BCT', 'EXB', 'HMP', 'ANP']);

@Component({
  tag: 'ir-room-extra-services',
  styleUrl: 'ir-room-extra-services.css',
  scoped: true,
})
export class IrRoomExtraServices {
  @Prop() room: Room;
  @Prop() booking: Booking;
  @Prop() isEditable: boolean;
  @Prop() agent: Agent;
  @Prop() currency: string = 'USD';
  @Prop() language: string = 'en';
  @Prop() svcCategories: IEntries[] = [];
  @Prop() clTransactions: ClTx[] = [];

  /** Which collapsible groups ('all' | 'agent' | 'guest') are expanded — keyed so agent/guest folios can be toggled independently. */
  @State() expandedGroups: Set<string> = new Set();

  @Event() requestAddExtraService: EventEmitter<void>;

  private get unitId(): number | null {
    return (this.room.unit as IUnit)?.id ?? null;
  }

  /** Extra services linked to this unit via `room_identifier`. */
  private get roomExtraServices(): ExtraService[] {
    return (this.booking.extra_services ?? []).filter(service => service.room_identifier === this.room.identifier);
  }

  /** Services whose category is always surfaced (e.g. Early Check-In / Late Check-Out) — never tucked behind the collapse. */
  private pinnedOf(services: ExtraService[]): ExtraService[] {
    return services.filter(service => service.category?.code && ALWAYS_VISIBLE_EXTRA_SERVICE_CODES.has(service.category.code));
  }

  /** Everything else — hidden behind the "N more services" disclosure. */
  private collapsibleOf(services: ExtraService[]): ExtraService[] {
    return services.filter(service => !service.category?.code || !ALWAYS_VISIBLE_EXTRA_SERVICE_CODES.has(service.category.code));
  }

  private setGroupExpanded(groupKey: string, expanded: boolean) {
    const next = new Set(this.expandedGroups);
    if (expanded) {
      next.add(groupKey);
    } else {
      next.delete(groupKey);
    }
    this.expandedGroups = next;
  }

  private renderExtraServiceItem(service: ExtraService) {
    return (
      <ir-extra-service
        key={service.booking_system_id ?? service.system_id ?? `${service.category?.code ?? 'service'}-${service.start_date}`}
        service={service}
        booking={this.booking}
        agent={this.agent}
        bookingNumber={this.booking.booking_nbr}
        currencySymbol={this.currency}
        language={this.language}
        svcCategories={this.svcCategories}
        clTransactions={this.clTransactions}
      ></ir-extra-service>
    );
  }

  /** Renders the pinned + collapsible services for one folio group (or the whole list when not in agent mode). */
  private renderServiceGroup(groupKey: string, services: ExtraService[]) {
    const pinned = this.pinnedOf(services);
    const collapsible = this.collapsibleOf(services);
    return (
      <Fragment>
        {pinned.length > 0 && (
          <div class="booking-room__extra-services-pinned">
            {pinned.map((service, idx) => (
              <Fragment>
                {this.renderExtraServiceItem(service)}
                {idx < pinned.length - 1 && <wa-divider></wa-divider>}
              </Fragment>
            ))}
          </div>
        )}
        {collapsible.length > 0 && (
          <wa-details
            icon-placement="start"
            class="booking-room__extra-services-details"
            appearance="plain"
            open={this.expandedGroups.has(groupKey)}
            onwa-show={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.setGroupExpanded(groupKey, true);
            }}
            onwa-hide={e => {
              e.stopImmediatePropagation();
              e.stopPropagation();
              this.setGroupExpanded(groupKey, false);
            }}
          >
            <span slot="summary" class="booking-room__extra-services-toggle-label">
              {collapsible.length} more service{collapsible.length > 1 ? 's' : ''}
            </span>
            <div class="booking-room__extra-services-list">
              {collapsible.map((service, idx) => (
                <Fragment>
                  {this.renderExtraServiceItem(service)}
                  {idx < collapsible.length - 1 && <wa-divider></wa-divider>}
                </Fragment>
              ))}
            </div>
          </wa-details>
        )}
      </Fragment>
    );
  }

  render() {
    const services = this.roomExtraServices;
    const canAdd = this.isEditable && !!this.unitId;
    if (!canAdd && services.length === 0) {
      return null;
    }
    const total = services.length;
    const inAgentMode = isAgentMode(this.agent);
    const guestServices = inAgentMode ? services.filter(s => s.agent === null || s.agent === undefined) : [];
    const agentServices = inAgentMode ? services.filter(s => s.agent !== null && s.agent !== undefined) : [];
    const agentName = this.booking.agent?.name ?? 'Agent';

    return (
      <wa-card appearance="filled" class="booking-room__extra-services">
        <div slot="header" class="booking-room__extra-services-header">
          <span class="booking-room__extra-services-label">
            <span class="booking-room__extra-services-title">{total > 0 ? '' : 'Add '}Extras</span>
            {total > 0 && <span class="booking-room__extra-services-count">{total}</span>}
          </span>

          {canAdd && (
            <Fragment>
              <wa-tooltip for={`add-extra-service-${this.room.identifier}`}>Add extra service</wa-tooltip>
              <ir-custom-button
                id={`add-extra-service-${this.room.identifier}`}
                class="booking-room__extra-services-add"
                iconBtn
                size="s"
                appearance="plain"
                variant="brand"
                onClickHandler={() => this.requestAddExtraService.emit()}
              >
                <wa-icon style={{ fontSize: '0.9rem' }} label="Add extra service" name="plus"></wa-icon>
              </ir-custom-button>
            </Fragment>
          )}
        </div>
        {inAgentMode ? (
          <Fragment>
            <div class="booking-room__extra-services-group booking-room__extra-services-group--agent">
              <p class="booking-room__extra-services-group-label booking-room__extra-services-group-label--agent">
                {agentName}
                <span>Folio</span>
              </p>
              {agentServices.length === 0 ? <p class="booking-room__extra-services-empty">No agent services added</p> : this.renderServiceGroup('agent', agentServices)}
            </div>
            <wa-divider></wa-divider>
            <div class="booking-room__extra-services-group booking-room__extra-services-group--guest">
              <p class="booking-room__extra-services-group-label">
                Guest
                <span>Folio</span>
              </p>
              {guestServices.length === 0 ? <p class="booking-room__extra-services-empty">No guest services added</p> : this.renderServiceGroup('guest', guestServices)}
            </div>
          </Fragment>
        ) : (
          this.renderServiceGroup('all', services)
        )}
      </wa-card>
    );
  }
}
