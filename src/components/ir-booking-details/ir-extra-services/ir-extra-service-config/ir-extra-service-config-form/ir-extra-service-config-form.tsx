import { IrServiceAssigneeSelectCustomEvent } from '@/components';
import { isAgentMode } from '@/components/ir-booking-details/functions';
import { Booking, ExtraService, ExtraServiceSchema, IUnit } from '@/models/booking.dto';
import { Agent } from '@/services/agents/type';
import { IEntries } from '@/models/property';
import { BookingService } from '@/services/booking-service/booking.service';
import { taxationModes } from '@/services/property/types';
import { findAccTax, toAccChargeRule } from '@/services/property/acc-tax.helpers';
import calendar_data, { getExtraServiceDefaultPrice, getBabyCotPricingModel } from '@/stores/calendar-data';
import locales from '@/stores/locales.store';
import { getTopLevelSvcCategories, groupSvcCategoriesByParent } from '@/utils/svc-category.utils';
import { calculateDaysBetweenDates } from '@/utils/booking';
import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import { z, ZodError } from 'zod';

/** Group code for accommodation-linked extra services (Breakfast, Minibar, ...) — see `KNOWN_GROUP_LABELS` in svc-category.utils. */
const ACCOMMODATION_GROUP_CODE = 'ACM';

/** Early Check-In / Late Check-Out aren't selectable as an accommodation sub-category here — they're handled elsewhere in the booking flow. */
const ACCOMMODATION_EXCLUDED_CODES = new Set(['ECI', 'LCO']);

/** `_SVC_CATEGORY` short code for Baby Cot — its default price is per-stay or per-night depending on BABY_COT_PRICING_MODEL. */
const BABY_COT_CATEGORY_CODE = 'BCT';

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
  /** Pre-selected unit (physical room) id to link a new service to, e.g. when added from ir-room's quick-add action. */
  @Prop() defaultPrId: number | null = null;

  @State() s_service: ExtraService;
  @State() error: boolean;
  @State() fromDateClicked: boolean;
  @State() toDateClicked: boolean;
  @State() autoValidate: boolean;
  @State() assignee: 'agent' | 'guest' = 'guest';
  /** Group (e.g. Accommodation/ACM) the currently selected top-level category belongs to, when it has sub-categories to pick from. */
  @State() selectedGroupCode: string | null = null;
  /** True once the price field has been set by user input (typed, or loaded from an existing saved service) — freezes it against further auto-recalculation. */
  @State() priceManuallyEdited: boolean = false;

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
      this.selectedGroupCode = this.groupCodeForCategoryCode(this.service.category?.code);
      // An existing service already carries its saved price — don't let a subsequent date-range edit silently recompute it.
      this.priceManuallyEdited = true;
      if (!this.service.agent) {
        this.assignee = 'guest';
      }
    } else {
      this.selectedGroupCode = null;
      this.priceManuallyEdited = false;
      if (this.effectiveRoomIdentifier != null) {
        this.s_service = {
          cost: null,
          description: null,
          end_date: null,
          start_date: null,
          price: null,
          currency_id: this.booking.currency.id,
          room_identifier: this.effectiveRoomIdentifier,
        } as ExtraService;
      }
    }
  }

  /** Which group (e.g. `ACM`) a leaf category code belongs to, if any — used to re-derive the group selection when editing an existing service. */
  private groupCodeForCategoryCode(code: string | null | undefined): string | null {
    if (!code) return null;
    for (const group of this.svcGroups.values()) {
      if (group.categories.some(c => c.CODE_NAME === code)) {
        return group.code;
      }
    }
    return null;
  }

  private get taxCategoryLookup() {
    const notApplicableCodes = new Set(calendar_data.property.tax_categories.filter(c => c.taxation_mode?.code === taxationModes.NOT_APPLICABLE).map(c => c.category.code));
    const taxPctByCode = Object.fromEntries(calendar_data.property.tax_categories.map(c => [c.category.code, c.pct || 0]));
    const realCodes = new Set(this.svcCategories.map(c => c.CODE_NAME));
    const accVat = toAccChargeRule(findAccTax('vat'));
    return { notApplicableCodes, taxPctByCode, realCodes, accVat };
  }

  private toCategoryOption(cat: IEntries): IEntries & { pct: number; isNotApplicable: boolean } {
    const { notApplicableCodes, taxPctByCode, realCodes, accVat } = this.taxCategoryLookup;
    // Synthesized parent-group placeholders (e.g. Accommodation/ACM) have no `tax_categories` row of their
    // own — their rate mirrors the property's accommodation VAT, same as it does on the Extra Services page.
    if (!realCodes.has(cat.CODE_NAME)) {
      return { ...cat, pct: accVat.mode === taxationModes.NOT_APPLICABLE ? 0 : (accVat.value ?? 0), isNotApplicable: accVat.mode === taxationModes.NOT_APPLICABLE };
    }
    return { ...cat, pct: taxPctByCode[cat.CODE_NAME] ?? 0, isNotApplicable: notApplicableCodes.has(cat.CODE_NAME) };
  }

  private sortByLabel<T extends IEntries>(entries: T[]): T[] {
    const langKey = `CODE_VALUE_${(this.language ?? 'en').toUpperCase()}`;
    return entries.sort((a, b) => (a[langKey] ?? a.CODE_VALUE_EN ?? '').localeCompare(b[langKey] ?? b.CODE_VALUE_EN ?? ''));
  }

  private get categories(): (IEntries & { pct: number; isNotApplicable: boolean })[] {
    return this.sortByLabel(getTopLevelSvcCategories(this.svcCategories).map(cat => this.toCategoryOption(cat)));
  }

  private get svcGroups() {
    return groupSvcCategoriesByParent(this.svcCategories, this.language ?? 'en');
  }

  /** Sub-categories of the currently selected top-level group (e.g. Breakfast/Minibar under Accommodation), when there are any. */
  private get subCategories(): (IEntries & { pct: number; isNotApplicable: boolean })[] {
    if (!this.selectedGroupCode) return [];
    const group = this.svcGroups.get(this.selectedGroupCode);
    if (!group) return [];
    const categories = this.selectedGroupCode === ACCOMMODATION_GROUP_CODE ? group.categories.filter(cat => !ACCOMMODATION_EXCLUDED_CODES.has(cat.CODE_NAME)) : group.categories;
    return categories.filter(cat => cat.CODE_NAME !== 'DUZ').map(cat => this.toCategoryOption(cat));
  }

  /** The unit-link select becomes mandatory once the chosen extra service is an accommodation sub-category (Breakfast, Minibar, ...). */
  private get isUnitRequired(): boolean {
    return this.selectedGroupCode === ACCOMMODATION_GROUP_CODE;
  }

  private get unitOptions(): { id: number; identifier: string; label: string }[] {
    return (this.booking?.rooms ?? [])
      .filter(room => room.unit && typeof room.unit === 'object')
      .map(room => ({ id: (room.unit as IUnit).id, identifier: room.identifier, label: `${room.roomtype?.name ?? ''} ${(room.unit as IUnit).name}`.trim() }));
  }

  private get showUnitLink(): boolean {
    return (this.booking?.rooms?.length ?? 0) > 1 && this.unitOptions.length > 0;
  }

  /** The room identifier to link a new service to: an explicit default (e.g. from ir-room's quick-add, given as a unit id), or the booking's single unit when there's no choice to make. */
  private get effectiveRoomIdentifier(): string | null {
    if (this.defaultPrId != null) {
      return this.unitOptions.find(option => option.id === this.defaultPrId)?.identifier ?? null;
    }
    return this.unitOptions.length === 1 ? this.unitOptions[0].identifier : null;
  }

  private async saveAmenity() {
    try {
      this.autoValidate = true;
      const service = { ...(this.s_service ?? {}), agent: this.assignee === 'agent' ? this.booking.agent : null };
      if (this.selectedGroupCode && !service.category?.code) {
        // A group (e.g. Accommodation) was picked but its sub-category select hasn't been resolved yet.
        this.error = true;
        return;
      }
      const schema = this.isUnitRequired
        ? ExtraServiceSchema.extend({ room_identifier: z.string({ required_error: 'Unit is required' }).nonempty('Unit is required') })
        : ExtraServiceSchema;
      schema.parse(service);
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

  /**
   * Sets the chosen leaf category and, when the property has a configured default price for it,
   * overwrites the price field to match. Re-arms auto-recalculation (see `priceManuallyEdited`) —
   * a fresh category selection always gets its default, even over a previously typed price.
   */
  private selectCategory(code: string) {
    this.priceManuallyEdited = false;
    const defaultPrice = this.resolveDefaultPrice(code);
    this.updateService({ category: { code }, price: defaultPrice !== null ? defaultPrice : (this.s_service?.price ?? null) });
  }

  /**
   * Resolves the property's configured default price for `code`. For every category except Baby
   * Cot this is just the flat `SVC_DEFAULT_PRICE_<code>` rate. Baby Cot's rate is charged once per
   * stay or once per night depending on `BABY_COT_PRICING_MODEL` (set on the Extra Services
   * settings page) — when it's per night, the rate is multiplied by the number of nights in the
   * currently selected date range (falling back to the full booking stay when no range is picked
   * yet), so the field always reflects "rate × nights" until the user overrides it by typing.
   */
  private resolveDefaultPrice(code: string): number | null {
    const rate = getExtraServiceDefaultPrice(code);
    if (rate === undefined) {
      return null;
    }
    const rateNum = Number(rate);
    if (code !== BABY_COT_CATEGORY_CODE || getBabyCotPricingModel() !== 'Night') {
      return rateNum;
    }
    const start = this.s_service?.start_date ?? this.booking.from_date;
    const end = this.s_service?.end_date ?? this.booking.to_date;
    return rateNum * calculateDaysBetweenDates(start, end);
  }

  /** Keeps Baby Cot's per-night price in sync with the selected date range, unless the user has already typed a price of their own. */
  private syncBabyCotPriceWithDateRange() {
    if (this.priceManuallyEdited || this.s_service?.category?.code !== BABY_COT_CATEGORY_CODE || getBabyCotPricingModel() !== 'Night') {
      return;
    }
    const price = this.resolveDefaultPrice(BABY_COT_CATEGORY_CODE);
    if (price !== null) {
      this.updateService({ price });
    }
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
        room_identifier: this.effectiveRoomIdentifier,
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
              value={this.selectedGroupCode ?? this.s_service?.category?.code ?? ''}
              defaultValue={this.selectedGroupCode ?? this.s_service?.category?.code ?? ''}
              onchange={(e: any) => {
                const code = e.target.value;
                const group = this.svcGroups.get(code);
                if (group && group.categories.length > 0) {
                  this.selectedGroupCode = code;
                  this.updateService({ category: null });
                } else {
                  this.selectedGroupCode = null;
                  this.selectCategory(code);
                }
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
                if (this.booking.is_room_less && category.CODE_NAME === 'ACM') {
                  return null;
                }
                return (
                  <wa-option value={category.CODE_NAME} label={label}>
                    {label}
                  </wa-option>
                );
              })}
            </wa-select>
          </ir-validator>
        )}
        {this.selectedGroupCode && this.subCategories.length > 0 && (
          <ir-validator value={this.s_service?.category?.code ?? null} schema={z.string({ required_error: 'Subcategory is required' }).nonempty('Subcategory is required')}>
            <wa-select
              size="s"
              label="Subcategory"
              required
              value={this.s_service?.category?.code ?? ''}
              defaultValue={this.s_service?.category?.code ?? ''}
              onchange={(e: any) => {
                this.selectCategory(e.target.value);
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
              {this.subCategories.map(category => {
                const langKey = `CODE_VALUE_${(this.language ?? 'en').toUpperCase()}`;
                const label = category[langKey] ?? category.CODE_VALUE_EN ?? '';

                return (
                  <wa-option value={category.CODE_NAME} label={label}>
                    {label}
                    {category.CODE_NAME === BABY_COT_CATEGORY_CODE && getBabyCotPricingModel() && <span> (/{getBabyCotPricingModel().toLowerCase()})</span>}
                    {category.CODE_NAME === 'EXB' && <span> (/night)</span>}
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
        {this.showUnitLink && (
          <ir-validator
            value={this.s_service?.room_identifier ?? null}
            schema={this.isUnitRequired ? z.string({ required_error: 'Unit is required' }).nonempty('Unit is required') : ExtraServiceSchema.shape.room_identifier}
          >
            <wa-select
              size="s"
              label={this.isUnitRequired ? 'Link to unit' : 'Link to unit (optional)'}
              required={this.isUnitRequired}
              value={this.s_service?.room_identifier ?? ''}
              defaultValue={this.s_service?.room_identifier ?? ''}
              onchange={(e: any) => {
                const value = e.target.value;
                this.updateService({ room_identifier: value || null });
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
              {!this.isUnitRequired && <wa-option value="">Not linked to a specific unit</wa-option>}
              {this.unitOptions.map(option => (
                <wa-option value={option.identifier} label={option.label}>
                  {option.label}
                </wa-option>
              ))}
            </wa-select>
          </ir-validator>
        )}
        <ir-validator value={this.s_service?.start_date ?? null} schema={ExtraServiceSchema.shape.start_date}>
          <ir-date-select
            placeholder="Select date"
            withClear
            label="Dates on"
            emitEmptyDate
            date={this.s_service?.start_date}
            minDate={this.booking.from_date}
            maxDate={this.booking.to_date}
            onDateChanged={e => {
              this.updateService({ start_date: e.detail.start?.format('YYYY-MM-DD') });
              this.syncBabyCotPriceWithDateRange();
            }}
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
            this.syncBabyCotPriceWithDateRange();
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
            onChange={() => {
              this.priceManuallyEdited = true;
            }}
            label={`${locales.entries.Lcz_Price} (including tax)`}
          >
            <span slot="start">{this.booking.currency.symbol}</span>
          </ir-input>
        </ir-validator>
        {/* <ir-input type="time"></ir-input> */}
        {/* <ir-validator value={this.s_service?.cost ?? null} schema={ExtraServiceSchema.shape.cost}>
          <ir-input
            defaultValue={this.s_service?.cost?.toString()}
            onText-change={e => this.updateService({ cost: Number(e.detail) })}
            value={this.s_service?.cost?.toString()}
            mask={'price'}
            label={`${locales.entries.Lcz_Cost} (optional)`}
          >
            <span slot="start">{this.booking.currency.symbol}</span>
          </ir-input>
        </ir-validator> */}

        {isAgentMode(this.agent) && (
          <ir-service-assignee-select assigneeType={this.assignee} onAssignmentChange={e => this.assignmentChanged(e)} agent={this.booking.agent}></ir-service-assignee-select>
        )}
      </form>
    );
  }
}
