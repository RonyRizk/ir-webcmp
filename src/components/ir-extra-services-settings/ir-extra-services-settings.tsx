import Token from '@/models/Token';
import { Component, Prop, State, Watch, h } from '@stencil/core';
import { BookingService } from '@/services/booking-service/booking.service';
import { PropertyService } from '@/services/property.service';
import { taxationModes, type HandleExposedPropertyTaxCategoriesParams, type TaxCategory } from '@/services/property/types';
import { getAccTaxPayloadFields, findAccTax, toAccChargeRule, type AccChargeRule } from '@/services/property/acc-tax.helpers';
import { IEntries } from '@/models/property';
import { ChargeRule, TaxesSetupEntries } from '@/components/ir-tax-service-categories/types';
import { getExtraServiceDefaultPrice, getDayUseBlockState, getBabyCotPricingModel } from '@/stores/calendar-data';
import { getEntryValue, showToast } from '@/utils/utils';
import { groupSvcCategoriesByParent, SvcCategoryGroup } from '@/utils/svc-category.utils';

// /** `_SVC_CATEGORY` short code for Day Use — only used to place the Block Night switch, not for grouping. */
// const DAY_USE_CATEGORY_CODE = 'DUZ';

/** `_SVC_CATEGORY` short code for Baby Cot — only used to place the Stay/Night pricing-model select, not for grouping. */
const BABY_COT_CATEGORY_CODE = 'BCT';

/** Hidden `_SVC_CATEGORY` — only used for categories that doesn't require a default price. */
const HIDDEN_SUB_CATEGORIES = new Set(['MNB']);

/** Valid `BABY_COT_PRICING_MODEL` values — the baby cot's default price is either a flat per-stay charge or a per-night charge. */
const BABY_COT_PRICING_MODELS = ['Stay', 'Night'] as const;
type BabyCotPricingModel = (typeof BABY_COT_PRICING_MODELS)[number];

@Component({
  tag: 'ir-extra-services-settings',
  styleUrl: 'ir-extra-services-settings.css',
  scoped: true,
})
export class IrExtraServicesSettings {
  @Prop() ticket: string;
  @Prop() p: string;
  @Prop() language: string = 'en';
  @Prop() propertyid: number;

  @State() isLoading: boolean;
  @State() isSaving: boolean;
  @State() setupEntries: TaxesSetupEntries;
  @State() priceCategoryRules: Map<string, ChargeRule> = new Map();
  @State() autoValidate: boolean;
  @State() dayUseBlockNight: boolean = false;
  @State() babyCotPricingModel: BabyCotPricingModel = 'Stay';

  private tokenService = new Token();
  private bookingService = new BookingService();
  private propertyService = new PropertyService();

  componentWillLoad() {
    if (this.ticket) {
      this.tokenService.setToken(this.ticket);
      this.init();
    }
  }

  @Watch('ticket')
  handleTicketChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue) this.reinit();
  }

  @Watch('p')
  handlePChange(newValue: string, oldValue: string) {
    if (newValue !== oldValue && this.ticket) this.reinit();
  }

  @Watch('propertyid')
  handlePropertyIdChange(newValue: number, oldValue: number) {
    if (newValue !== oldValue && this.ticket) this.reinit();
  }

  private reinit() {
    this.tokenService.setToken(this.ticket);
    this.init();
  }

  private async init() {
    this.isLoading = true;
    try {
      const [, tableEntries] = await Promise.all([
        this.propertyService.getExposedProperty({ id: this.propertyid, language: this.language }),
        this.bookingService.getSetupEntriesByTableNameMulti(['_VAT_INCLUDED', '_SVC_CATEGORY']),
      ]);
      this.setupEntries = this.bookingService.groupEntryTablesResult(tableEntries);
      this.priceCategoryRules = this.buildInitialRules();
      this.dayUseBlockNight = getDayUseBlockState() === '1';
      this.babyCotPricingModel = this.resolveBabyCotPricingModel(getBabyCotPricingModel());
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  /** `svc_category` entries grouped by their `NOTES`-referenced parent code. See `groupSvcCategoriesByParent`. */
  private get serviceGroups(): SvcCategoryGroup[] {
    return Array.from(groupSvcCategoriesByParent(this.setupEntries?.svc_category ?? [], this.language).values());
  }

  /** All grouped categories flattened, for building the price-rules map and the save payload. */
  private get categories(): IEntries[] {
    return this.serviceGroups.flatMap(group => group.categories);
  }

  /**
   * The property's VAT setup. Every grouped extra service shares this one rate and is always
   * marked Inclusive — there's no per-category tax mode to configure anymore, so this single
   * value both drives the card-header summary and is what gets saved for every category.
   */
  private get vatSummary(): AccChargeRule {
    return toAccChargeRule(findAccTax('vat'));
  }

  /** Formats a charge rule as e.g. "15% Inclusive" or "Not Applicable". */
  private formatAccChargeRule(rule: AccChargeRule): string {
    if (rule.mode === taxationModes.NOT_APPLICABLE) return 'Not Applicable';
    return `${rule.value ?? 0}% ${rule.mode === taxationModes.INCLUSIVE ? 'Inclusive' : 'Exclusive'}`;
  }

  /** Builds the initial price rules map from `extra_info`'s `SVC_DEFAULT_PRICE_<code>` entries. Mode is always Inclusive — see `vatSummary`. */
  private buildInitialRules(): Map<string, ChargeRule> {
    const rules = new Map<string, ChargeRule>();

    this.categories.forEach(c => {
      const defaultPrice = getExtraServiceDefaultPrice(c.CODE_NAME);
      rules.set(c.CODE_NAME, { mode: taxationModes.INCLUSIVE, value: defaultPrice !== undefined ? Number(defaultPrice) : null });
    });

    return rules;
  }

  /** Narrows the persisted `BABY_COT_PRICING_MODEL` string to a known option, defaulting to `'Stay'` if unset or unrecognized. */
  private resolveBabyCotPricingModel(value: string | undefined): BabyCotPricingModel {
    return (BABY_COT_PRICING_MODELS as readonly string[]).includes(value ?? '') ? (value as BabyCotPricingModel) : 'Stay';
  }

  private handlePriceRuleChange(categoryCode: string, nextRule: ChargeRule) {
    const next = new Map(this.priceCategoryRules);
    next.set(categoryCode, nextRule);
    this.priceCategoryRules = next;
  }

  /** Assembles the API payload from the current price rules state. Every category shares the property's VAT rate and is Inclusive. */
  private buildPayload(): HandleExposedPropertyTaxCategoriesParams {
    const vat = this.vatSummary;
    const inclusiveEntry = (this.setupEntries?.vat_included ?? []).find(v => v.CODE_NAME === taxationModes.INCLUSIVE);
    const tax_categories: TaxCategory[] = this.categories.map(category => {
      const rule = this.priceCategoryRules.get(category.CODE_NAME);
      return {
        category: { code: category.CODE_NAME, description: category.CODE_VALUE_EN },
        taxation_mode: { code: taxationModes.INCLUSIVE, description: inclusiveEntry?.CODE_VALUE_EN ?? 'Inclusive' },
        pct: vat.mode === taxationModes.NOT_APPLICABLE ? 0 : (vat.value ?? 0),
        default_price: rule?.value ?? null,
      };
    });

    return {
      property_id: this.propertyid,
      ...getAccTaxPayloadFields(),
      tax_categories,
      DAY_USE_BLOCK: this.dayUseBlockNight ? '1' : '0',
      BABY_COT_PRICING_MODEL: this.babyCotPricingModel,
    };
  }

  /** Validates and submits the extra-service price configuration to the API. */
  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    this.autoValidate = true;
    try {
      this.isSaving = true;
      const payload = this.buildPayload();
      await this.propertyService.handleExposedPropertyTaxCategories(payload);
      showToast({
        title: 'Saved Successfully',
        type: 'success',
      });
    } catch (error) {
      console.error(error);
    } finally {
      this.isSaving = false;
    }
  }

  render() {
    if (this.isLoading) {
      return <ir-loading-screen></ir-loading-screen>;
    }

    return (
      <ir-page label="Extra Services" description="Define default pricing and options for the extra services offered on this property." data-testid="ir-extra-services-settings">
        <ir-custom-button slot="page-header" loading={this.isSaving} type="submit" form="extra-services-settings__form" style={{ width: '100px' }} variant="brand">
          Save
        </ir-custom-button>
        <form id="extra-services-settings__form" onSubmit={e => this.handleSubmit(e)} class="extra-services-settings__groups">
          {this.serviceGroups.length === 0 && (
            <ir-empty-state message="No extra-service groups are set up yet. Add a service category whose CODE_NAME is referenced by other categories' NOTES to group them here."></ir-empty-state>
          )}
          {this.serviceGroups.map(group => (
            <wa-card appearance="plain" class="extra-services-settings__card">
              <div slot="header" class="extra-services-settings__header">
                <span>{group.label}</span>
                <span class="extra-services-settings__tax-chip">
                  <span class="extra-services-settings__tax-chip-label">VAT</span>
                  <span>{this.formatAccChargeRule(this.vatSummary)}</span>
                </span>
              </div>
              <div class="extra-services-grid">
                {group.categories
                  .filter(c => !HIDDEN_SUB_CATEGORIES.has(c.CODE_NAME))
                  .map((category, idx) => {
                    const rule = this.priceCategoryRules.get(category.CODE_NAME);
                    // const isDayUse = category.CODE_NAME === DAY_USE_CATEGORY_CODE;
                    const isBabyCot = category.CODE_NAME === BABY_COT_CATEGORY_CODE;
                    const isExtraBed = category.CODE_NAME === 'EXB';
                    return [
                      idx > 0 && (
                        <div class="extra-services-grid__divider" key={category.CODE_NAME + 'divider' + idx}>
                          <wa-divider></wa-divider>
                        </div>
                      ),
                      <div class="extra-services-grid__row" id={category.CODE_NAME} key={category.CODE_NAME + 'row' + idx}>
                        <div class="extra-services-grid__name">
                          <p class="extra-services-grid__title">{getEntryValue({ entry: category, language: this.language })}</p>
                        </div>
                        <div class="extra-services-grid__controls">
                          <div class="extra-services-grid__cell">
                            {isBabyCot ? (
                              <div class={'ir__field-group'}>
                                <ir-extra-service-price-input
                                  // class={'--grow'}
                                  autoValidate={this.autoValidate}
                                  onPriceChange={e => this.handlePriceRuleChange(category.CODE_NAME, e.detail)}
                                  chargeRule={rule}
                                ></ir-extra-service-price-input>

                                <wa-select
                                  value={this.babyCotPricingModel}
                                  defaultValue={this.babyCotPricingModel}
                                  size="s"
                                  style={{ width: 'min-content', minWidth: '100px' }}
                                  onchange={e => (this.babyCotPricingModel = (e.target as HTMLSelectElement).value as BabyCotPricingModel)}
                                >
                                  <wa-option value="Stay">Stay</wa-option>
                                  <wa-option value="Night">Night</wa-option>
                                </wa-select>
                              </div>
                            ) : (
                              <ir-extra-service-price-input
                                autoValidate={this.autoValidate}
                                onPriceChange={e => this.handlePriceRuleChange(category.CODE_NAME, e.detail)}
                                chargeRule={rule}
                              >
                                {isExtraBed && <span slot="end">/night</span>}
                              </ir-extra-service-price-input>
                            )}
                          </div>
                          {/* <div class="extra-services-grid__cell">
                          {isDayUse && (
                            <wa-switch
                              checked={this.dayUseBlockNight}
                              defaultChecked={this.dayUseBlockNight}
                              onchange={e => (this.dayUseBlockNight = (e.target as HTMLInputElement).checked)}
                            >
                              Block night
                            </wa-switch>
                          )}
                        </div> */}
                        </div>
                      </div>,
                    ];
                  })}
              </div>
            </wa-card>
          ))}
        </form>
      </ir-page>
    );
  }
}
