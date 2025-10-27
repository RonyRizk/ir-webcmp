import { Property } from '@/models/booking.dto';
import { CalendarDataDetails } from '@/models/calendarData';
import { createStore } from '@stencil/store';

type CalendarStore = CalendarDataDetails & {
  roomHistory: Record<string, boolean>;
  property: Property;
  housekeeping_enabled: boolean;
  checkin_enabled: boolean;
  checkin_checkout_hours: {
    hour: number;
    minute: number;
    offset: number;
  };
  colorsForegrounds: Record<string, { foreground: string; stripe: string; checkout: string }>;
};
const initialState: CalendarStore = {
  adultChildConstraints: {
    adult_max_nbr: 0,
    child_max_nbr: 0,
    child_max_age: 0,
  },
  cleaning_frequency: null,
  checkin_checkout_hours: null,
  allowedBookingSources: [],
  currency: undefined,
  property: null,
  colorsForegrounds: null,
  endingDate: 0,
  housekeeping_enabled: true, //TODO: revert to true
  formattedLegendData: undefined,
  is_vacation_rental: false,
  legendData: [],
  roomsInfo: [],
  startingDate: 0,
  language: '',
  toBeAssignedEvents: [],
  allowed_payment_methods: [],
  pickup_service: undefined,
  checkin_enabled: true, //TODO: revert to true
  max_nights: 0,
  is_frontdesk_enabled: false,
  taxes: [],
  id: null,
  name: '',
  token: '',
  tax_statement: '',
  country: undefined,
  is_pms_enabled: false,
  roomHistory: {},
  is_automatic_check_in_out: false,
};
export const { state: calendar_data, onChange: onCalendarDatesChange } = createStore<CalendarStore>(initialState);
export function isSingleUnit(id: number) {
  if (calendar_data.roomHistory[id]) {
    return calendar_data.roomHistory[id];
  }
  const roomtype = calendar_data.roomsInfo.find(r => r.id === id);
  if (!roomtype) {
    console.warn(`Room type not found for ID: ${id}`);
    return false;
  }
  const result = roomtype.physicalrooms?.length <= 1;
  calendar_data.roomHistory[id] = result;
  return result;
}
export default calendar_data;
