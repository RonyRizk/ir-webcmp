import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { z } from 'zod';
import { ChargeRule } from '@/components/ir-tax-service-categories/types';
import calendar_data from '@/stores/calendar-data';

@Component({
  tag: 'ir-extra-service-price-input',
  styleUrl: 'ir-extra-service-price-input.css',
  shadow: true,
})
export class IrExtraServicePriceInput {
  @Prop() label: string;
  @Prop() placeholder: string;

  /**
   * Controlled charge rule value passed from the parent: `value` holds the price,
   * `mode` holds the taxation mode code (Inclusive/Exclusive).
   */
  @Prop() chargeRule: ChargeRule;

  @Prop() autoValidate: boolean;

  @State() price: ChargeRule;

  @Event() priceChange: EventEmitter<ChargeRule>;

  componentWillLoad() {
    if (this.chargeRule) this.updatePriceField(this.chargeRule);
  }

  @Watch('chargeRule')
  handlePriceValueChange(newValue: ChargeRule, oldValue: ChargeRule) {
    if (newValue !== oldValue) {
      this.updatePriceField(newValue);
    }
  }

  private updatePriceField(params: Partial<ChargeRule>) {
    this.price = { ...(this.price || {}), ...params };
  }

  render() {
    return (
      <Host class="ir-extra-service-price-input">
        <ir-validator
          form="extra-services-settings__form"
          class="ir-extra-service-price-input__price-wrapper"
          value={this.price?.value ?? null}
          schema={z
            .number()
            .nullable()
            .refine(value => value === null || value >= 0.01, { message: 'Price must be greater than 0' })}
        >
          <ir-input
            value={this.price?.value?.toString() ?? ''}
            mask={'price'}
            onChange={() => {
              this.priceChange.emit({ value: this.price?.value ?? this.chargeRule?.value ?? null, mode: this.price?.mode ?? this.chargeRule?.mode ?? '' });
            }}
            part="input"
            label={this.label}
            class="ir-extra-service-price-input__price"
            exportparts="base"
            size="s"
            placeholder={this.placeholder}
            onText-change={e => {
              const inputValue = `${e.detail ?? ''}`.trim();
              const value = inputValue === '' ? null : Number(inputValue);
              this.updatePriceField({ value });
            }}
          >
            <span slot="start" class="ir-extra-service-price-input__price-symbol">
              {calendar_data.property.currency.symbol}
            </span>
            <slot name="end" slot="end"></slot>
          </ir-input>
        </ir-validator>
      </Host>
    );
  }
}
