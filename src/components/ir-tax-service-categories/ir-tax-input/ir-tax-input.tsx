import { IEntries } from '@/models/IBooking';
import WaSelect from '@awesome.me/webawesome/dist/components/select/select';
import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { z } from 'zod';
import { ChargeRule } from '../types';
import { getEntryValue } from '@/utils/utils';

const taxSetupSchema = z.string().min(1, 'Select a setup entry');

@Component({
  tag: 'ir-tax-input',
  styleUrl: 'ir-tax-input.css',
  shadow: true,
})
export class IrTaxInput {
  /**
   * List of setup entries used to populate the tax mode select.
   *
   * Each entry represents a tax application option
   * (e.g. Not Applicable, Inclusive, Exclusive).
   */
  @Prop() setupEntries: IEntries[] = [];

  /**
   * Label displayed above the percentage input.
   */
  @Prop() label: string;

  /**
   * Placeholder text shown in the percentage input.
   */
  @Prop() placeholder: string;

  /**
   * Disables the percentage input when true.
   *
   * Note: the input is also automatically disabled
   * when the selected tax mode is "Not Applicable".
   */
  @Prop() inputDisabled: boolean;

  /**
   * Current language used to resolve translated setup entry labels.
   * Defaults to English ("en").
   */
  @Prop() language: string = 'en';

  /**
   * Controlled charge rule value passed from the parent.
   *
   * This represents the committed tax state and is used
   * to sync the internal component state.
   */
  @Prop() chargeRule: ChargeRule;

  /**
   * Enables automatic validation behavior when true.
   */
  @Prop() autoValidate: boolean;

  /**
   * Internal working copy of the charge rule.
   *
   * This state is updated while the user is interacting
   * with the input/select and is only emitted when
   * a meaningful change is committed.
   */
  @State() tax: ChargeRule;

  /**
   * Emitted when the tax rule meaningfully changes.
   *
   * Emission happens on:
   * - input commit (IMask change / blur)
   * - tax mode selection change
   */
  @Event() taxChange: EventEmitter<ChargeRule>;

  componentWillLoad() {
    if (this.chargeRule) this.updateTaxField(this.chargeRule);
  }

  private get isTaxInputDisabled() {
    return this.inputDisabled || this.tax?.mode === '002';
  }

  @Watch('chargeRule')
  handleTaxValueChange(newValue: ChargeRule, oldValue: ChargeRule) {
    if (newValue !== oldValue) {
      this.updateTaxField(newValue);
    }
  }

  private updateTaxField(params: Partial<ChargeRule>) {
    this.tax = { ...(this.tax || {}), ...params };
  }

  render() {
    return (
      <Host class="ir-tax-input">
        <ir-validator
          form="tax-service-categories__form"
          class="ir-tax-input__percentage-wrapper"
          value={this.tax?.value ?? null}
          schema={this.isTaxInputDisabled ? z.number().nullable() : z.coerce.number().min(0).max(30)}
        >
          <ir-input
            disabled={this.isTaxInputDisabled}
            value={this.tax?.value?.toString() ?? ''}
            mask={{
              min: 0,
              max: 30,
              mask: Number,
            }}
            onChange={() => {
              this.taxChange.emit({ value: this.tax?.value ?? this.chargeRule?.value ?? null, mode: this.tax?.mode ?? this.chargeRule?.mode ?? '' });
            }}
            part="input"
            label={this.label}
            class="ir-tax-input__percentage"
            size="s"
            placeholder={this.placeholder}
            onText-change={e => {
              const inputValue = `${e.detail ?? ''}`.trim();
              const value = inputValue === '' ? null : Number(inputValue);
              this.updateTaxField({ value });
            }}
          >
            <span slot="end" class="ir-tax-input__percentage-symbol">
              %
            </span>
          </ir-input>
        </ir-validator>
        <ir-validator form="tax-service-categories__form" class="ir-tax-input__select-wrapper" schema={taxSetupSchema} value={this.tax?.mode || ''}>
          <wa-select
            part="select"
            class="ir-tax-input__select"
            size="s"
            value={this.tax?.mode}
            defaultValue={this.tax?.mode}
            onchange={e => {
              const mode = (e.target as WaSelect).value.toString();
              this.updateTaxField({ mode });
              this.taxChange.emit({ value: this.tax?.value ?? this.chargeRule?.value ?? null, mode });
            }}
            placeholder="Select..."
          >
            {this.setupEntries.map(entry => (
              <wa-option key={entry.CODE_NAME} value={entry.CODE_NAME}>
                {getEntryValue({ entry, language: this.language })}
              </wa-option>
            ))}
          </wa-select>
        </ir-validator>
      </Host>
    );
  }
}
