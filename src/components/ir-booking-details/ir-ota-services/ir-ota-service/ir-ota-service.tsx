import { Component, Prop, h } from '@stencil/core';
import { OtaService } from '@/models/booking.dto';
import { t } from '@/services/locale/t';
import { formatCount, formatNumber } from '@/utils/number';
@Component({
  tag: 'ir-ota-service',
  styleUrl: 'ir-ota-service.css',
  scoped: true,
})
export class IrOtaService {
  @Prop() service: OtaService;
  render() {
    return (
      <div class="p-1">
        {/* <ir-label content={this.service?.name} labelText={`Name:`}></ir-label>
        <ir-label content={this.service?.nights?.toString()} labelText={`Nights:`}></ir-label>
        <ir-label content={this.service?.persons?.toString()} labelText={`Persons:`}></ir-label>
        <ir-label content={this.service?.price_mode} labelText={`Price mode:`}></ir-label>
        <ir-label content={this.service?.price_per_unit?.toString()} labelText={`Price per unit:`}></ir-label>
        <ir-label content={this.service?.total_price?.toString()} labelText={`Total price:`}></ir-label> */}
        <div class="m-0 p-0 d-flex align-items-center justify-content-between">
          <p class="m-0 d-flex align-items-center" style={{ gap: '0.5rem' }}>
            <b>{this.service.name}</b>
            <span class="p-0 m-0">
              {formatCount(this.service?.persons)} {this.service.persons > 1 ? t('Lcz_PersonPlural', { fallback: 'persons' }) : t('Lcz_PersonSingular', { fallback: 'person' })}
            </span>
            <span class="p-0 m-0">
              {formatCount(this.service?.nights)} {this.service.nights > 1 ? t('Lcz_Nights', { fallback: 'nights' }) : t('Lcz_Night', { fallback: 'night' })}
            </span>
          </p>
          <b>{formatNumber(this.service.total_price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
        </div>
        <div>
          <ir-label containerStyle={{ margin: '0', padding: '0' }} content={this.service?.price_mode} labelText={t('Lcz_PriceMode', { fallback: 'Price mode:' })}></ir-label>
          <ir-label
            containerStyle={{ margin: '0', padding: '0' }}
            class="m-0 p-0"
            content={this.service?.price_per_unit?.toString()}
            labelText={t('Lcz_PricePerUnit', { fallback: 'Price per unit:' })}
          ></ir-label>
        </div>
      </div>
    );
  }
}
