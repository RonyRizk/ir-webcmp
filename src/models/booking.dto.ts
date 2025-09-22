import { z, ZodError, ZodIssueCode } from 'zod';
import { IAllowedOptions, ICurrency, IPickupCurrency } from './calendarData';
import { TSourceOption } from './igl-book-property';
import { ICountry } from './IBooking';
import moment from 'moment';
import { IHouseKeepers } from './housekeeping';

interface IDType {
  code: string;
  description: string;
}

interface IDInfo {
  type: IDType;
  number: string;
}

export interface SharedPerson {
  address: null;
  alternative_email: null;
  cci: null;
  city: null;
  country: ICountry;
  country_id: string;
  country_phone_prefix: null;
  dob: string;
  email: null;
  first_name: string;
  full_name: string;
  id: number;
  id_info: IDInfo;
  is_main?: boolean;
  last_name: string;
  mobile: null;
  nbr_confirmed_bookings: number;
  notes: null;
  password: null;
  subscribe_to_news_letter: null;
}
// export const ZIdInfo = z.object({
//   type: z.object({
//     code: z.string().min(3),
//     description: z.string(),
//   }),
//   number: z.string().min(2),
// });
// export const ZSharedPerson = z.object({
//   id: z.number(),
//   full_name: z.string().min(2),
//   country_id: z.coerce.number().min(0),
//   dob: z.coerce.date().transform(date => moment(date).format('YYYY-MM-DD')),
//   id_info: ZIdInfo,
// });

/**
 * ZIdInfo schema:
 * - `type.code`: Validates a non-empty string must be at least 3 chars.
 *   If empty string or not provided, validation is skipped.
 * - `type.description`: Same pattern for description (but no min length).
 * - `number`: Validates if non-empty string it should be at least 2 chars.
 */
export const ZIdInfo = z.object({
  type: z.object({
    code: z
      .union([
        // If provided and non-empty, must have at least 3 chars
        z.string().min(3),
        // or it can be an empty string
        z.literal(''),
      ])
      .optional(), // or undefined
    description: z
      .union([
        // If provided and non-empty, no special min
        z.string(),
        // or it can be empty string
        z.literal(''),
      ])
      .optional(),
  }),
  number: z
    .union([
      // If provided and non-empty, must have at least 2 chars
      z.string().min(2),
      // or it can be empty string
      z.literal(''),
    ])
    .optional()
    .nullable(),
});

/**
 * ZSharedPerson schema:
 * - `id`: Optional numeric field.
 * - `full_name`: If provided and non-empty, must be at least 2 chars.
 * - `country_id`: If provided, coerced to number, must be >= 0.
 * - `dob`: If provided, coerced to Date and formatted. Otherwise skipped.
 * - `id_info`: The nested object above; can also be omitted entirely.
 */
export const ZSharedPerson = z.object({
  id: z.number().optional(),
  // full_name: z
  //   .union([
  //     z.string().min(2), // if provided and non-empty, must have min length 2
  //     z.literal(''), // or it can be empty string
  //   ])
  //   .optional(),
  first_name: z
    .union([
      z.string().min(2), // if provided and non-empty, must have min length 2
      z.literal(''), // or it can be empty string
    ])
    .optional(),
  // .nullable(),
  last_name: z
    .union([
      z.string().min(2), // if provided and non-empty, must have min length 2
      z.literal(''), // or it can be empty string
    ])
    .optional(),
  // .nullable(),
  country_id: z.coerce
    .number()
    .min(0) // if provided, must be >= 0
    .optional(),
  dob: z
    .string()
    .nullable()
    .optional()
    .refine(value => value === undefined || moment(value, 'DD/MM/YYYY', true).isValid() || value === '' || value === null, 'Invalid date format')
    .transform(value => {
      if (value === undefined || value === '' || value === null) return null;
      const isDDMMYYYY = moment(value, 'DD/MM/YYYY', true).isValid();
      return isDDMMYYYY ? null : moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD');
    }),
  id_info: ZIdInfo.optional(),
  is_main: z.boolean().default(false),
});

// export const ZSharedPersons = z.array(ZSharedPerson).superRefine((data, ctx) => {
//   for (const d of data) {
//     validateSharedPerson(d, ctx);
//   }
// });

export function validateSharedPerson(data: any) {
  ZSharedPerson.parse(data);
  const hasValue = (field: string | null | undefined): boolean => {
    return field !== null && field !== undefined && field.trim() !== '';
  };
  const ctx = [];
  if (data.is_main) {
    if (!hasValue(data.first_name)) {
      ctx.push({
        path: ['first_name'],
        code: ZodIssueCode.custom,
        message: 'First name is required for main guest',
      });
    }

    if (!hasValue(data.last_name)) {
      ctx.push({
        path: ['last_name'],
        code: ZodIssueCode.custom,
        message: 'Last name is required for main guest',
      });
    }
  }

  // For non-main guests: check if ANY field has data
  const hasAnyFieldData =
    hasValue(data.first_name) ||
    hasValue(data.last_name) ||
    hasValue(data.dob) ||
    (data.country_id !== null && data.country_id !== undefined && data.country_id > 0) ||
    hasValue(data.id_info?.number);

  // If any field has data, then first_name and last_name become required
  if (hasAnyFieldData) {
    if (!hasValue(data.first_name)) {
      ctx.push({
        path: ['first_name'],
        code: ZodIssueCode.custom,
        message: 'First name is required when other guest information is provided',
      });
    }

    if (!hasValue(data.last_name)) {
      ctx.push({
        path: ['last_name'],
        code: ZodIssueCode.custom,
        message: 'Last name is required when other guest information is provided',
      });
    }
  }
  if (ctx.length >= 1) {
    throw new ZodError(ctx);
  }
}
export interface HandleExposedRoomGuestsRequest {
  booking_nbr: string;
  identifier: string;
  guests: SharedPerson[];
}
export interface OtaGuarantee {
  card_number: string;
  card_type: string;
  cardholder_name: string;
  cvv: string;
  expiration_date: string;
  is_virtual: boolean;
  meta: Meta;
  token: string;
}

interface Meta {
  virtual_card_currency_code: string;
  virtual_card_current_balance: string;
  virtual_card_decimal_places: string;
  virtual_card_effective_date: string;
  virtual_card_expiration_date: string;
}
export interface OtaService {
  name: string;
  nights: number;
  persons: number;
  price_mode: string;
  price_per_unit: number;
  total_price: number;
}
export interface ExposedBookingEvent {
  date: string;
  hour: number;
  id: number;
  minute: number;
  second: number;
  user: string;
  type: string;
}

export type OTAManipulations = {
  user: string;
  date: string;
  hour: string;
  minute: string;
};

export type BypassedOtaRevisions = {
  revision_nbr: number;
  date: string;
  revision_type: string;
};
export interface Booking {
  agent: {
    code: string;
    id: number;
    name: string;
    verification_mode: null;
  } | null;
  events: ExposedBookingEvent[];
  ota_manipulations: OTAManipulations[];
  bypassed_ota_revisions: BypassedOtaRevisions[];
  ota_services: OtaService[];
  is_requested_to_cancel: boolean;
  arrival: Arrival;
  allowed_actions: IAllowedActions[];
  system_id: number;
  booked_on: DateTime;
  booking_nbr: string;
  currency: Currency;
  extra_services: ExtraService[] | null;
  from_date: string;
  guest: Guest;
  extras: Extras[] | null;
  occupancy: Occupancy;
  origin: Origin;
  ota_guarante: OtaGuarantee;
  property: Property;
  remark: string;
  ota_notes: IOtaNotes[];
  rooms: Room[];
  source: Source;
  status: Status;
  to_date: string;
  total: number;
  is_editable: boolean;
  format: IFormat;
  channel_booking_nbr: string | null;
  is_direct: boolean;
  financial: IFinancial;
  pickup_info: IBookingPickupInfo | null;
  cost: number | null;
  is_pms_enabled: boolean;
  promo_key: string | null;
  is_in_loyalty_mode: boolean;
}

export const ExtraServiceSchema = z.object({
  booking_system_id: z.number().optional(),
  cost: z.coerce.number().nullable(),
  currency_id: z.number().min(1),
  description: z.string().min(1),
  end_date: z.string().nullable(),
  price: z.coerce.number(),
  start_date: z.string().nullable(),
  system_id: z.number().optional(),
});

export type ExtraService = z.infer<typeof ExtraServiceSchema>;
export interface Extras {
  key: string;
  value: any;
}
export interface IOtaNotes {
  statement: string;
}
export interface IBookingPickupInfo {
  currency: IPickupCurrency;
  date: string;
  details: string;
  hour: number;
  minute: number;
  nbr_of_units: number;
  selected_option: IAllowedOptions;
  total: number;
}
export interface IAllowedActions {
  code: string;
  description: string;
}
export interface IFinancial {
  cancelation_penality_as_if_today: number;
  due_amount: number;
  due_dates: IDueDate[];
  payments: IPayment[] | null;
  total_amount: number;
  collected: number;
  gross_total: number;
  gross_cost: number;
  invoice_nbr: string;
  gross_total_with_extras: number;
}
export interface IPayment {
  id: number | null;
  date: string;
  amount: number;
  currency: ICurrency;
  designation: string;
  reference: string;
  book_nbr?: string;
  payment_gateway_code?: number;
  payment_type?: PaymentType;
  payment_method?: PaymentType;
  time_stamp: {
    date: string;
    hour: number;
    minute: number;
    second: number;
    user: string;
  };
}

interface PaymentType {
  code: string;
  description: string;
  operation: string;
}

export interface IDueDate {
  amount: number;
  currencysymbol: string;
  date: string;
  description: string;
  room: string;
}
export interface IFormat {
  from_date: string;
  to_date: string;
}
export interface Arrival {
  code: string;
  description: string;
}

export interface DateTime {
  date: string;
  hour: number;
  minute: number;
}

export interface Currency {
  code: string;
  id: number;
  symbol: string;
}

export interface Guest {
  address: string | null;
  city: string | null;
  country_id: number | null;
  dob: string | null;
  email: string | null;
  first_name: string;
  id: number;
  last_name: string | null;
  mobile: string | null;
  country_phone_prefix: string | null;
  subscribe_to_news_letter: boolean | null;
  cci?: ICCI | null;
  alternative_email?: string;
  nbr_confirmed_bookings: number;
  notes: string;
  mobile_without_prefix: string;
}
export interface ICCI {
  nbr: string | number;
  holder_name: string | number;
  expiry_month: string | number;
  expiry_year: string | number;
  cvc?: string | null;
}
export interface Occupancy {
  adult_nbr: number;
  children_nbr: number;
  infant_nbr: number | null;
}
export interface DoReservationProps {
  assign_units: boolean;
  check_in: boolean;
  is_pms: boolean;
  is_direct: boolean;
  is_in_loyalty_mode: boolean;
  promo_key: string | null;
  extras: any; // Assuming extras can have any structure, replace with a specific type if known
  booking: {
    from_date: string; // Format 'YYYY-MM-DD'
    to_date: string; // Format 'YYYY-MM-DD'
    remark: string | null;
    booking_nbr: string;
    property: {
      id: string | number;
    };
    booked_on: {
      date: string; // Format 'YYYY-MM-DD'
      hour: number;
      minute: number;
    };
    source: TSourceOption;
    rooms: Room[]; // Assuming rooms are defined in the imported `Room` type
    currency: string;
    arrival: {
      code: string;
    };
    guest: {
      email: string | null;
      first_name: string;
      last_name: string;
      country_id: string | number | null;
      city: string | null;
      mobile: string;
      phone_prefix: string | null;
      address: string;
      dob: string | null;
      subscribe_to_news_letter: boolean;
      cci: {
        nbr: string;
        holder_name: string;
        expiry_month: string;
        expiry_year: string;
      } | null;
    };
  };
  pickup_info: any | null; // Assuming it can be any structure, replace if specific type is available
}
export interface Origin {
  Icon: string;
  Label: string;
}

export interface Property {
  calendar_legends: null;
  currency: null;
  id: number;
  name: string;
  roomtypes: null;
}
export type DepartureTime = {
  code: string;
  description: string;
};
export interface ExposedApplicablePolicy {
  brackets: Bracket[];
  combined_statement: string;
  type: 'cancelation' | 'guarantee';
}

export interface Bracket {
  amount: number;
  amount_formatted: string;
  code: string;
  currency_id: number;
  due_on: string;
  due_on_formatted: null | string;
  gross_amount: number;
  gross_amount_formatted: string;
  statement: string;
}
export type RoomInOut = { code: '001' | '002' | '000'; description: string };
export interface Room {
  days: Day[];
  applicable_policies: ExposedApplicablePolicy[];
  from_date: string;
  guest: Guest;
  occupancy_default: number;
  notes: string | null;
  occupancy: Occupancy;
  physicalroom: null;
  in_out: RoomInOut | null;
  sharing_persons: SharedPerson[] | null;
  bed_preference: number | null;
  rateplan: RatePlan;
  roomtype: RoomType;
  departure_time: DepartureTime;
  to_date: string;
  total: number;
  smoking_option: string;
  identifier: string;
  unit: string | number | IUnit | null;
  ota_taxes: IOtaTax[];
  ota_meta: OtaMeta;

  cost: number | null;
  gross_cost: number;
  gross_total: number;
  guarantee: number;
  gross_guarantee: number;
}
interface OtaMeta {
  bed_preferences: string | null;
  meal_plan: string | null;
  parent_rate_plan_id: string | null;
  policies: string | null;
  smoking_preferences: string | null;
}
export interface IOtaTax {
  amount: number;
  currency: IOtaTaxCurrency;
  is_exlusive: boolean;
  name: string;
}
export interface IOtaTaxCurrency {
  code: string;
  id: number;
  symbol: string;
}
export interface IUnit {
  calendar_cell: null;
  id: 2;
  name: '402';
}
export interface Day {
  amount: number;
  date: string;
  cost: number | null;
}

export interface RatePlan {
  cancelation: string | null;
  guarantee: null;
  id: number;
  name: string;
  rate_restrictions: null;
  variations: null;
  selected_variation: IVariations;
  is_non_refundable: boolean;
  custom_text: string | null;
  is_active: boolean;
  short_name: string;
}
export interface IVariations {
  adult_child_offering: string;
  adult_nbr: number;
  amount: number | null;
  child_nbr: number;
}
export interface RoomType {
  availabilities: null;
  id: number;
  inventory: number;
  name: string;
  physicalrooms: PhysicalRoom[];
  rate: number;
  rateplans: null;
  is_active: boolean;
}
export type RoomHkStatus = '001' | '002' | '003' | '004';
export interface PhysicalRoom {
  calendar_cell: null;
  housekeeper: IHouseKeepers;
  id: number;
  is_active: boolean;
  name: string;
  hk_status: RoomHkStatus;
}

export interface Source {
  code: string | null;
  description: string;
  tag: string | null;
}

export interface Status {
  code: string;
  description: string;
}

export interface IPmsLog {
  is_acknowledged: boolean;
  is_sent: boolean;
  sent_date: string;
  sent_hour: number;
  sent_minute: number;
}
