import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import WaSwitch from '@awesome.me/webawesome/dist/components/switch/switch';
import { AccommodationExtraCode, createBlankAddon, ExtraServiceDefinition, ExtraServiceSection } from '@/services/extra-services/types';
import { VatIncludedCodes } from '@/types/enums';
import { t } from '@/services/locale/t';
import { formatNumber } from '@/utils/number';

@Component({
  tag: 'ir-extra-services-table',
  styleUrls: ['ir-extra-services-table.css', '../../../common/table.css'],
  scoped: true,
})
export class IrExtraServicesTable {
  @Prop() services: ExtraServiceDefinition[] = [];
  @Prop() section: ExtraServiceSection;
  @Prop() propertyId: number;

  @Event() upsertExtraService: EventEmitter<ExtraServiceDefinition>;
  @Event() toggleExtraServiceActive: EventEmitter<ExtraServiceDefinition>;

  private isAddonSection() {
    return this.section === ExtraServiceSection.BookingEngineAddon;
  }

  private getVatLabel(service: ExtraServiceDefinition) {
    return service.vat_mode === VatIncludedCodes.Inclusive ? t('Lcz_Inclusive', { fallback: 'Inclusive' }) : t('Lcz_Exclusive', { fallback: 'Exclusive' });
  }

  private getDetails(service: ExtraServiceDefinition) {
    if (service.code !== AccommodationExtraCode.DayUse || !service.day_use_config) {
      return null;
    }
    const { block_night, default_start_time, default_end_time } = service.day_use_config;
    return t('Lcz_BlockNightDetailFormat', {
      fallback: `Block Night: ${block_night ? 'Yes' : 'No'} (${default_start_time}–${default_end_time})`,
      params: [block_night ? t('Lcz_YES', { fallback: 'Yes' }) : t('Lcz_NO', { fallback: 'No' }), default_start_time, default_end_time],
    });
  }

  private createAddon = () => {
    this.upsertExtraService.emit(createBlankAddon(this.propertyId));
  };

  render() {
    return (
      <Host>
        <div class="table--container">
          <table class="table">
            <thead>
              <tr>
                <th class="extra-services-table__header">{t('Lcz_Name', { fallback: 'Name' })}</th>
                <th class="extra-services-table__header">{t('Lcz_DefaultPriceUsd', { fallback: 'Default Price (USD)' })}</th>
                <th class="extra-services-table__header">{t('Lcz_Vat', { fallback: 'VAT' })}</th>
                <th class="extra-services-table__header">{t('Lcz_AllowOverrideHeader', { fallback: 'Allow Override' })}</th>
                <th class="extra-services-table__header">{t('Lcz_DetailsHeader', { fallback: 'Details' })}</th>
                <th class="extra-services-table__header">{t('Lcz_Active', { fallback: 'Active' })}</th>
                <th class="extra-services-table__header">
                  {this.isAddonSection() && (
                    <div class="extra-services-table__action">
                      <wa-tooltip for="create-addon-button">{t('Lcz_NewAddOn', { fallback: 'New Add-On' })}</wa-tooltip>
                      <ir-custom-button onClickHandler={this.createAddon} variant="neutral" appearance="plain" id="create-addon-button" data-testid="create-addon-button">
                        <wa-icon name="plus" style={{ fontSize: '1.2rem' }} label={t('Lcz_NewAddOn', { fallback: 'New Add-On' })}></wa-icon>
                      </ir-custom-button>
                    </div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {this.services.map(service => {
                const details = this.getDetails(service);
                return (
                  <tr class="ir-table-row" key={service.code ?? service.id}>
                    <td>{service.name}</td>
                    <td>{formatNumber(service.default_price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>{this.getVatLabel(service)}</td>
                    <td>{service.allow_price_override ? t('Lcz_YES', { fallback: 'Yes' }) : t('Lcz_NO', { fallback: 'No' })}</td>
                    <td class="extra-services-table__muted">{details ?? '—'}</td>
                    <td>
                      <wa-switch
                        onchange={e => this.toggleExtraServiceActive.emit({ ...service, is_active: (e.target as WaSwitch).checked })}
                        defaultChecked={service.is_active}
                        checked={service.is_active}
                      ></wa-switch>
                    </td>
                    <td>
                      <div class="extra-services-table__action">
                        <ir-custom-button appearance="plain" variant="neutral" onClickHandler={() => this.upsertExtraService.emit(service)}>
                          <wa-icon name="edit" aria-hidden="true" style={{ fontSize: '1.2rem' }}></wa-icon>
                        </ir-custom-button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {this.services?.length === 0 && (
                <tr class="empty-row">
                  <td colSpan={7}>
                    <ir-empty-state message={t('Lcz_NoAddOnsYet', { fallback: 'No add-ons yet' })}></ir-empty-state>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Host>
    );
  }
}
