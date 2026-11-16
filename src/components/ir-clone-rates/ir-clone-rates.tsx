import ApiClient from '@/models/ApiClient';
import { LanguageSync } from '@/services/locale/language-sync';
import { LocaleController } from '@/services/locale/locale.controller';
import { SCREEN_TABLES } from '@/services/locale/screen-tables';
import { t } from '@/services/locale/t';
import { PropertyService } from '@/services/property';
import { RoomService } from '@/services/room.service';
import { formatNumber } from '@/utils/number';
import { showToast } from '@/utils/utils';
import { Component, Element, Event, EventEmitter, Fragment, Host, Prop, State, Watch, h } from '@stencil/core';
import moment from 'moment';
import {
  Adjustment,
  CloneRatesErrors,
  CloneRatesFormState,
  RoomTypeOption,
  SourceOption,
  WEEKDAYS,
  buildCloneRatesPayload,
  buildReviewRows,
  getAdjustments,
  isDecrease,
  isPercentage,
  parseSourceOption,
  toRoomTypeOptions,
  validateCloneRates,
  yearBounds,
} from './clone-rates.utils';

@Component({
  tag: 'ir-clone-rates',
  styleUrl: 'ir-clone-rates.css',
  scoped: true,
})
export class IrCloneRates {
  @Element() el: HTMLIrCloneRatesElement;

  @Prop() ticket: string;
  @Prop() p: string;
  @Prop() language: string = 'en';
  @Prop() propertyid: number;
  /** `drawer` drops the page shell and the inline Review button; the host drawer submits `#clone-rates-form` from its footer. */
  @Prop({ reflect: true }) mode: 'page' | 'drawer' = 'page';

  /** Fired after the rates were copied successfully. */
  @Event() ratesCloned: EventEmitter<void>;

  @State() isLoading: boolean;
  @State() isSaving: boolean;
  @State() isReviewOpen: boolean = false;
  @State() roomTypes: RoomTypeOption[] = [];
  @State() currencySymbol: string = '';

  @State() source: SourceOption;
  @State() fromDate: string | null;
  @State() toDate: string | null;
  @State() weekdays: Set<number>;
  @State() selectedRatePlans: Set<number>;
  @State() adjustment: Adjustment;
  @State() amount: string;
  @State() copyMinStay: boolean;
  @State() errors: CloneRatesErrors = {};

  private propertyId: number;
  /** Set by a failed review; the next render scrolls the first error into view once it is in the DOM. */
  private scrollToErrorPending = false;
  /** Set when an adjustment is picked; the next render focuses the amount field once it is mounted. */
  private focusAmountPending = false;
  private amountInputRef: HTMLIrInputElement;
  private currentYear = moment().year();
  private years = [this.currentYear, this.currentYear - 1];
  private apiClientService = new ApiClient();
  private roomService = new RoomService();
  private propertyService = new PropertyService();

  /** Re-runs init when the language changes so server-localized room type and rate plan names follow. */
  private languageSync = new LanguageSync(SCREEN_TABLES.cloneRates, () => this.init());

  componentWillLoad() {
    this.resetForm();
    if (this.ticket) {
      this.apiClientService.setApiClient(this.ticket);
      this.init();
    }
  }

  componentDidLoad() {
    this.languageSync.connect();
  }

  componentDidRender() {
    if (this.focusAmountPending) {
      this.focusAmountPending = false;
      this.focusAmountInput();
    }
    if (!this.scrollToErrorPending) return;
    this.scrollToErrorPending = false;
    const firstError = this.el.querySelector('.clone-rates__error');
    if (!firstError) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    firstError.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  /** `autofocus` only fires on page load, not when the field mounts later; wait for the inner input to render, then focus it. */
  private async focusAmountInput() {
    const input = await this.amountInputRef?.getNativeInput();
    input?.focus();
  }

  disconnectedCallback() {
    this.languageSync.disconnect();
  }

  @Watch('language')
  languageChanged(next: string, previous: string) {
    this.languageSync.propChanged(next, previous);
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue) {
      this.apiClientService.setApiClient(newValue);
      this.init();
    }
  }

  @Watch('p')
  handlePChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue && this.ticket) this.init();
  }

  @Watch('propertyid')
  handlePropertyIdChange(newValue: number, oldValue: number) {
    if (newValue !== oldValue && this.ticket) this.init();
  }

  private async init() {
    try {
      this.isLoading = true;
      const localeReady = LocaleController.load({ language: this.language, tables: SCREEN_TABLES.cloneRates });
      const [propertyRes] = await Promise.all([
        this.roomService.getExposedProperty({
          id: this.propertyid ?? 0,
          aname: this.p,
          language: LocaleController.language,
          is_backend: true,
        }),
        localeReady,
      ]);
      const property = propertyRes.My_Result;
      this.propertyId = property.id;
      this.currencySymbol = property.currency?.symbol ?? '';
      this.roomTypes = toRoomTypeOptions(property.roomtypes);
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  private resetForm() {
    const { from, to } = yearBounds(this.currentYear);
    this.source = `full-${this.currentYear}`;
    this.fromDate = from;
    this.toDate = to;
    this.weekdays = new Set(WEEKDAYS);
    this.selectedRatePlans = new Set();
    this.adjustment = 'none';
    this.amount = '';
    this.copyMinStay = false;
    this.errors = {};
  }

  private get formState(): CloneRatesFormState {
    return {
      fromDate: this.fromDate,
      toDate: this.toDate,
      weekdays: Array.from(this.weekdays),
      ratePlanIds: Array.from(this.selectedRatePlans),
      adjustment: this.adjustment,
      amount: this.amount,
      copyMinStay: this.copyMinStay,
    };
  }

  private clearError(field: keyof CloneRatesErrors) {
    if (!this.errors[field]) return;
    const { [field]: _removed, ...rest } = this.errors;
    this.errors = rest;
  }

  private handleSourceChange(value: SourceOption) {
    const { year } = parseSourceOption(value);
    const { from, to } = yearBounds(year);
    this.source = value;
    this.fromDate = from;
    this.toDate = to;
    this.clearError('dates');
  }

  private get allRatePlanIds(): number[] {
    return this.roomTypes.flatMap(rt => rt.ratePlans.map(rp => rp.id));
  }

  private toggleRatePlan(id: number, checked: boolean) {
    const next = new Set(this.selectedRatePlans);
    checked ? next.add(id) : next.delete(id);
    this.selectedRatePlans = next;
    this.clearError('ratePlans');
  }

  private toggleAllRatePlans(checked: boolean) {
    this.selectedRatePlans = checked ? new Set(this.allRatePlanIds) : new Set();
    this.clearError('ratePlans');
  }

  private review() {
    this.errors = validateCloneRates(this.formState);
    if (Object.keys(this.errors).length === 0) {
      this.isReviewOpen = true;
    } else {
      this.scrollToErrorPending = true;
    }
  }

  private async confirm() {
    try {
      this.isSaving = true;
      await this.propertyService.cloneRates(buildCloneRatesPayload(this.propertyId, this.formState));
      showToast({ position: 'top-right', title: t('Lcz_RatesCopiedSuccessfully', { fallback: 'Rates copied successfully' }), description: '', type: 'success' });
      this.isReviewOpen = false;
      this.resetForm();
      this.ratesCloned.emit();
    } catch (err) {
      console.error(err);
      showToast({ position: 'top-right', title: t('Lcz_FailedToCopyRates', { fallback: 'Failed to copy rates' }), description: String(err), type: 'error' });
    } finally {
      this.isSaving = false;
    }
  }

  private renderError(field: keyof CloneRatesErrors) {
    if (!this.errors[field]) return null;
    return (
      <wa-callout variant="danger" size="s" class="clone-rates__error">
        <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
        {this.errors[field]}
      </wa-callout>
    );
  }

  private renderInfo(text: string) {
    return (
      <wa-callout variant="warning" size="s">
        <wa-icon slot="icon" name="circle-info"></wa-icon>
        {text}
      </wa-callout>
    );
  }

  private renderDatesSection() {
    const { kind, year } = parseSourceOption(this.source);
    const { from, to } = yearBounds(year);
    return (
      <wa-card appearance="plain" class="clone-rates__card">
        <h4 class="clone-rates__question">{t('Lcz_CopyRatesFromWhichDates', { fallback: 'Which dates do you want to copy rates from?' })}</h4>
        <wa-select
          size="s"
          class="clone-rates__source"
          value={this.source}
          defaultValue={this.source}
          onchange={(e: CustomEvent) => this.handleSourceChange((e.target as HTMLSelectElement).value as SourceOption)}
        >
          {this.years.map(y => {
            const yearLabel = formatNumber(y, { useGrouping: false });
            return (
              <Fragment>
                <wa-option value={`full-${y}`}>{t('Lcz_FullYear', { fallback: 'Full year %1', params: [yearLabel] })}</wa-option>
                <wa-option value={`custom-${y}`}>{t('Lcz_CustomDateRangeIn', { fallback: 'Custom date range in %1', params: [yearLabel] })}</wa-option>
              </Fragment>
            );
          })}
        </wa-select>
        <div class="clone-rates__dates">
          <ir-date-range-filter
            fromDate={this.fromDate}
            toDate={this.toDate}
            minDate={from}
            maxDate={to}
            readonly={kind === 'full'}
            showQuickActions={false}
            withClear={false}
            onDatesChanged={e => {
              this.fromDate = e.detail.from;
              this.toDate = e.detail.to;
              this.clearError('dates');
            }}
          ></ir-date-range-filter>
        </div>
        {this.renderError('dates')}
        {this.renderInfo(t('Lcz_RatesWillBeCopiedTo', { fallback: 'Rates will be copied over to %1', params: [formatNumber(year + 1, { useGrouping: false })] }))}
      </wa-card>
    );
  }

  private renderWeekdaysSection() {
    return (
      <wa-card appearance="plain" class="clone-rates__card">
        <h4 class="clone-rates__question">{t('Lcz_CopyRatesWhichWeekdays', { fallback: 'Which days of the week do you want to copy rates from?' })}</h4>
        <ir-weekday-selector
          class="clone-rates__weekdays"
          required
          weekdays={Array.from(this.weekdays)}
          onWeekdayChange={e => {
            this.weekdays = new Set(e.detail);
            this.clearError('weekdays');
          }}
        ></ir-weekday-selector>
        {this.renderError('weekdays')}
      </wa-card>
    );
  }

  private renderRoomTypesSection() {
    const selectedCount = this.selectedRatePlans.size;
    const allSelected = selectedCount > 0 && selectedCount === this.allRatePlanIds.length;
    return (
      <wa-card appearance="plain" class="clone-rates__card">
        <h4 class="clone-rates__question">{t('Lcz_CopyRatesWhichRatePlans', { fallback: 'Which room types and rate plans do you want to copy?' })}</h4>
        <wa-checkbox
          checked={allSelected}
          indeterminate={selectedCount > 0 && !allSelected}
          onchange={(e: Event) => this.toggleAllRatePlans((e.target as HTMLInputElement).checked)}
        >
          {t('Lcz_SelectAllRatePlans', { fallback: 'Select all rate plans for all room types' })}
        </wa-checkbox>
        <wa-divider class="clone-rates__divider"></wa-divider>
        {this.roomTypes.length === 0 ? (
          <ir-empty-state message={t('Lcz_NoActiveRatePlans', { fallback: 'No active rate plans found' })}></ir-empty-state>
        ) : (
          <div class="clone-rates__room-types">
            {this.roomTypes.map(rt => (
              <div key={rt.id} class="clone-rates__room-type">
                <p class="clone-rates__room-type-name">{rt.name}</p>
                <div class="clone-rates__rate-plans">
                  {rt.ratePlans.map(rp => (
                    <wa-checkbox
                      key={rp.id}
                      checked={this.selectedRatePlans.has(rp.id)}
                      onchange={(e: Event) => this.toggleRatePlan(rp.id, (e.target as HTMLInputElement).checked)}
                    >
                      {rp.label}
                      {rp.customText && <span class="clone-rates__rate-plan-custom-text"> ({rp.customText})</span>}
                    </wa-checkbox>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {this.renderError('ratePlans')}
      </wa-card>
    );
  }

  private renderAmountInput() {
    // const label = isDecrease(this.adjustment)
    //   ? t('Lcz_AmountToDecreaseRatesBy', { fallback: 'Set the amount you want to decrease your rates by' })
    //   : t('Lcz_AmountToIncreaseRatesBy', { fallback: 'Set the amount you want to increase your rates by' });
    const _isPercentage = isPercentage(this.adjustment);
    const symbol = isDecrease(this.adjustment) ? '-' : '+';
    return (
      <div class="clone-rates__amount">
        <ir-input
          class={{ 'clone-rates__amount-input--percentage': _isPercentage }}
          // label={label}
          ref={el => (this.amountInputRef = el)}
          mask={_isPercentage ? 'percentage' : 'price'}
          value={this.amount}
          onText-change={(e: CustomEvent<string>) => {
            this.amount = e.detail;
            this.clearError('amount');
          }}
        >
          {_isPercentage && <span slot="start">{symbol}</span>}
          <span slot={_isPercentage ? 'end' : 'start'}>{_isPercentage ? '%' : symbol + ' ' + this.currencySymbol}</span>
        </ir-input>
        {this.renderError('amount')}
      </div>
    );
  }

  private renderAdjustmentSection() {
    return (
      <wa-card appearance="plain" class="clone-rates__card">
        <h4 class="clone-rates__question">{t('Lcz_CopyRatesMakeChanges', { fallback: 'Do you want to make changes to the rates?' })}</h4>
        <wa-select
          size="s"
          class="clone-rates__adjustment"
          value={this.adjustment}
          defaultValue={this.adjustment}
          onchange={(e: CustomEvent) => {
            this.adjustment = (e.target as HTMLSelectElement).value as Adjustment;
            this.focusAmountPending = this.adjustment !== 'none';
            this.amount = '';
            this.clearError('amount');
          }}
        >
          {getAdjustments().map(a => (
            <wa-option key={a.value} value={a.value}>
              {a.label}
            </wa-option>
          ))}
        </wa-select>
        {this.adjustment !== 'none' && this.renderAmountInput()}
      </wa-card>
    );
  }

  private renderRestrictionsSection() {
    return (
      <wa-card appearance="plain" class="clone-rates__card">
        <h4 class="clone-rates__question">{t('Lcz_CopyMinStayQuestion', { fallback: 'Do you want to copy over the minimum stay restrictions for these dates?' })}</h4>
        <wa-checkbox checked={this.copyMinStay} onchange={(e: Event) => (this.copyMinStay = (e.target as HTMLInputElement).checked)}>
          {t('Lcz_CopyMinStayConfirm', { fallback: 'Yes, copy my minimum stay restrictions for this date range' })}
        </wa-checkbox>
      </wa-card>
    );
  }

  private renderForm() {
    return (
      <form
        id="clone-rates-form"
        class="clone-rates__sections"
        noValidate
        onSubmit={e => {
          e.preventDefault();
          this.review();
        }}
      >
        {this.renderDatesSection()}
        {this.renderWeekdaysSection()}
        {this.renderRoomTypesSection()}
        {this.renderAdjustmentSection()}
        {this.renderRestrictionsSection()}
        {this.mode === 'page' && (
          <div class="clone-rates__actions">
            <ir-custom-button variant="brand" size="m" type="submit" form="clone-rates-form">
              {t('Lcz_Review', { fallback: 'Review' })}
            </ir-custom-button>
          </div>
        )}
      </form>
    );
  }

  private renderReview() {
    return (
      <ir-clone-rates-review
        open={this.isReviewOpen}
        loading={this.isSaving}
        rows={buildReviewRows(this.formState, this.roomTypes, this.currencySymbol)}
        onGoBack={() => (this.isReviewOpen = false)}
        onConfirmClone={() => this.confirm()}
      ></ir-clone-rates-review>
    );
  }

  render() {
    if (this.mode === 'drawer') {
      if (this.isLoading) {
        return (
          <div class="clone-rates__loader">
            <ir-spinner></ir-spinner>
          </div>
        );
      }
      return (
        <Host>
          {this.renderForm()}
          {this.renderReview()}
        </Host>
      );
    }
    if (this.isLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }
    return (
      <Host>
        <ir-page
          label={t('Lcz_CopyRatesToFutureDates', { fallback: 'Copy rates to future dates' })}
          description={t('Lcz_CopyRatesDescription', { fallback: 'Here you can copy over your existing rate plans to the date range you want, easily and efficiently.' })}
        >
          {this.renderForm()}
          {this.renderReview()}
        </ir-page>
      </Host>
    );
  }
}
