import { Component, Event, EventEmitter, Prop, h } from '@stencil/core';
import { ExtraServicesService } from '@/services/extra-services';
import { AccommodationExtraCode, defaultDayUseConfig, ExtraServiceDefinition, ExtraServiceDefinitionSchema, ExtraServiceSection } from '@/services/extra-services/types';
import { VatIncludedCodes } from '@/types/enums';
import { showToast } from '@/utils/utils';

@Component({
  tag: 'ir-extra-service-editor-form',
  styleUrl: 'ir-extra-service-editor-form.css',
  scoped: true,
})
export class IrExtraServiceEditorForm {
  @Prop({ mutable: true }) service: ExtraServiceDefinition;
  @Prop() formId: string;

  @Event() upsertExtraService: EventEmitter<ExtraServiceDefinition>;
  @Event() closeDrawer: EventEmitter<void>;
  @Event() loadingChanged: EventEmitter<boolean>;

  private extraServicesService = new ExtraServicesService();

  private updateField(value: Partial<ExtraServiceDefinition>) {
    this.service = { ...this.service, ...value };
  }

  private isDayUse() {
    return this.service?.code === AccommodationExtraCode.DayUse;
  }

  private isAccommodation() {
    return this.service?.section === ExtraServiceSection.Accommodation;
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    try {
      this.loadingChanged.emit(true);
      const parsed = ExtraServiceDefinitionSchema.parse(this.service);
      const saved = await this.extraServicesService.handleExposedExtraService({ extra_service: parsed });
      this.upsertExtraService.emit(saved);
      showToast({ title: 'Saved Successfully', type: 'success' });
      this.closeDrawer.emit();
    } catch (error) {
      console.error(error);
      showToast({ title: 'Something went wrong', type: 'error' });
    } finally {
      this.loadingChanged.emit(false);
    }
  }

  render() {
    const service = this.service;
    const dayUseConfig = service?.day_use_config ?? defaultDayUseConfig();

    return (
      <form id={this.formId} onSubmit={e => this.handleSubmit(e)} class="extra-service-form">
        <ir-validator schema={ExtraServiceDefinitionSchema.shape.name} value={service?.name} valueEvent="text-change input input-change" showErrorMessage>
          <ir-input
            label="Name"
            placeholder="Service name"
            value={service?.name}
            readonly={this.isAccommodation()}
            onText-change={(e: CustomEvent<string>) => this.updateField({ name: e.detail })}
          ></ir-input>
        </ir-validator>

        <ir-validator schema={ExtraServiceDefinitionSchema.shape.default_price} value={service?.default_price} valueEvent="text-change input input-change" showErrorMessage>
          <ir-input
            label="Default Price (USD)"
            mask={'price'}
            value={service?.default_price?.toString()}
            onText-change={(e: CustomEvent<string>) => this.updateField({ default_price: Number(e.detail) })}
          >
            <span slot="start">$</span>
          </ir-input>
        </ir-validator>

        <div class="extra-service-form__field">
          <p class="extra-service-form__label">VAT</p>
          <wa-radio-group
            size="s"
            orientation="horizontal"
            value={service?.vat_mode}
            onwa-change={(e: CustomEvent<{ value: string }>) => this.updateField({ vat_mode: e.detail.value as ExtraServiceDefinition['vat_mode'] })}
          >
            <wa-radio appearance="button" value={VatIncludedCodes.Inclusive}>
              Inclusive
            </wa-radio>
            <wa-radio appearance="button" value={VatIncludedCodes.Exclusive}>
              Exclusive
            </wa-radio>
          </wa-radio-group>
        </div>

        <wa-switch
          checked={service?.allow_price_override}
          defaultChecked={service?.allow_price_override}
          onchange={e => this.updateField({ allow_price_override: (e.target as HTMLInputElement).checked })}
        >
          Allow price override
        </wa-switch>

        <wa-switch checked={service?.is_active} defaultChecked={service?.is_active} onchange={e => this.updateField({ is_active: (e.target as HTMLInputElement).checked })}>
          Active
        </wa-switch>

        {this.isDayUse() && (
          <div class="extra-service-form__day-use">
            <wa-switch
              checked={dayUseConfig.block_night}
              defaultChecked={dayUseConfig.block_night}
              onchange={e => this.updateField({ day_use_config: { ...dayUseConfig, block_night: (e.target as HTMLInputElement).checked } })}
            >
              Block Night
            </wa-switch>

            {dayUseConfig.block_night && (
              <div class="extra-service-form__day-use-times">
                <ir-input
                  label="Default Start Time"
                  mask={'time'}
                  value={dayUseConfig.default_start_time}
                  onText-change={(e: CustomEvent<string>) => this.updateField({ day_use_config: { ...dayUseConfig, default_start_time: e.detail } })}
                ></ir-input>
                <ir-input
                  label="Default End Time"
                  mask={'time'}
                  value={dayUseConfig.default_end_time}
                  onText-change={(e: CustomEvent<string>) => this.updateField({ day_use_config: { ...dayUseConfig, default_end_time: e.detail } })}
                ></ir-input>
              </div>
            )}
          </div>
        )}
      </form>
    );
  }
}
