import { Booking, IUnit } from '@/models/booking.dto';
import { BookingSource } from '@/models/igl-book-property';
import calendar_data from '@/stores/calendar-data';
import { BookingService } from '@/services/booking-service/booking.service';
import WaSelect from '@awesome.me/webawesome/dist/components/select/select';
import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import { AssignableItem } from '../types';

type EditorStep = 'source' | 'assign';

@Component({
  tag: 'ir-booking-source-editor-form',
  styleUrl: 'ir-booking-source-editor-form.css',
  scoped: true,
})
export class IrBookingSourceEditorForm {
  @Prop() booking: Booking;

  @State() selectedSource: BookingSource;
  @State() step: EditorStep = 'source';
  @State() checkedItems: Set<string> = new Set();
  @State() isLoading: boolean = false;

  @Event() bookingSourceSaved: EventEmitter<null>;
  @Event() loadingChange: EventEmitter<boolean>;

  private bookingService = new BookingService();

  componentWillLoad() {
    this.selectedSource = this.getSource(this.booking);
  }

  @Watch('isLoading')
  handleLoadingChange(newVal: boolean) {
    this.loadingChange.emit(newVal);
  }

  private getSource(booking: Booking): BookingSource {
    if (booking.agent) {
      return this.getSourceByKey('tag', booking.agent.id);
    }
    return this.getSourceByKey('code', booking.source?.code);
  }

  private getSourceByKey(key: 'tag' | 'code' | 'id', value: any): BookingSource {
    return calendar_data?.property?.allowed_booking_sources?.find(s => s[key]?.toString() === value?.toString());
  }

  private getAgentRef() {
    return calendar_data.property.agents.find(a => a.id === Number(this.selectedSource.tag)) ?? null;
  }

  private buildAssignableItems(): AssignableItem[] {
    const items: AssignableItem[] = [];

    this.booking.rooms?.forEach(room => {
      items.push({
        key: `room-${room.identifier}`,
        label: room.roomtype?.name ?? 'Room',
        type: 'room',
        ratePlanShortName: room.rateplan?.short_name,
        isNonRefundable: room.rateplan?.is_non_refundable,
        unitName: (room.unit as IUnit)?.name,
        fromDate: room.from_date,
        toDate: room.to_date,
      });
    });

    if (this.booking.pickup_info) {
      const pickup = this.booking.pickup_info;
      items.push({
        key: 'pickup',
        label: pickup.selected_option?.vehicle?.description ?? 'Airport Pickup',
        type: 'pickup',
      });
    }

    this.booking.extra_services?.forEach((svc, i) => {
      items.push({
        key: `extra-${svc.system_id ?? svc.booking_system_id ?? i}`,
        label: svc.description,
        type: 'extra',
        fromDate: svc.start_date,
        toDate: svc.end_date ?? undefined,
        price: svc.price,
        currencySymbol: this.booking.currency?.symbol,
      });
    });

    return items;
  }

  private async performSave(selections?: Set<string>) {
    this.isLoading = true;
    const agent = this.getAgentRef();

    const getItemAgent = (key: string) => {
      if (!agent) return null;
      if (selections) return selections.has(key) ? this.getAgentRef() : null;
      return this.getAgentRef();
    };

    try {
      const { agent: _, extra_services, ...rest } = this.booking;
      const updatedBooking = {
        ...rest,
        source: this.selectedSource,
        rooms: this.booking.rooms.map(room => ({
          ...room,
          agent: getItemAgent(`room-${room.identifier}`),
        })),
      };

      await this.bookingService.doReservation({
        extra_services:
          extra_services?.map((svc, i) => ({
            ...svc,
            agent: getItemAgent(`extra-${svc.system_id ?? svc.booking_system_id ?? i}`),
          })) ?? null,
        agent,
        assign_units: true,
        is_pms: true,
        is_direct: true,
        is_backend: true,
        is_in_loyalty_mode: false,
        promo_key: null,
        extras: [...(this.booking.extras ?? [])],
        booking: updatedBooking,
        pickup_info: this.booking.pickup_info ? { ...this.booking.pickup_info, agent: getItemAgent('pickup') } : null,
      });

      this.bookingSourceSaved.emit(null);
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
    }
  }

  private buildExistingAgentSelections(): Set<string> {
    const keys = new Set<string>();
    this.booking.rooms?.forEach(room => {
      if (room.agent) keys.add(`room-${room.identifier}`);
    });
    if (this.booking.pickup_info?.agent) keys.add('pickup');
    this.booking.extra_services?.forEach((svc, i) => {
      if (svc.agent) keys.add(`extra-${svc.system_id ?? svc.booking_system_id ?? i}`);
    });
    return keys;
  }

  private handleSubmit(event: Event) {
    event.preventDefault();
    this.performSave(this.checkedItems);
  }

  private handleSelectChange(event: Event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.selectedSource = this.getSourceByKey('id', (event.target as WaSelect).value?.toString());
    const wasAgent = !!this.booking.agent;
    const isAgent = !!this.getAgentRef();
    if (!wasAgent && isAgent) {
      // Guest → agent: show assign dialog, start with nothing checked
      this.step = 'assign';
      this.checkedItems = new Set();
    } else if (wasAgent && isAgent) {
      // Agent → agent: preserve existing per-item assignments
      this.step = 'source';
      this.checkedItems = this.buildExistingAgentSelections();
    } else {
      this.step = 'source';
      this.checkedItems = new Set();
    }
  }

  render() {
    const isAssign = this.step === 'assign';
    return (
      <form id={`change-source-form-${this.booking?.booking_nbr}`} onSubmit={this.handleSubmit.bind(this)}>
        {this.booking.agent === null && this.booking?.financial?.payments?.filter(p => !p.is_city_ledger)?.length > 0 && (
          <wa-callout size="s" variant="warning" style={{ marginBottom: '1rem' }}>
            <wa-icon slot="icon" name="triangle-exclamation"></wa-icon>
            You have guest folio entries that may need to be removed and recreated in the agent folio.
          </wa-callout>
        )}
        <wa-select label="New source" onchange={this.handleSelectChange.bind(this)} size="s" value={this.selectedSource?.id} defaultValue={this.selectedSource?.id}>
          {calendar_data?.property?.allowed_booking_sources?.map(option =>
            option.type === 'LABEL' ? (
              <small key={option.id}>{option.description}</small>
            ) : (
              <wa-option key={option.id} value={option.id?.toString()}>
                {option.description}
              </wa-option>
            ),
          )}
        </wa-select>
        {isAssign && <ir-booking-assign-items items={this.buildAssignableItems()} onBookingSelectionChange={e => (this.checkedItems = e.detail)}></ir-booking-assign-items>}
      </form>
    );
  }
}
