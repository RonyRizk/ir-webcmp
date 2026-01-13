export interface MyACEXTSy {
  AC_EXT_SYS_ID: number;
  AC_ID: number;
  DESCRIPTION: string;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  EXT_SYS_ID: number;
  IS_ACTIVE: boolean;
  My_Ac: GetACByACID;
  My_Ext_sys: MyEXTSys;
  OWNER_ID: number;
}

export interface MyACCurrency {
  AC_CURRENCY_ID: number;
  AC_ID: number;
  CURRENCY_ID: number;
  DESCRIPTION: string;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  My_Ac: GetACByACID;
  My_Currency: MyCurrency;
  OWNER_ID: number;
  TO_USD_RATE: number;
}

export interface GetACByACID {
  AC_ID: number;
  AC_PAYMENT_OPTION_CODE: string;
  AC_TYPE_CODE: string;
  ADDRESS: string;
  ALLOWED_CHILD_NBR_CODE: string;
  AT_API: null;
  AT_APP: null;
  AT_BOOKING: string;
  AT_CHM: string;
  AT_GHS: null;
  AT_PICKUP: string;
  AT_PMS: null;
  AT_SOCIAL: string;
  AT_SPACE: string;
  B2B_COMMISSION: number;
  B2B_RATE_CODE: string;
  B2C_COMMISSION: number;
  B2C_SELLING_RATE_DISCOUNT: number;
  BABYCOT_CODE: string;
  BABY_COT_RATE_PER_NIGHT: number;
  BOOKING_CONDITIONS: string;
  BOOKING_CUTOFF_TIME: string;
  BTN_BORDER_RADIUS: string;
  BUTTON_BG_COLOR: string;
  CALENDAR_EXTRA: string;
  CANC_HI_BEFORE_DAYS: number | null;
  CANC_HI_BEFORE_PENALITY_CODE: string;
  CANC_HI_LATER_PENALITY_CODE: string;
  CANC_HI_NOFEEDAYS: number;
  CANC_LOW_BEFORE_DAYS: number;
  CANC_LOW_BEFORE_PENALITY_CODE: string;
  CANC_LOW_LATER_PENALITY_CODE: string;
  CANC_LOW_NOFEEDAYS: number;
  CHECKIN_TIME_FROM: string;
  CHECKIN_TIME_TILL: string;
  CHECKOUT_TIME_TILL: string;
  CITY_ID: number;
  CITY_TAX_INCLUDED_CODE: string;
  CITY_TAX_PCT: number;
  CLEANING_FREQUENCY_CODE: string;
  CMP_ADDRESS: string;
  CMP_CITY: string;
  CMP_COUNTRY_ID: number;
  CMP_PHONE: string;
  CMP_POSTAL: string;
  CONVERSION_TAG: string;
  COUNTRY_ID: number;
  COUNTRY_MP_ID: number;
  CRN_PREFIX: string;
  CRN_START_NBR: number;
  CURRENCY_ID: number;
  CUSTOM_CSS: string;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  FAX: string;
  FOOD_ARRANGEMENT_ID: number;
  GUEST_PARKING_CODE: string;
  GUEST_PARKING_PRICE: number;
  GUEST_PARKING_SCHEDULE_CODE: string;
  HB_DEFINITION_CODE: string;
  HEADING_BG_COLOR: string;
  HEADING_FONT_COLOR: string;
  HOTEL_CHAIN_ID: number | null;
  HWS_BG_IMAGE_PATH: string;
  HWS_BODY_TAG: string;
  HWS_FOOTER_TAG: string;
  HWS_HEADER_TAG: string;
  HWS_TEMPLATE_CODE: string;
  HWS_URL: string;
  INTERNAL_REMARKS: string;
  INTERNET_PUBLIC_CODE: string;
  INTERNET_ROOM_CODE: string;
  INTERNET_ROOM_RATE_24_HOUR: number;
  INTERNET_ROOM_RATE_HOUR: number;
  INVOICING_MODE_CODE: null;
  INV_FOOTER_NOTES: string;
  INV_PREFIX: string;
  INV_START_NBR: number;
  IS_ACTIVE: boolean;
  IS_API_ENABLED: boolean;
  IS_APP_ENABLED: boolean;
  IS_AUTOMATIC_IN_OUT: boolean;
  IS_CHM_ACTIVE: boolean;
  IS_CHM_ENABLED: boolean;
  IS_EXPORT_TO_CSV: boolean;
  IS_GHS: boolean;
  IS_HK_ENABLED: boolean;
  IS_INFANT_ALLOWED: boolean;
  IS_INTERNET_PUBLIC_FREE: boolean;
  IS_INTERNET_ROOM_FREE: boolean;
  IS_MPO_MANAGED: boolean;
  IS_MPO_USED: boolean;
  IS_MULTI_PROP: boolean;
  IS_NO_PICKUP_FOR_SAME_DAY: boolean;
  IS_PAY_OPT_COMBINED: boolean;
  IS_PICKUP_ENABLED: boolean;
  IS_PMS_ENABLED: boolean;
  IS_PROMO_POPUP_ENABLED: boolean;
  IS_SOCIAL_ENABLED: boolean;
  IS_SOFT_DELETED: boolean;
  IS_SPACE_ENABLED: boolean;
  IS_UPON_REQUEST: boolean;
  LAST_HEALTH_CHECK_DATE: Date;
  LATITUDE: number;
  LOGO_PATH: string;
  LONGITUDE: number;
  MAX_NIGHTS: number;
  MAX_RATE: number;
  MIN_RATE: number;
  My_Ac_Extras: MyACExtra[] | null;
  My_Ac_allowed_language: MyACAllowedLanguage[] | null;
  My_Ac_amenity: null;
  My_Ac_card: null;
  My_Ac_contact: null;
  My_Ac_currencies: MyACCurrency[] | null;
  My_Ac_description: null;
  My_Ac_ext_sys: MyACEXTSy[] | null;
  My_Ac_gw: null;
  My_Ac_hws_info: null;
  My_Ac_hws_pg_category: null;
  My_Ac_hws_promo: null;
  My_Ac_hws_xpage: null;
  My_Ac_image: null;
  My_Ac_pickup: null;
  My_Ac_slide: null;
  My_Ac_social: null;
  My_Ac_theme: null;
  My_Adult_Age_Hint: null;
  My_Adult_Allowed_Nbr: null;
  My_Allowed_Currencies: null;
  My_Allowed_Languages: null;
  My_Bh: null;
  My_Bh_Policies: null;
  My_Booking_Url: null;
  My_Child_Age_Hint: null;
  My_Child_Allowed_Nbr: null;
  My_City: MyCity | null;
  My_Cmp_country: MyCCountry | null;
  My_Countries: null;
  My_Country: MyCCountry | null;
  My_Country_mp: MyCountryMp | null;
  My_Currency: MyCurrency | null;
  My_Custom_Exchange_Rate_toUSD: number | null;
  My_Distance_From: null;
  My_Food_arrangement: MyFoodArrangement | null;
  My_Ftx_Balance: null;
  My_Ftx_Nearest_Due: null;
  My_Ftx_Nearest_Expiry: null;
  My_Has_Travel_Agencies: boolean;
  My_Hotel_chain: MyHotelChain | null;
  My_Is_Promo_Key_Required: boolean;
  My_Is_Under_Loyalty: boolean;
  My_Last_Booking_Info: null;
  My_Linked_Acs: any[] | null;
  My_List_Ftx: null;
  My_Logo_URL: null;
  My_Lowest_Price: null;
  My_Missing_ac_trans: null;
  My_Mpo: MyMpo | null;
  My_Originated_Country: null;
  My_Para_Availabilities: null;
  My_Pois: MyPois | null;
  My_Possible_Booking_Sources: null;
  My_Random_Ac_image: null;
  My_Room_category: null;
  My_Salted_USER_ID: null;
  My_Setup_Entries: null;
  My_Travel_agencies: null;
  My_User: MyUser | null;
  NAME: string;
  NOTIFICATION_EMAIL_02: string;
  NOTIFICATION_MOBILE_01: string;
  NOTIFICATION_MOBILE_02: string;
  OFFER_TO_UPSELL: boolean;
  OWNER_ID: number;
  PERMA_LINK: string;
  PETS_ALLOWED_CODE: string;
  PHONE: string;
  PICKUP_CANCELATION_PREPAYMENT_CODE: string;
  PICKUP_INSTRUCTION_CODE: string;
  POIS_ID: number;
  POOL: null;
  POSTAL: null;
  PREPAYMENT_HI_CODE: string;
  PREPAYMENT_LOW_CODE: string;
  PRICE_AIPC: number;
  PRICE_AIPC_ADDI: number;
  PRICE_AIPP: number;
  PRICE_BREAKFAST_PC: number;
  PRICE_BREAKFAST_PC_ADDI: number;
  PRICE_BREAKFAST_PP: number;
  PRICE_FBPC: number;
  PRICE_FBPC_ADDI: number;
  PRICE_FBPP: number;
  PRICE_HBPC: number;
  PRICE_HBPC_ADDI: number;
  PRICE_HBPP: number;
  PROMO_POPUP_IMG_PATH: string;
  REGISTERED_NAME: string;
  SERVICE_CHARGE_INCLUDED_CODE: string;
  SERVICE_CHARGE_PCT: number;
  SORT_ORDER: number;
  STAR_RATE_CODE: null;
  TAX_NBR: string;
  UNITS_NBR: number;
  USER_ID: number;
  VAT_INCLUDED_CODE: string;
  VAT_PC: number;
}

export interface MyEXTSys {
  DESCRIPTION: string;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  EXT_SYS_ID: number;
  EXT_SYS_TYPE_CODE: string;
  IS_ACTIVE: boolean;
  KEYS: string;
  NAME: string;
  OWNER_ID: number;
}

export interface MyCurrency {
  CURRENCY_ID: number;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  OWNER_ID: number;
  REF: string;
  SYMBOL: string;
  TO_USD_RATE: number;
}

export interface MyACExtra {
  AC_EXTRA_ID: number;
  AC_ID: number;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  EXTRA_KEY: string;
  EXTRA_VALUE: string;
  My_Ac: null;
  My_Ac_extra_translation: MyACExtraTranslation[];
  OWNER_ID: number;
}

export interface MyACExtraTranslation {
  AC_EXTRA_ID: number;
  AC_EXTRA_TRANSLATION_ID: number;
  DESCRIPTION: string;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  LANGUAGE_ID: number;
  My_Ac_extra: null;
  My_Language: null;
  OWNER_ID: number;
}

export interface MyACAllowedLanguage {
  AC_ALLOWED_LANGUAGE_ID: number;
  AC_ID: number;
  DESCRIPTION: string;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  LANGUAGE_ID: number;
  My_Ac: null;
  My_Language: null;
  OWNER_ID: number;
}

export interface MyCity {
  CITY_ID: number;
  COUNTRY_ID: number;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  GMT_OFFSET_CODE: string;
  LAT: number;
  LEVEL_ONE_ID: number;
  LON: number;
  My_City_translation: null;
  My_Country: null;
  My_Level_one: null;
  NOTE: string;
  OWNER_ID: number;
  PERMA_LINK: string;
  SORT_ORDER: number;
}

export interface MyCCountry {
  ABBREVIATION: string;
  COUNTRY_ID: number;
  CURRENCY_ID: number;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  GMT_OFFSET_CODE: string;
  L1_NAME_REF: string;
  L2_NAME_REF: string;
  L3_NAME_REF: string;
  My_Country_translation: null;
  My_Currency: null;
  OWNER_ID: number;
  PHONE_PREFIX: string;
  REF: string;
}

export interface MyCountryMp {
  COUNTRY_ID: number;
  COUNTRY_MP_ID: number;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  MARKET_PLACE: string;
  My_Country: null;
  OWNER_ID: number;
}

export interface MyFoodArrangement {
  CODE: string;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  FOOD_ARRANGEMENT_ID: number;
  FOOD_ARRANGE_CAT_CODE: string;
  My_Food_translation: null;
  OWNER_ID: number;
}

export interface MyHotelChain {
  CODE: null;
  DESCRIPTION: null;
  ENTRY_DATE: null;
  ENTRY_USER_ID: number;
  HOTEL_CHAIN_ID: number;
  OWNER_ID: number;
  PHOTO_PATH: null;
}

export interface MyMpo {
  ADDRESS: string;
  BG_IMG: null;
  BILLING_CURRENCY_ID: number;
  BOOKING_NAME: string;
  BOOKING_NOTIFY_EMAIL: string;
  BOOKING_NOTIFY_MOBILE: string;
  CITY: string;
  COMPANY_NAME: string;
  COUNTRY_ID: number;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  FAV_ICON: null;
  FAX: string;
  FOOTER_CONFIRMATION_TEXT: string;
  GW_CHARGE: number;
  IS_COMBINED_VIEW: boolean;
  IS_EMAIL_NOTIFICATION: boolean;
  IS_SMTP_ACTIVE: boolean;
  LOGO: string;
  MPO_ID: number;
  MPO_TYPE_CODE: string;
  My_Billing_currency: MyCurrency;
  My_Country: MyCCountry;
  My_Mpo_gw: any[];
  My_Mpo_mp: null;
  My_User: MyUser;
  NAME: string;
  NOTES: string;
  OWNER_ID: number;
  PHONE: string;
  SMTP_HOST: null;
  SMTP_NOREPLY_EMAIL: null;
  SMTP_PASSWORD: null;
  SMTP_PORT: null;
  SMTP_USERNAME: null;
  STATE: string;
  USER_ID: number;
  VAT_NBR: string;
  VAT_PCT: number;
  WEBSITE: null;
  WL_URL: null;
}

export interface MyUser {
  CREATED_ON: Date;
  DISCLOSED_EMAIL: null;
  EMAIL: string;
  ENTRY_DATE: Date;
  ENVIRONMENT_USER_ID: null;
  FB_USER_TOKEN: string;
  GPLUS_USER_TOKEN: string;
  IS_ACTIVE: boolean;
  IS_EMAIL_VERIFIED: boolean;
  IS_MOBILE_VERIFIED: boolean;
  IS_SOFT_DELETED: boolean | null;
  LAST_SIGN_IN: Date | null;
  MOBILE: null | string;
  My_Owner: null;
  OWNER_ID: number;
  PASSWORD: string;
  PASSWORD_EXPIRY_DATE: Date;
  USERNAME: string;
  USER_ID: number;
  USER_TYPE_CODE: string;
}

export interface MyPois {
  CITY_ID: number;
  COUNTRY_ID: number;
  ENTRY_DATE: Date;
  ENTRY_USER_ID: number;
  IS_AREA: boolean;
  IS_FEATURED: boolean;
  IS_PICKUP_PORT: boolean;
  IS_STICKY: boolean;
  LAT: number;
  LON: number;
  My_City: null;
  My_Country: null;
  My_Distance_From: null;
  My_HasPoiImages: boolean;
  My_Pois_category: null;
  My_Pois_images: null;
  My_Pois_translation: null;
  NOTE: string;
  OWNER_ID: number;
  POIS_ID: number;
  STICKY_WITHIN: number;
  WEBSITE: string;
}
