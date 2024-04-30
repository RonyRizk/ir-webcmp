import { ISmokingOption, RatePlan, Variation } from '@/models/property';
import app_store from '@/stores/app.store';
import booking_store, { IRatePlanSelection } from '@/stores/booking';
import { checkout_store, onCheckoutDataChange } from '@/stores/checkout.store';
import { formatAmount, getDateDifference } from '@/utils/utils';
import { Component, Host, State, h } from '@stencil/core';

@Component({
  tag: 'ir-booking-details',
  styleUrl: 'ir-booking-details.css',
  shadow: true,
})
export class IrBookingDetails {
  @State() currentRatePlan: RatePlan | null = null;

  private dialogRef: HTMLIrDialogElement;
  private firstRoom: { roomtypeId: string; ratePlanId: string };

  componentWillLoad() {
    const result: any = {};

    Object.keys(booking_store.ratePlanSelections).map(roomTypeId => {
      result[roomTypeId] = {};
      return Object.keys(booking_store.ratePlanSelections[roomTypeId]).map(ratePlanId => {
        const r: IRatePlanSelection = booking_store.ratePlanSelections[roomTypeId][ratePlanId];
        if (r.reserved === 0) {
          result[roomTypeId][ratePlanId] = r;
        } else {
          if (!this.firstRoom) {
            this.firstRoom = {
              roomtypeId: roomTypeId,
              ratePlanId,
            };
          }
          result[roomTypeId][ratePlanId] = {
            ...r,
            checkoutVariations: Array(r.reserved).fill(r.selected_variation),
            checkoutBedSelection: r.is_bed_configuration_enabled ? Array(r.reserved).fill(r.roomtype.bedding_setup[0].code) : [],
            checkoutSmokingSelection: Array(r.reserved).fill(r.roomtype.smoking_option[0]),
          };
          if (!checkout_store.modifiedGuestName && r.guestName?.length === 0) {
            const name = [...new Array(r.reserved)].map((_, i) => {
              if (i === 0 && !checkout_store.userFormData.bookingForSomeoneElse) {
                return (checkout_store.userFormData?.firstName || '') + ' ' + (checkout_store.userFormData?.lastName || '') ?? '';
              }
              return '';
            });
            result[roomTypeId][ratePlanId] = {
              ...result[roomTypeId][ratePlanId],
              guestName: name,
            };
          }
        }
      });
    });
    booking_store.ratePlanSelections = { ...result };
    onCheckoutDataChange('userFormData', newValue => {
      if (!newValue.bookingForSomeoneElse && !checkout_store.modifiedGuestName) {
        Object.keys(booking_store.ratePlanSelections).map(roomTypeId => {
          result[roomTypeId] = {};
          return Object.keys(booking_store.ratePlanSelections[roomTypeId]).map(ratePlanId => {
            const r: IRatePlanSelection = booking_store.ratePlanSelections[roomTypeId][ratePlanId];
            if (r.reserved === 0) {
              result[roomTypeId][ratePlanId] = r;
            } else {
              let oldGuestnames = [...r.guestName];
              oldGuestnames[0] = (newValue?.firstName || '') + ' ' + (newValue?.lastName || '') ?? '';
              result[roomTypeId][ratePlanId] = { ...r, guestName: oldGuestnames };
            }
          });
        });
        booking_store.ratePlanSelections = { ...result };
      }
    });
  }

  calculateTotalRooms() {
    return Object.values(booking_store.ratePlanSelections).reduce((total, value) => {
      return (
        total +
        Object.values(value).reduce((innerTotal, ratePlan) => {
          if (ratePlan.reserved === 0) {
            return innerTotal;
          }
          return innerTotal + ratePlan.reserved;
        }, 0)
      );
    }, 0);
  }
  handleGuestNameChange(index: number, e: InputEvent, rateplanId: number, roomTypeId: number): void {
    const oldVariations = [...booking_store.ratePlanSelections[roomTypeId][rateplanId]?.guestName];
    oldVariations[index] = (e.target as HTMLInputElement).value;
    booking_store.ratePlanSelections = {
      ...booking_store.ratePlanSelections,
      [roomTypeId]: {
        ...booking_store.ratePlanSelections[roomTypeId],
        [rateplanId]: {
          ...booking_store.ratePlanSelections[roomTypeId][rateplanId],
          guestName: oldVariations,
        },
      },
    };
  }
  handleVariationChange(index: number, e: CustomEvent, variations: Variation[], rateplanId: number, roomTypeId: number) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    const value = e.detail;
    const selectedVariation = variations.find(v => (v.adult_nbr + v.child_nbr).toString() === value);
    if (!selectedVariation) {
      return;
    }
    const oldVariations = [...booking_store.ratePlanSelections[roomTypeId][rateplanId]?.checkoutVariations];
    oldVariations[index] = selectedVariation;
    booking_store.ratePlanSelections = {
      ...booking_store.ratePlanSelections,
      [roomTypeId]: {
        ...booking_store.ratePlanSelections[roomTypeId],
        [rateplanId]: {
          ...booking_store.ratePlanSelections[roomTypeId][rateplanId],
          checkoutVariations: oldVariations,
        },
      },
    };
  }
  handleBedConfiguration(roomTypeId: string, rateplanId: string, detail: string | number, index: number): void {
    let oldBedConfiguration = [];
    if (booking_store.ratePlanSelections[roomTypeId][rateplanId]?.bed_configuration) {
      oldBedConfiguration = [...booking_store.ratePlanSelections[roomTypeId][rateplanId]?.checkoutBedSelection];
    }
    oldBedConfiguration[index] = detail;
    booking_store.ratePlanSelections = {
      ...booking_store.ratePlanSelections,
      [roomTypeId]: {
        ...booking_store.ratePlanSelections[roomTypeId],
        [rateplanId]: {
          ...booking_store.ratePlanSelections[roomTypeId][rateplanId],
          checkoutBedSelection: oldBedConfiguration,
        },
      },
    };
  }
  handleSmokeConfiguration(roomTypeId: string, rateplanId: string, detail: string | number, index: number): void {
    let oldSmokingConfiguration = [...booking_store.ratePlanSelections[roomTypeId][rateplanId]?.checkoutSmokingSelection];
    oldSmokingConfiguration[index] = detail;
    booking_store.ratePlanSelections = {
      ...booking_store.ratePlanSelections,
      [roomTypeId]: {
        ...booking_store.ratePlanSelections[roomTypeId],
        [rateplanId]: {
          ...booking_store.ratePlanSelections[roomTypeId][rateplanId],
          checkoutSmokingSelection: oldSmokingConfiguration,
        },
      },
    };
  }

  renderSmokingView(smoking_option: ISmokingOption, index: number, ratePlanId: string, roomTypeId: string, checkoutSmokingSelection: string[]) {
    if (smoking_option.code === '002') {
      return null;
    }
    if (smoking_option.code === '003') {
      return (
        <div class="flex items-center gap-1 text-xs">
          <ir-icons name={'ban_smoking'} svgClassName="size-4"></ir-icons>
          <p>{smoking_option.description}</p>
        </div>
      );
    }
    return (
      <ir-select
        icon
        onValueChange={e => this.handleSmokeConfiguration(roomTypeId, ratePlanId, e.detail, index)}
        value={checkoutSmokingSelection[index]}
        data={smoking_option.allowed_smoking_options.map(s => ({ id: s.code, value: s.description }))}
        class="hidden md:block"
      >
        <ir-icons name={checkoutSmokingSelection[index] !== '002' ? 'smoking' : 'ban_smoking'} slot="icon"></ir-icons>
      </ir-select>
    );
  }

  render() {
    const total_nights = getDateDifference(booking_store.bookingAvailabilityParams.from_date ?? new Date(), booking_store.bookingAvailabilityParams.to_date ?? new Date());
    const total_rooms = this.calculateTotalRooms();
    return (
      <Host>
        <div class="w-full">
          <section class="mb-5 flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2">
            <ir-icons name="bed"></ir-icons>
            <p>
              {total_nights} {total_nights > 1 ? 'nights' : 'night'} - {booking_store.bookingAvailabilityParams.adult_nbr}{' '}
              {booking_store.bookingAvailabilityParams.adult_nbr > 1 ? 'persons' : 'person'} - {total_rooms} {total_rooms > 1 ? 'rooms' : 'room'}
            </p>
          </section>
          <section class={'space-y-6'}>
            {Object.keys(booking_store.ratePlanSelections).map(roomTypeId => {
              return Object.keys(booking_store.ratePlanSelections[roomTypeId]).map(ratePlanId => {
                const r: IRatePlanSelection = booking_store.ratePlanSelections[roomTypeId][ratePlanId];
                if (r.reserved === 0) {
                  return null;
                }
                return [...new Array(r.reserved)].map((_, index) => {
                  return (
                    <div class="flex items-center justify-between">
                      <div class="flex-1 space-y-2">
                        <div>
                          <div class="flex items-center gap-3">
                            <div class="flex flex-row items-center gap-3">
                              <h3 class="font-semibold">{r.roomtype.name}</h3>
                              <div class={'hidden md:block'}>
                                <ir-button
                                  haveRightIcon
                                  variants="link"
                                  class="text-sm"
                                  buttonClassName="pl-0"
                                  buttonStyles={{ paddingLeft: '0', fontSize: '12px' }}
                                  onButtonClick={() => {
                                    this.currentRatePlan = r.ratePlan;
                                    this.dialogRef.openModal();
                                  }}
                                  label="View conditions"
                                >
                                  <ir-icons svgClassName="size-4" slot="right-icon" name="circle_info" />
                                </ir-button>
                              </div>
                            </div>
                            <div class="ml-1 flex-1 text-right">
                              <p class="text-base font-medium xl:text-xl">{formatAmount(r.checkoutVariations[index].amount, app_store.userPreferences.currency_id)}</p>
                            </div>
                          </div>
                          <div class={'flex items-center justify-between md:justify-end'}>
                            <div class={'md:hidden'}>
                              <ir-button
                                haveRightIcon
                                variants="link"
                                class="text-sm"
                                buttonClassName="pl-0"
                                buttonStyles={{ paddingLeft: '0', fontSize: '12px' }}
                                onButtonClick={() => {
                                  this.currentRatePlan = r.ratePlan;
                                  this.dialogRef.openModal();
                                }}
                                label="View conditions"
                              >
                                <ir-icons svgClassName="size-4" slot="right-icon" name="circle_info" />
                              </ir-button>
                            </div>
                            <p class="max-w-[60%] text-right text-xs text-gray-500 md:w-full md:max-w-full">{booking_store.tax_statement?.message}</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-2.5">
                          <ir-input
                            onInput={e => {
                              if (index === 0 && !checkout_store.modifiedGuestName && this.firstRoom.ratePlanId === ratePlanId && this.firstRoom.roomtypeId === roomTypeId) {
                                checkout_store.modifiedGuestName = true;
                              }
                              this.handleGuestNameChange(index, e, Number(ratePlanId), Number(roomTypeId));
                            }}
                            value={r.guestName[index]}
                            label="Guest full name"
                            leftIcon
                            class="w-full"
                            placeholder=""
                            maxlength={50}
                          >
                            <ir-icons name="user" slot="left-icon"></ir-icons>
                          </ir-input>
                          <ir-select
                            variant="double-line"
                            value={(r.checkoutVariations[index].adult_nbr + r.checkoutVariations[index].child_nbr).toString()}
                            label="Required capacity"
                            data={r.ratePlan?.variations?.map(v => ({
                              value: (v.adult_nbr + v.child_nbr).toString(),
                              id: v.adult_child_offering,
                            }))}
                            class="hidden w-full sm:block"
                            onValueChange={e => this.handleVariationChange(index, e, r.ratePlan.variations, Number(ratePlanId), Number(roomTypeId))}
                          ></ir-select>
                        </div>
                        <div class="flex items-center gap-4">
                          <div class="flex items-center gap-1 text-xs">
                            <ir-icons name="utencils" svgClassName="size-4"></ir-icons>
                            <span>{r.ratePlan.short_name}</span>
                          </div>

                          {this.renderSmokingView(r.roomtype.smoking_option, index, ratePlanId, roomTypeId, r.checkoutSmokingSelection)}

                          {r.is_bed_configuration_enabled && (
                            <ir-select
                              value={r.checkoutBedSelection[index]}
                              onValueChange={e => this.handleBedConfiguration(roomTypeId, ratePlanId, e.detail, index)}
                              data={r.roomtype.bedding_setup.map(b => ({ id: b.code, value: b.name }))}
                              icon
                            >
                              <ir-icons name={r.checkoutBedSelection[index] === 'kingsizebed' ? 'double_bed' : 'bed'} slot="icon"></ir-icons>
                            </ir-select>
                          )}
                        </div>
                      </div>
                      {/* <div class=" hidden text-right max-w-[25%] text-xs ml-1 xl:block">
                        <p class="font-medium text-xl">{formatAmount(r.checkoutVariations[index].amount, app_store.userPreferences.currency_id)}</p>
                        
                        <p class="text-gray-500 line-clamp-3">{booking_store.tax_statement?.message}</p>
                      </div> */}
                    </div>
                  );
                });
              });
            })}
          </section>
        </div>
        <ir-dialog
          ref={el => (this.dialogRef = el)}
          onOpenChange={e => {
            if (!e.detail) {
              this.currentRatePlan = null;
            }
          }}
        >
          <div slot="modal-body" class="p-4 md:p-6">
            <h3 class={'mb-4 text-xl font-medium'}>{this.currentRatePlan?.name} Conditions</h3>
            <p innerHTML={this.currentRatePlan?.cancelation}></p>
            <p innerHTML={this.currentRatePlan?.guarantee}></p>
          </div>
        </ir-dialog>
      </Host>
    );
  }
}
