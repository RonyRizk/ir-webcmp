import { IrServiceAssigneeSelectCustomEvent } from '@/components';
import { isAgentMode } from '@/components/ir-booking-details/functions';
import { Booking, ExtraService, ExtraServiceSchema } from '@/models/booking.dto';
import { Agent } from '@/services/agents/type';
import { IEntries } from '@/models/property';
import { BookingService } from '@/services/booking-service/booking.service';
import { taxationModes } from '@/services/property/types';
import calendar_data from '@/stores/calendar-data';
import locales from '@/stores/locales.store';
import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import { ZodError } from 'zod';

@Component({
  tag: 'ir-extra-service-config-form',
  styleUrl: 'ir-extra-service-config-form.css',
  scoped: true,
})
export class IrExtraServiceConfigForm {
  @Prop() booking: Booking;
  @Prop() agent: Agent;
  @Prop() service: ExtraService;
  @Prop() svcCategories: IEntries[] = [];
  @Prop() language: string;

  @State() s_service: ExtraService;
  @State() error: boolean;
  @State() fromDateClicked: boolean;
  @State() toDateClicked: boolean;
  @State() autoValidate: boolean;
  @State() assignee: 'agent' | 'guest' = 'guest';

  @Event() closeModal: EventEmitter<null>;
  @Event({ bubbles: true, composed: true }) resetBookingEvt: EventEmitter<null>;

  private bookingService = new BookingService();

  componentWillLoad() {
    if (isAgentMode(this.agent)) {
      this.assignee = 'agent';
    }
    this.assignService();
  }

  @Watch('service')
  handleServiceChange() {
    this.assignService();
  }
  private assignService() {
    if (this.service) {
      this.s_service = { ...this.service };
      if (!this.service.agent) {
        this.assignee = 'guest';
      }
    }
  }

  private get categories(): (IEntries & { pct: number; isNotApplicable: boolean })[] {
    const notApplicableCodes = new Set(
      calendar_data.property.tax_categories.filter(c => c.taxation_mode?.code === taxationModes.NOT_APPLICABLE).map(c => c.category.code),
    );
    const taxPctByCode = Object.fromEntries(calendar_data.property.tax_categories.map(c => [c.category.code, c.pct || 0]));
    return this.svcCategories.map(cat => ({ ...cat, pct: taxPctByCode[cat.CODE_NAME], isNotApplicable: notApplicableCodes.has(cat.CODE_NAME) }));
  }

  private async saveAmenity() {
    try {
      this.autoValidate = true;
      const service = { ...(this.s_service ?? {}), agent: this.assignee === 'agent' ? this.booking.agent : null };
      ExtraServiceSchema.parse(service);
      await this.bookingService.doBookingExtraService({
        service,
        booking_nbr: this.booking.booking_nbr,
        is_remove: false,
      });
      this.resetBookingEvt.emit(null);
      this.closeDialog();
    } catch (error) {
      if (error instanceof ZodError) {
        this.error = true;
      }
      console.error(error);
    }
  }
  private closeDialog() {
    this.closeModal.emit();
  }

  private updateService(params: Partial<ExtraService>) {
    let prevService: ExtraService = this.s_service;
    if (!prevService) {
      prevService = {
        cost: null,
        description: null,
        end_date: null,
        start_date: null,
        price: null,
        currency_id: this.booking.currency.id,
      };
    }
    this.s_service = { ...prevService, ...params };
  }

  private assignmentChanged(event: IrServiceAssigneeSelectCustomEvent<'agent' | 'guest'>): void {
    event.stopImmediatePropagation();
    event.stopPropagation();
    this.assignee = event.detail;
  }

  render() {
    return (
      <form
        id="extra-service-config-form"
        onSubmit={async e => {
          e.preventDefault();
          this.saveAmenity();
        }}
        class={'extra-service-config__container'}
      >
        {this.categories.length > 0 && (
          <ir-validator value={this.s_service?.category} schema={ExtraServiceSchema.shape.category}>
            <wa-select
              size="s"
              label="Service category"
              value={this.s_service?.category?.code ?? ''}
              defaultValue={this.s_service?.category?.code ?? ''}
              onchange={(e: any) => {
                this.updateService({ category: { code: e.target.value } });
              }}
              onwa-hide={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
              }}
              onwa-show={e => {
                e.stopImmediatePropagation();
                e.stopPropagation();
              }}
            >
              {this.categories?.map(category => {
                const langKey = `CODE_VALUE_${(this.language ?? 'en').toUpperCase()}`;
                const vatSuffix = category.isNotApplicable ? 'VAT - Not applicable' : `VAT ${category.pct}%`;
                const label = (category[langKey] ?? category.CODE_VALUE_EN ?? '') + ` (${vatSuffix})`;

                return (
                  <wa-option value={category.CODE_NAME} label={label}>
                    {label}
                  </wa-option>
                );
              })}
            </wa-select>
          </ir-validator>
        )}
        <ir-validator id="amenity description-validator" schema={ExtraServiceSchema.shape.description}>
          <wa-textarea
            size="s"
            defaultValue={this.s_service?.description}
            value={this.s_service?.description}
            onchange={e => this.updateService({ description: (e.target as any).value })}
            id="amenity-description"
            aria-label="Amenity description"
            maxlength={250}
            label={locales.entries.Lcz_Description}
          ></wa-textarea>
        </ir-validator>
        <ir-validator value={this.s_service?.start_date ?? null} schema={ExtraServiceSchema.shape.start_date}>
          <ir-date-select
            placeholder="Select date"
            withClear
            label="Dates on"
            emitEmptyDate
            date={this.s_service?.start_date}
            minDate={this.booking.from_date}
            maxDate={this.booking.to_date}
            onDateChanged={e => this.updateService({ start_date: e.detail.start?.format('YYYY-MM-DD') })}
          ></ir-date-select>
        </ir-validator>
        <ir-date-select
          withClear
          emitEmptyDate
          placeholder="Select date"
          date={this.s_service?.end_date}
          minDate={this.s_service?.start_date ?? this.booking.from_date}
          maxDate={this.booking.to_date}
          onDateChanged={e => {
            e.stopImmediatePropagation();
            e.stopPropagation();
            this.updateService({ end_date: e.detail.start?.format('YYYY-MM-DD') });
          }}
          label="Till and including"
        ></ir-date-select>
        {/* Prices and cost */}
        <ir-validator value={this.s_service?.price ?? null} schema={ExtraServiceSchema.shape.price}>
          <ir-input
            onText-change={e => {
              this.updateService({ price: Number(e.detail) });
            }}
            defaultValue={this.s_service?.price?.toString()}
            value={this.s_service?.price?.toString()}
            mask={'price'}
            type="text"
            label={`${locales.entries.Lcz_Price} (including tax)`}
          >
            <span slot="start">{this.booking.currency.symbol}</span>
          </ir-input>
        </ir-validator>
        <ir-validator value={this.s_service?.cost ?? null} schema={ExtraServiceSchema.shape.cost}>
          <ir-input
            defaultValue={this.s_service?.cost?.toString()}
            onText-change={e => this.updateService({ cost: Number(e.detail) })}
            value={this.s_service?.cost?.toString()}
            mask={'price'}
            label={`${locales.entries.Lcz_Cost} (optional)`}
          >
            <span slot="start">{this.booking.currency.symbol}</span>
          </ir-input>
        </ir-validator>
        {isAgentMode(this.agent) && (
          <ir-service-assignee-select assigneeType={this.assignee} onAssignmentChange={e => this.assignmentChanged(e)} agent={this.booking.agent}></ir-service-assignee-select>
        )}
      </form>
    );
  }
}
