import Token from '@/models/Token';
import { Component, Prop, State, Watch, h } from '@stencil/core';
import { ChargeRule, TaxAndChargeSetup, TaxationStrategy, TaxesSetupEntries } from './types';
import { BookingService } from '@/services/booking-service/booking.service';
import { PropertyService } from '@/services/property.service';
import type { HandleExposedPropertyTaxCategoriesParams, TaxCategory } from '@/services/property/types';
import calendar_data from '@/stores/calendar-data';
import { showToast } from '@/utils/utils';

@Component({
  tag: 'ir-tax-service-categories',
  styleUrl: 'ir-tax-service-categories.css',
  scoped: true,
})
export class IrTaxServiceCategories {
  @Prop() ticket: string;
  @Prop() p: string;
  @Prop() language: string = 'en';
  @Prop() propertyid: number;

  @State() isLoading: boolean;
  @State() isSaving: boolean;
  @State() chargeCategoryRules: Map<string, TaxAndChargeSetup> = new Map();
  @State() setupEntries: TaxesSetupEntries;
  @State() autoValidate: boolean;

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

  /** Re-authenticates and re-fetches configuration when a watched prop changes. */
  private reinit() {
    this.tokenService.setToken(this.ticket);
    this.init();
  }

  /** Fetches setup entries and property data, then builds the initial charge rules map. */
  private async init() {
    this.isLoading = true;
    try {
      const [, tableEntries] = await Promise.all([
        this.propertyService.getExposedProperty({ id: this.propertyid, language: this.language }),
        this.bookingService.getSetupEntriesByTableNameMulti(['_VAT_INCLUDED', '_SVC_CATEGORY', '_CITY_TAX_INCLUDED', '_SERVICE_CHARGE_INCLUDED']),
      ]);
      this.setupEntries = this.bookingService.groupEntryTablesResult(tableEntries);
      this.chargeCategoryRules = this.buildInitialRules();
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Strips non-alphanumeric characters and lowercases a string for fuzzy matching
   * against tax names from the property data.
   */
  private normalizeTaxName(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /**
   * Finds a tax entry by keyword from the property's taxes array.
   * Returns undefined when no match is found — the caller should treat that as Not Applicable.
   */
  private findTax(keyword: string) {
    const taxes = calendar_data.property?.taxes ?? [];
    return taxes.find(t => this.normalizeTaxName(t.name).includes(this.normalizeTaxName(keyword)));
  }

  /**
   * Converts a property tax entry to a ChargeRule.
   * Returns `{ mode: '002', value: null }` (Not Applicable) when the tax is absent from the property data.
   */
  private toChargeRule(tax: ReturnType<IrTaxServiceCategories['findTax']>): ChargeRule {
    if (!tax) return { mode: '002', value: null };
    return { mode: tax.is_exlusive ? '000' : '001', value: tax.pct };
  }

  /**
   * Builds the initial charge rules map from property taxes and saved tax categories.
   * ACC (Accommodation) is seeded from the property's taxes array; service categories
   * are seeded from saved `tax_categories` or default to Not Applicable when absent.
   */
  private buildInitialRules(): Map<string, TaxAndChargeSetup> {
    const taxCategories: TaxCategory[] = calendar_data.property?.tax_categories ?? [];

    const savedStrategy = calendar_data.property?.taxation_strategy?.code as TaxationStrategy | undefined;
    const accSetup: TaxAndChargeSetup = {
      vat: this.toChargeRule(this.findTax('vat')),
      cityTax: this.toChargeRule(this.findTax('city')),
      serviceCharge: this.toChargeRule(this.findTax('service')),
      taxationStrategy: savedStrategy ?? TaxationStrategy.Normal,
    };

    const rules = new Map<string, TaxAndChargeSetup>();
    rules.set('ACC', accSetup);

    (this.setupEntries?.svc_category ?? []).forEach(c => {
      const match = taxCategories.find(tc => tc.category.code === c.CODE_NAME);
      rules.set(
        c.CODE_NAME,
        match ? { vat: { mode: match.taxation_mode.code, value: match.pct }, cityTax: null, serviceCharge: null, taxationStrategy: null } : this.createEmptyCategorySetup(),
      );
    });

    return rules;
  }

  /** Returns a default setup for a service category with all fields set to Not Applicable. */
  private createEmptyCategorySetup(): TaxAndChargeSetup {
    return {
      vat: { mode: '002', value: null },
      cityTax: null,
      serviceCharge: null,
      taxationStrategy: null,
    };
  }

  /** Returns true when a charge rule has no percentage value set. */
  private isChargeRuleEmpty(rule: ChargeRule | null | undefined): boolean {
    return !rule || rule.value === null || rule.value === undefined;
  }

  /**
   * Resolves the effective numeric value of a charge rule for payload submission.
   * Mode '002' (Not Applicable) always resolves to 0.
   */
  private resolveChargeValue(rule: ChargeRule | null | undefined): number | null {
    if (!rule) return null;
    return rule.mode === '002' ? 0 : rule.value;
  }

  /** Updates the taxation strategy (Normal / Cumulative) for the ACC category. */
  private handleTaxationStrategyChange(value: TaxationStrategy) {
    const next = new Map(this.chargeCategoryRules);
    next.set('ACC', { ...next.get('ACC'), taxationStrategy: value });
    this.chargeCategoryRules = next;
  }

  /**
   * Updates a single charge field on a category.
   * When the ACC VAT changes, the new percentage is propagated to any service category
   * that still has an empty (unset) VAT value.
   */
  private handleChargeRuleChange(categoryCode: string, field: 'vat' | 'cityTax' | 'serviceCharge', nextRule: ChargeRule) {
    const next = new Map(this.chargeCategoryRules);
    next.set(categoryCode, { ...next.get(categoryCode), [field]: nextRule });

    if (categoryCode === 'ACC' && field === 'vat') {
      (this.setupEntries?.svc_category ?? []).forEach(category => {
        const categorySetup = next.get(category.CODE_NAME);
        if (this.isChargeRuleEmpty(categorySetup?.vat)) {
          next.set(category.CODE_NAME, { ...categorySetup, vat: { ...categorySetup.vat, value: nextRule.value } });
        }
      });
    }

    this.chargeCategoryRules = next;
  }

  /** Assembles the API payload from the current charge rules state. */
  private buildPayload(): HandleExposedPropertyTaxCategoriesParams {
    const accSetup = this.chargeCategoryRules.get('ACC');

    const tax_categories: TaxCategory[] = (this.setupEntries?.svc_category ?? []).map(category => {
      const setup = this.chargeCategoryRules.get(category.CODE_NAME);
      const taxMode = (this.setupEntries?.vat_included ?? []).find(v => v.CODE_NAME === setup?.vat?.mode);
      return {
        category: { code: category.CODE_NAME, description: category.CODE_VALUE_EN },
        taxation_mode: { code: setup?.vat?.mode ?? '', description: taxMode?.CODE_VALUE_EN ?? '' },
        pct: this.resolveChargeValue(setup?.vat) ?? 0,
      };
    });

    return {
      property_id: this.propertyid,
      VAT_INCLUDED_CODE: accSetup?.vat?.mode ?? null,
      VAT_PC: this.resolveChargeValue(accSetup?.vat) ?? null,
      CITY_TAX_INCLUDED_CODE: accSetup?.cityTax?.mode ?? null,
      CITY_TAX_PCT: this.resolveChargeValue(accSetup?.cityTax) ?? null,
      SERVICE_CHARGE_INCLUDED_CODE: accSetup?.serviceCharge?.mode ?? null,
      SERVICE_CHARGE_PCT: this.resolveChargeValue(accSetup?.serviceCharge) ?? null,
      tax_categories,
      TAXATION_STRATEGY: this.chargeCategoryRules.get('ACC').taxationStrategy as any,
    };
  }

  /** Validates and submits the tax configuration to the API. */
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
    const accSetup = this.chargeCategoryRules.get('ACC');
    const filteredVat = (this.setupEntries?.vat_included ?? []).filter(v => v.CODE_NAME !== '000');
    const categories = this.setupEntries?.svc_category ?? [];

    return (
      <ir-page
        label="Tax & Service Categories"
        description="Define taxes and service charges for room rates, cancellations, and on-property services."
        data-testid="ir-tax-service-categories"
      >
        <ir-custom-button slot="page-header" loading={this.isSaving} type="submit" form="tax-service-categories__form" style={{ width: '100px' }} variant="brand">
          Save
        </ir-custom-button>
        <form id="tax-service-categories__form" onSubmit={e => this.handleSubmit(e)}>
          <wa-card>
            <div class="tax-grid">
              {/* Column headers — hidden on mobile, shown via display:contents on desktop */}
              <div class="tax-grid__header" aria-hidden="true">
                <div></div>
                <div class="tax-grid__col-label">VAT</div>
                <div class="tax-grid__col-label">City Tax</div>
                <div class="tax-grid__col-label">Service Charge</div>
                <div class="tax-grid__col-label">Taxation Strategy</div>
              </div>

              {/* Accommodation row */}
              <div class="tax-grid__row">
                <div class="tax-grid__name">
                  <p class="tax-grid__title">Accommodation</p>
                  <p class="tax-grid__hint">Room-related charges applied to reservations and cancellations</p>
                </div>
                <div class="tax-grid__cell" data-label="VAT">
                  <ir-tax-input
                    autoValidate={this.autoValidate}
                    language={this.language}
                    onTaxChange={e => this.handleChargeRuleChange('ACC', 'vat', e.detail)}
                    chargeRule={accSetup?.vat}
                    setupEntries={this.setupEntries?.vat_included ?? []}
                  ></ir-tax-input>
                </div>
                <div class="tax-grid__cell" data-label="City Tax">
                  <ir-tax-input
                    autoValidate={this.autoValidate}
                    language={this.language}
                    onTaxChange={e => this.handleChargeRuleChange('ACC', 'cityTax', e.detail)}
                    chargeRule={accSetup?.cityTax}
                    setupEntries={this.setupEntries?.city_tax_included ?? []}
                  ></ir-tax-input>
                </div>
                <div class="tax-grid__cell" data-label="Service Charge">
                  <ir-tax-input
                    autoValidate={this.autoValidate}
                    language={this.language}
                    onTaxChange={e => this.handleChargeRuleChange('ACC', 'serviceCharge', e.detail)}
                    chargeRule={accSetup?.serviceCharge}
                    setupEntries={this.setupEntries?.service_charge_included ?? []}
                  ></ir-tax-input>
                </div>
                <div class="tax-grid__cell" data-label="Taxation Strategy">
                  <wa-radio-group
                    size="s"
                    orientation="horizontal"
                    value={accSetup?.taxationStrategy ?? TaxationStrategy.Normal}
                    onwa-change={(e: CustomEvent<{ value: string }>) => this.handleTaxationStrategyChange(e.detail.value as TaxationStrategy)}
                  >
                    <wa-radio appearance="button" value={TaxationStrategy.Normal}>
                      Normal
                    </wa-radio>
                    <wa-radio appearance="button" value={TaxationStrategy.Cumulative}>
                      Cumulative
                    </wa-radio>
                  </wa-radio-group>
                </div>
              </div>

              {/* Service category rows */}
              {categories.map(category => {
                const categorySetup = this.chargeCategoryRules.get(category.CODE_NAME);
                return [
                  <div class="tax-grid__divider">
                    <wa-divider></wa-divider>
                  </div>,
                  <div class="tax-grid__row">
                    <div class="tax-grid__name">
                      <p class="tax-grid__title">{category.CODE_VALUE_EN}</p>
                      {category.NOTES && <p class="tax-grid__hint">{category.NOTES}</p>}
                    </div>
                    <div class="tax-grid__cell" data-label="VAT">
                      <ir-tax-input
                        autoValidate={this.autoValidate}
                        language={this.language}
                        onTaxChange={e => this.handleChargeRuleChange(category.CODE_NAME, 'vat', e.detail)}
                        chargeRule={categorySetup?.vat}
                        setupEntries={filteredVat}
                      ></ir-tax-input>
                    </div>
                    <div class="tax-grid__cell"></div>
                    <div class="tax-grid__cell"></div>
                    <div class="tax-grid__cell"></div>
                  </div>,
                ];
              })}
            </div>
          </wa-card>
        </form>
        {/* </div> */}
      </ir-page>
    );
  }
}
