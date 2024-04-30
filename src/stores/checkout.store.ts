import { TPickupFormData } from '@/models/pickup';
import { TUserFormData } from '@/models/user_form';
import { createStore } from '@stencil/store';
import { format } from 'date-fns';

interface CheckoutStore {
  userFormData: TUserFormData;
  pickup: TPickupFormData;
  modifiedGuestName: boolean;
}

const initialState: CheckoutStore = {
  userFormData: {},
  modifiedGuestName: false,
  pickup: {
    arrival_date: format(new Date(), 'yyyy-MM-dd'),
  },
};

export const { state: checkout_store, onChange: onCheckoutDataChange } = createStore<CheckoutStore>(initialState);

export function updateUserFormData(key: keyof TUserFormData, value: any) {
  checkout_store.userFormData = {
    ...checkout_store.userFormData,
    [key]: value,
  };
}
export function updatePickupFormData(key: keyof TPickupFormData, value: any) {
  if (key === 'location' && value === null) {
    checkout_store.pickup = {
      arrival_date: format(new Date(), 'yyyy-MM-dd'),
      location: null,
    };
  } else {
    checkout_store.pickup = {
      ...checkout_store.pickup,
      [key]: value,
    };
  }
}
export function updatePartialPickupFormData(params: Partial<TPickupFormData>) {
  checkout_store.pickup = {
    ...checkout_store.pickup,
    ...params,
  };
}
