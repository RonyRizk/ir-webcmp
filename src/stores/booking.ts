import { BeddingSetup, ISmokingOption, RatePlan, RoomType, Variation } from '@/models/property';
import { createStore } from '@stencil/store';

export interface IRatePlanSelection {
  reserved: number;
  visibleInventory: number;
  selected_variation: Variation;
  ratePlan: RatePlan;
  guestName: string[];
  is_bed_configuration_enabled: boolean;
  checkoutVariations: Variation[];
  checkoutBedSelection: string[];
  checkoutSmokingSelection: string[];
  roomtype: {
    id: number;
    name: string;
    physicalrooms: null;
    rateplans: null;
    availabilities: null;
    inventory: number;
    rate: number;
    smoking_option: ISmokingOption;
    bedding_setup: BeddingSetup[];
    pre_payment_amount: number;
  };
}

export interface IRoomTypeSelection {
  [ratePlanId: number]: IRatePlanSelection;
}
export interface IBookinAvailabilityParams {
  from_date: Date | null;
  to_date: Date | null;
  adult_nbr: number;
  child_nbr: number;
  coupon?: string;
  agent?: number;
  loyalty?: boolean;
}
interface BookingStore {
  tax_statement: { message: string } | null;
  roomTypes: RoomType[];
  enableBooking: boolean;
  ratePlanSelections: { [roomTypeId: number]: IRoomTypeSelection };
  bookingAvailabilityParams: IBookinAvailabilityParams;
}

const initialState: BookingStore = {
  tax_statement: null,
  roomTypes: undefined,
  enableBooking: false,
  ratePlanSelections: {},
  bookingAvailabilityParams: {
    from_date: null,
    to_date: null,
    adult_nbr: 0,
    child_nbr: 0,
  },
};

export const { state: booking_store, onChange: onRoomTypeChange } = createStore<BookingStore>(initialState);

onRoomTypeChange('roomTypes', (newValue: RoomType[]) => {
  const currentSelections = booking_store.ratePlanSelections;

  const ratePlanSelections: { [roomTypeId: number]: IRoomTypeSelection } = {};
  console.log(newValue);
  newValue.forEach(roomType => {
    if (roomType.is_active) {
      ratePlanSelections[roomType.id] = ratePlanSelections[roomType.id] || {};

      roomType.rateplans.forEach(ratePlan => {
        if (ratePlan.is_active && ratePlan.variations && ratePlan.variations.length > 0) {
          const currentRatePlanSelection = currentSelections[roomType.id] && currentSelections[roomType.id][ratePlan.id];
          ratePlanSelections[roomType.id][ratePlan.id] = currentRatePlanSelection
            ? {
                ...currentRatePlanSelection,
                ratePlan,
                visibleInventory: currentRatePlanSelection.visibleInventory,
                selected_variation: ratePlan.variations[ratePlan.variations.length - 1],
                guestName: currentRatePlanSelection.guestName,
                roomtype: {
                  id: roomType.id,
                  name: roomType.name,
                  physicalrooms: null,
                  rateplans: null,
                  availabilities: null,
                  inventory: roomType.inventory,
                  rate: roomType.rate,
                  smoking_option: roomType.smoking_option,
                  bedding_setup: roomType.bedding_setup,
                  pre_payment_amount: roomType.pre_payment_amount,
                },
              }
            : {
                reserved: 0,
                visibleInventory: roomType.inventory === 1 ? 2 : roomType.inventory,
                selected_variation: ratePlan.variations[ratePlan.variations.length - 1],
                ratePlan,
                guestName: [],

                is_bed_configuration_enabled: roomType.is_bed_configuration_enabled,
                roomtype: {
                  id: roomType.id,
                  name: roomType.name,
                  physicalrooms: null,
                  rateplans: null,
                  availabilities: null,
                  inventory: roomType.inventory,
                  rate: roomType.rate,
                  smoking_option: roomType.smoking_option,
                  bedding_setup: roomType.bedding_setup,
                  pre_payment_amount: roomType.pre_payment_amount,
                },
                checkoutVariations: [],
                checkoutBedSelection: [],
                checkoutSmokingSelection: [],
              };
        }
      });
    }
  });
  console.log(ratePlanSelections);
  booking_store.ratePlanSelections = ratePlanSelections;
});

export function updateInventory(roomTypeId: number) {
  const roomTypeSelection = booking_store.ratePlanSelections[roomTypeId];
  const calculateTotalSelectedRoomsExcludingIndex = (excludedRatePlanId: number) => {
    return Object.entries(roomTypeSelection).reduce((acc, [ratePlanId, ratePlan]) => {
      return Number(ratePlanId) !== excludedRatePlanId ? acc + ratePlan.reserved : acc;
    }, 0);
  };
  const newRatePlans = Object.fromEntries(
    Object.entries(roomTypeSelection).map(([ratePlanId, ratePlan]) => {
      const totalSelectedRoomsExcludingCurrent = calculateTotalSelectedRoomsExcludingIndex(Number(ratePlanId));
      const roomTypeData = booking_store.roomTypes.find(rt => rt.id === roomTypeId);
      const availableRooms = roomTypeData ? (roomTypeData.inventory === 1 ? 2 : roomTypeData.inventory) - totalSelectedRoomsExcludingCurrent : 0;

      return [
        ratePlanId,
        {
          ...ratePlan,
          visibleInventory: availableRooms > 0 ? availableRooms : 0,
        },
      ];
    }),
  );
  if (JSON.stringify(roomTypeSelection) !== JSON.stringify(newRatePlans)) {
    booking_store.ratePlanSelections = {
      ...booking_store.ratePlanSelections,
      [roomTypeId]: newRatePlans,
    };
  }
}
export function updateRoomParams({ ratePlanId, roomTypeId, params }: { roomTypeId: number; ratePlanId: number; params: Partial<IRatePlanSelection> }) {
  booking_store.ratePlanSelections = {
    ...booking_store.ratePlanSelections,
    [Number(roomTypeId)]: {
      ...booking_store.ratePlanSelections[Number(roomTypeId)],
      [ratePlanId]: {
        ...booking_store.ratePlanSelections[roomTypeId][ratePlanId],
        ...params,
      },
    },
  };
}

export function reserveRooms(roomTypeId: number, ratePlanId: number, rooms: number) {
  if (!booking_store.ratePlanSelections[roomTypeId]) {
    booking_store.ratePlanSelections[roomTypeId] = {};
  }
  const roomType = booking_store.roomTypes.find(r => r.id === roomTypeId);
  if (!roomType) {
    throw new Error('Invalid room type id');
  }
  const ratePlan = roomType.rateplans.find(r => r.id === ratePlanId);
  if (!ratePlan) {
    throw new Error('Invalid rate plan');
  }
  if (!booking_store.ratePlanSelections[roomTypeId][ratePlanId]) {
    booking_store.ratePlanSelections[roomTypeId][ratePlanId] = {
      guestName: null,
      reserved: 0,
      is_bed_configuration_enabled: roomType.is_bed_configuration_enabled,
      visibleInventory: 0,
      selected_variation: null,
      ratePlan,
      checkoutVariations: [],
      checkoutBedSelection: [],
      checkoutSmokingSelection: [],
      roomtype: {
        id: roomType.id,
        name: roomType.name,
        physicalrooms: null,
        rateplans: null,
        availabilities: null,
        inventory: roomType.inventory,
        rate: roomType.rate,
        bedding_setup: roomType.bedding_setup,
        smoking_option: roomType.smoking_option,
        pre_payment_amount: roomType.pre_payment_amount,
      },
    };
  }

  booking_store.ratePlanSelections = {
    ...booking_store.ratePlanSelections,
    [Number(roomTypeId)]: {
      ...booking_store.ratePlanSelections[Number(roomTypeId)],
      [ratePlanId]: { ...booking_store.ratePlanSelections[roomTypeId][ratePlanId], reserved: rooms },
    },
  };
  updateInventory(roomTypeId);
}

export function getVisibleInventory(roomTypeId: number, ratePlanId: number) {
  if (!booking_store.ratePlanSelections || !booking_store.ratePlanSelections[roomTypeId]) {
    return { reserved: 0, visibleInventory: 0, selected_variation: null };
  }
  return booking_store.ratePlanSelections[roomTypeId][ratePlanId];
}

export function modifyBookingStore(key: keyof BookingStore, value: any) {
  booking_store[key] = value;
}

export function calculateTotalCost(): { totalAmount: number; prePaymentAmount: number } {
  let prePaymentAmount = 0;
  let totalAmount = 0;
  totalAmount = Object.values(booking_store.ratePlanSelections).reduce((total, value) => {
    return (
      total +
      Object.values(value).reduce((innerTotal, ratePlan: IRatePlanSelection) => {
        let cost = 0;
        if (ratePlan.checkoutVariations.length > 0) {
          cost = ratePlan.checkoutVariations.reduce((old, v) => old + v.amount, 0);
        } else {
          cost = ratePlan.reserved > 0 ? ratePlan.reserved * (ratePlan.selected_variation.amount ?? 0) : 0;
        }
        return innerTotal + cost;
      }, 0)
    );
  }, 0);
  prePaymentAmount = Object.values(booking_store.ratePlanSelections).reduce((total, value) => {
    return (
      total +
      Object.values(value).reduce((innerTotal, ratePlan: IRatePlanSelection) => {
        let cost = 0;
        if (ratePlan.checkoutVariations.length > 0) {
          cost = ratePlan.checkoutVariations.reduce((old, v) => old + v.amount, 0);
        } else {
          cost = ratePlan.reserved > 0 ? ratePlan.reserved * (ratePlan.roomtype.pre_payment_amount ?? 0) : 0;
        }
        return innerTotal + cost;
      }, 0)
    );
  }, 0);
  return { totalAmount, prePaymentAmount };
}

export default booking_store;
