import { Booking } from '@/models/booking.dto';
import { TEventType } from '@/models/igl-book-property';
import { BeddingSetup, ISmokingOption, RatePlan, RoomType, Variation } from '@/models/property';
import { createStore } from '@stencil/store';

export interface IRatePlanSelection {
  reserved: number;
  visibleInventory: number;
  selected_variation: Variation | null;
  ratePlan: RatePlan;
  guest: RatePlanGuest[] | null;
  guestName: string[];
  is_bed_configuration_enabled: boolean;
  checkoutVariations: Variation[];
  checkoutBedSelection: string[];
  is_amount_modified?: boolean;
  view_mode: '002' | '001';
  rp_amount: number;
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
    is_bed_configuration_enabled: boolean;
  };
}
export interface RatePlanGuest {
  name: string;
  unit: string | null;
  bed_preference: string | null;
  infant_nbr: number | null;
}

export interface IRoomTypeSelection {
  [ratePlanId: number]: IRatePlanSelection;
}
export interface ISelectedVariation {
  variation: Variation;
  state: 'default' | 'modified';
}
export interface IBookinAvailabilityParams {
  from_date: Date | null;
  to_date: Date | null;
  adult_nbr: number;
  child_nbr: number;
  infant_nbr: number;
  coupon?: string;
  agent?: number;
  loyalty?: boolean;
  agent_code?: string;
}
interface BookingStore {
  tax_statement: { message: string } | null;
  roomTypes: RoomType[];
  enableBooking: boolean;
  ratePlanSelections: { [roomTypeId: number]: IRoomTypeSelection };
  event_type: { type: TEventType };
  guest: RatePlanGuest;
  bookingAvailabilityParams: IBookinAvailabilityParams;
  booking: Booking;
  resetBooking: boolean;
  isInFreeCancelationZone: boolean;
  fictus_booking_nbr: { nbr: string | null };
}

const initialState: BookingStore = {
  guest: null,
  tax_statement: null,
  roomTypes: [],
  enableBooking: false,
  resetBooking: false,
  ratePlanSelections: {},
  isInFreeCancelationZone: false,
  bookingAvailabilityParams: {
    from_date: null,
    to_date: null,
    adult_nbr: 0,
    child_nbr: 0,
    infant_nbr: 0,
  },
  booking: null,
  fictus_booking_nbr: null,
  event_type: { type: 'PLUS_BOOKING' },
};

export let { state: booking_store, onChange: onRoomTypeChange, reset } = createStore<BookingStore>(initialState);
export function resetBookingStore() {
  reset();
}
function checkVariation(variations: Variation[], selected_variation: Variation): Variation {
  if (!variations) {
    return null;
  }
  if (!selected_variation || booking_store.resetBooking) {
    return variations[0];
  }
  return variations?.find(v => v.adult_nbr === selected_variation.adult_nbr && v.child_nbr === selected_variation.child_nbr) ?? null;
}

onRoomTypeChange('roomTypes', (newValue: RoomType[]) => {
  const currentSelections = booking_store.ratePlanSelections;
  const ratePlanSelections: { [roomTypeId: number]: IRoomTypeSelection } = {};
  newValue.forEach(roomType => {
    if (!roomType.is_active) return;
    ratePlanSelections[roomType.id] = ratePlanSelections[roomType.id] || {};

    roomType.rateplans.forEach(ratePlan => {
      if (!ratePlan.is_active || !ratePlan?.variations?.length) return;
      let lastVariation = ratePlan.variations[ratePlan.variations.length - 1];
      lastVariation = ratePlan.selected_variation ?? lastVariation;
      const currentRatePlanSelection = currentSelections[roomType.id]?.[ratePlan.id];
      ratePlanSelections[roomType.id][ratePlan.id] =
        currentRatePlanSelection && Object.keys(currentRatePlanSelection).length > 0
          ? {
              ...currentRatePlanSelection,
              ratePlan,
              selected_variation: checkVariation(ratePlan.variations, currentRatePlanSelection.selected_variation) ?? null,
              visibleInventory: roomType.inventory,
              reserved: roomType.inventory === 0 ? 0 : booking_store.resetBooking ? 0 : currentRatePlanSelection.reserved,
              checkoutVariations: roomType.inventory === 0 ? [] : currentRatePlanSelection.checkoutVariations,
              checkoutBedSelection: roomType.inventory === 0 ? [] : currentRatePlanSelection.checkoutBedSelection,
              checkoutSmokingSelection: roomType.inventory === 0 ? [] : currentRatePlanSelection.checkoutSmokingSelection,
              guestName: roomType.inventory === 0 ? [] : currentRatePlanSelection.guestName,
              roomtype: {
                ...currentRatePlanSelection.roomtype,
              },
            }
          : {
              reserved: 0,
              rp_amount: 0,
              view_mode: '001',
              guest: null,
              visibleInventory: roomType.inventory,
              selected_variation: ratePlan?.variations[0] ?? null,
              ratePlan,
              guestName: [],
              is_bed_configuration_enabled: roomType.is_bed_configuration_enabled,
              roomtype: {
                ...roomType,
                physicalrooms: null,
                rateplans: null,
                availabilities: null,
              },
              checkoutVariations: [],
              checkoutBedSelection: [],
              checkoutSmokingSelection: [],
            };
    });
  });
  booking_store.ratePlanSelections = ratePlanSelections;
  booking_store.resetBooking = false;
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
      const availableRooms = roomTypeData ? roomTypeData.inventory - totalSelectedRoomsExcludingCurrent : 0;

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
  console.log(ratePlanId, roomTypeId, params);
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
  console.log(booking_store.ratePlanSelections);
}

export function reserveRooms({ ratePlanId, roomTypeId, rooms, guest }: { roomTypeId: number; ratePlanId: number; rooms: number; guest?: RatePlanGuest[] }) {
  if (!booking_store.ratePlanSelections[roomTypeId]) {
    booking_store.ratePlanSelections[roomTypeId] = {};
  }
  const roomType = booking_store.roomTypes?.find(r => r.id === roomTypeId);
  if (!roomType) {
    throw new Error('Invalid room type id');
  }
  const ratePlan = roomType.rateplans.find(r => r.id === ratePlanId);
  if (!ratePlan) {
    throw new Error('Invalid rate plan');
  }
  let newGuest = Array.from({ length: rooms }, () => ({ name: '', unit: null, bed_preference: null, infant_nbr: null }));
  console.log('guest', guest);
  if (guest) {
    newGuest = guest;
  }
  console.log('newGuest', newGuest);
  if (!booking_store.ratePlanSelections[roomTypeId][ratePlanId]) {
    console.log('new guest', newGuest);
    booking_store.ratePlanSelections[roomTypeId][ratePlanId] = {
      guestName: null,
      reserved: 0,
      view_mode: '001',
      rp_amount: 0,
      guest: newGuest,
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
        is_bed_configuration_enabled: roomType.is_bed_configuration_enabled,
      },
    };
  }

  booking_store.ratePlanSelections = {
    ...booking_store.ratePlanSelections,
    [Number(roomTypeId)]: {
      ...booking_store.ratePlanSelections[Number(roomTypeId)],
      [ratePlanId]: {
        ...booking_store.ratePlanSelections[roomTypeId][ratePlanId],
        reserved: rooms,
        checkoutVariations: [],
        guest: newGuest,
      },
    },
  };
  updateInventory(roomTypeId);
}

export function getVisibleInventory(roomTypeId: number, ratePlanId: number): IRatePlanSelection {
  if (!booking_store.ratePlanSelections || !booking_store.ratePlanSelections[roomTypeId]) {
    return {
      reserved: 0,
      guest: null,
      visibleInventory: 0,
      selected_variation: null,
      ratePlan: null,
      guestName: [],
      is_bed_configuration_enabled: false,
      checkoutVariations: [],
      checkoutBedSelection: [],
      checkoutSmokingSelection: [],
      rp_amount: 0,
      view_mode: '001',
      roomtype: null,
    };
  }
  return booking_store.ratePlanSelections[roomTypeId][ratePlanId];
}

export function modifyBookingStore(key: keyof BookingStore, value: any) {
  booking_store[key] = value;
}

export function calculateTotalCost(gross: boolean = false): { totalAmount: number; prePaymentAmount: number } {
  let prePaymentAmount = 0;
  let totalAmount = 0;
  const calculateCost = (ratePlan: IRatePlanSelection, isPrePayment: boolean = false) => {
    if (ratePlan.checkoutVariations.length > 0 && ratePlan.reserved > 0) {
      if (isPrePayment) {
        return ratePlan.reserved * ratePlan.ratePlan.pre_payment_amount || 0;
      }
      return ratePlan.checkoutVariations.reduce((sum, variation) => {
        return sum + Number(variation[gross ? 'discounted_gross_amount' : 'discounted_amount']);
      }, 0);
    } else if (ratePlan.reserved > 0) {
      const amount = isPrePayment ? ratePlan.ratePlan.pre_payment_amount ?? 0 : ratePlan.selected_variation[gross ? 'discounted_gross_amount' : 'discounted_amount'];
      return ratePlan.reserved * (amount ?? 0);
    }
    return 0;
  };
  Object.values(booking_store.ratePlanSelections).forEach(value => {
    Object.values(value).forEach(ratePlan => {
      totalAmount += calculateCost(ratePlan);
      prePaymentAmount += calculateCost(ratePlan, true);
    });
  });
  return { totalAmount, prePaymentAmount };
}

export function validateBooking() {
  return Object.values(booking_store.ratePlanSelections).every(roomTypeSelection =>
    Object.values(roomTypeSelection).every(ratePlan => ratePlan.guestName.every(name => name.trim() !== '')),
  );
}
export function calculateTotalRooms() {
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
export default booking_store;
