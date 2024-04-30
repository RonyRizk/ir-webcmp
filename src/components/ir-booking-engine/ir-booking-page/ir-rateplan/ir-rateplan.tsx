import { Component, Event, EventEmitter, Fragment, Prop, h } from '@stencil/core';
import { RatePlan, Variation } from '@/models/property';
import app_store from '@/stores/app.store';
import { IRatePlanSelection, reserveRooms, updateRoomParams } from '@/stores/booking';
import { cn, formatAmount } from '@/utils/utils';

@Component({
  tag: 'ir-rateplan',
  styleUrl: 'ir-rateplan.css',
  shadow: true,
})
export class IrRateplan {
  @Prop() ratePlan: RatePlan;
  @Prop() visibleInventory?:
    | IRatePlanSelection
    | {
        reserved: number;
        visibleInventory?: number;
        selected_variation: any;
      };
  @Prop() roomTypeInventory: number;
  @Prop() roomTypeId: number;

  @Event() animateBookingButton: EventEmitter<null>;

  handleVariationChange(e: CustomEvent, variations: Variation[], rateplanId: number, roomTypeId: number) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const value = e.detail;
    const selectedVariation = variations.find(v => (v.adult_nbr + v.child_nbr).toString() === value);
    console.log(selectedVariation);
    if (!selectedVariation) {
      return;
    }
    updateRoomParams({ params: { selected_variation: selectedVariation }, ratePlanId: rateplanId, roomTypeId });
  }
  render() {
    return (
      <div class="app_container flex w-full flex-col space-y-1 bg-gray-100 p-2 text-sm lg:grid lg:grid-cols-7 lg:gap-4">
        <div
          class={cn('flex w-full justify-between md:w-fit md:justify-start', {
            'lg:col-span-1 ': !this.ratePlan.custom_text,
            'xl:col-span-2': this.ratePlan.custom_text,
          })}
        >
          <p class="line-clamp-3 font-semibold">
            <span class="text-base">{this.ratePlan.short_name}</span>
            <span class="hidden text-sm text-slate-700 md:inline">{this.ratePlan.custom_text}</span>
          </p>

          <div class="flex items-start gap-1 md:hidden">
            <p class="font-medium">{formatAmount(this.visibleInventory?.selected_variation?.amount, app_store.userPreferences.currency_id)}</p>
            <p class="font-medium text-red-500 line-through">
              {formatAmount(this.visibleInventory?.selected_variation?.total_before_discount, app_store.userPreferences.currency_id)}
            </p>
          </div>
        </div>

        <p class={cn('mobile_custom_text line-clamp-3 text-xs text-slate-700 md:line-clamp-none', 'md:hidden')}>{this.ratePlan.custom_text}</p>

        <div
          class={cn('flex w-full  flex-col space-y-2 md:flex-row  md:items-start md:justify-between md:space-y-0 lg:col-span-5 lg:grid lg:grid-cols-5 lg:gap-4', {
            'lg:col-span-6': !this.ratePlan.custom_text,
            'xl:col-span-5': this.ratePlan.custom_text,
          })}
        >
          <div class={cn('lg:col-span-2')}>
            <ir-select
              class="w-full md:w-auto"
              label="Travelers"
              value={(this.visibleInventory?.selected_variation?.adult_nbr + this.visibleInventory?.selected_variation?.child_nbr).toString()}
              onValueChange={e => {
                this.handleVariationChange(e, this.ratePlan.variations, this.ratePlan.id, this.roomTypeId);
              }}
              data={this.ratePlan.variations.map(v => ({
                id: (v.adult_nbr + v.child_nbr).toString(),
                value: v.adult_child_offering,
              }))}
            ></ir-select>
            <div class="hidden items-center gap-1 md:flex">
              <p class="text-xs">Cancelation conditions</p>
              <ir-tooltip class="flex items-center justify-center text-gray-500" message={this.ratePlan.cancelation + '<br>' + this.ratePlan.guarantee}></ir-tooltip>
            </div>
          </div>

          <div class="hidden flex-col items-center justify-between gap-1 md:flex">
            <Fragment>
              <p class="font-medium line-through">{formatAmount(this.visibleInventory?.selected_variation?.total_before_discount, app_store.userPreferences.currency_id)}</p>
              <p class="font-medium  text-red-500">-%{this.visibleInventory?.selected_variation?.discount_pct}</p>
            </Fragment>
          </div>

          <div class="hidden flex-col items-center  justify-between md:flex">
            <Fragment>
              <p class="text-lg font-medium">{formatAmount(this.visibleInventory?.selected_variation?.amount, app_store.userPreferences.currency_id)}</p>
              <p class="text-xs font-medium">{formatAmount(this.visibleInventory?.selected_variation?.amount_per_night, app_store.userPreferences.currency_id)}/night</p>
            </Fragment>
          </div>

          <ir-select
            onValueChange={e => {
              reserveRooms(this.roomTypeId, this.ratePlan.id, Number(e.detail));
              this.animateBookingButton.emit(null);
            }}
            label="Rooms"
            value={this.visibleInventory?.reserved}
            class={cn('w-full  md:w-auto')}
            data={[...new Array(this.roomTypeInventory + 1)]?.map((_, i) => ({
              id: i,
              value:
                i === 0
                  ? 'Select...'
                  : `${i}&nbsp;&nbsp;&nbsp;${i === 0 ? '' : formatAmount(this.visibleInventory?.selected_variation?.amount * i, app_store.userPreferences.currency_id)}`,
              disabled: i >= this.visibleInventory?.visibleInventory + 1,
              html: true,
            }))}
          ></ir-select>
        </div>
      </div>
    );
  }
}
