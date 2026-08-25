// import * as z from 'zod';

// /* ==========================================================================
//  * API primitives
//  *
//  * API DTOs are intentionally null-tolerant.
//  * ========================================================================== */

// export const ApiStringSchema = z.string().nullish();
// export const ApiNumberSchema = z.number().nullish();
// export const ApiBooleanSchema = z.boolean().nullish();
// export const ApiUnknownSchema = z.unknown().nullish();

// const nullableArray = <T extends z.ZodTypeAny>(schema: T) => z.array(schema).nullish();

// /* ==========================================================================
//  * Generic shared structures
//  * ========================================================================== */

// export const CodeDescriptionSchema = z
//   .object({
//     code: ApiStringSchema,
//     description: ApiStringSchema,
//   })
//   .passthrough();

// export type CodeDescription = z.infer<typeof CodeDescriptionSchema>;

// /* ==========================================================================
//  * Currency
//  * ========================================================================== */

// export const CurrencySchema = z
//   .object({
//     code: ApiStringSchema,
//     id: ApiNumberSchema,
//     symbol: ApiStringSchema,
//   })
//   .passthrough();

// export type Currency = z.infer<typeof CurrencySchema>;

// /* ==========================================================================
//  * Country
//  *
//  * Used by:
//  * - property
//  * - company
//  * - MPO
//  * - guest
//  * - additional guests
//  *
//  * The booking API may return an "empty" Country object, so all fields that
//  * have been observed as nullable remain nullable.
//  * ========================================================================== */

// export const CountrySchema = z
//   .object({
//     cities: ApiUnknownSchema,
//     code: ApiStringSchema,
//     currency: CurrencySchema.nullish(),
//     flag: ApiStringSchema,
//     gmt_offset: ApiNumberSchema,
//     id: ApiNumberSchema,
//     market_places: ApiUnknownSchema,
//     name: ApiStringSchema,
//     phone_prefix: ApiStringSchema,
//   })
//   .passthrough();

// export type Country = z.infer<typeof CountrySchema>;

// /* ==========================================================================
//  * Occupancy
//  *
//  * Replaces Occupancy + Occupancy2.
//  * ========================================================================== */

// export const OccupancySchema = z
//   .object({
//     adult_nbr: ApiNumberSchema,
//     children_nbr: ApiNumberSchema,
//     infant_nbr: ApiNumberSchema,
//   })
//   .passthrough();

// export type Occupancy = z.infer<typeof OccupancySchema>;

// /* ==========================================================================
//  * Language
//  * ========================================================================== */

// export const LanguageSchema = z
//   .object({
//     code: ApiStringSchema,
//     culture: ApiStringSchema,
//     description: ApiStringSchema,
//     direction: ApiStringSchema,
//     entries: ApiUnknownSchema,
//     flag: ApiStringSchema,
//     id: ApiNumberSchema,
//   })
//   .passthrough();

// export type Language = z.infer<typeof LanguageSchema>;

// /* ==========================================================================
//  * Amenities
//  * ========================================================================== */

// export const AmenitySchema = z
//   .object({
//     amenity_type: ApiStringSchema,
//     code: ApiStringSchema,
//     description: ApiStringSchema,
//   })
//   .passthrough();

// export type Amenity = z.infer<typeof AmenitySchema>;

// /* ==========================================================================
//  * Property basics
//  * ========================================================================== */

// export const AdultChildConstraintsSchema = z
//   .object({
//     adult_max_nbr: ApiNumberSchema,
//     child_max_age: ApiNumberSchema,
//     child_max_nbr: ApiNumberSchema,
//   })
//   .passthrough();

// export type AdultChildConstraints = z.infer<typeof AdultChildConstraintsSchema>;

// export const BabyCotOfferingSchema = z
//   .object({
//     rate_per_night: ApiNumberSchema,
//     title: ApiStringSchema,
//   })
//   .passthrough();

// export type BabyCotOffering = z.infer<typeof BabyCotOfferingSchema>;

// export const CalendarLegendSchema = z
//   .object({
//     color: ApiStringSchema,
//     design: ApiStringSchema,
//     id: ApiStringSchema,
//     name: ApiStringSchema,
//   })
//   .passthrough();

// export type CalendarLegend = z.infer<typeof CalendarLegendSchema>;

// export const CitySchema = z
//   .object({
//     gmt_offset: ApiNumberSchema,
//     id: ApiNumberSchema,
//     latitude: ApiNumberSchema,
//     longitude: ApiNumberSchema,
//     name: ApiStringSchema,
//   })
//   .passthrough();

// export type City = z.infer<typeof CitySchema>;

// export const ContactSchema = z
//   .object({
//     email: ApiStringSchema,
//     mobile: ApiStringSchema,
//     name: ApiStringSchema,
//     phone: ApiStringSchema,
//     type: ApiStringSchema,
//   })
//   .passthrough();

// export type Contact = z.infer<typeof ContactSchema>;

// export const PropertyDescriptionSchema = z
//   .object({
//     food_and_beverage: ApiStringSchema,
//     important_info: ApiStringSchema,
//     location_and_intro: ApiStringSchema,
//     non_standard_conditions: ApiStringSchema,
//     rooming: ApiStringSchema,
//   })
//   .passthrough();

// export type PropertyDescription = z.infer<typeof PropertyDescriptionSchema>;

// export const KeyValueSchema = z
//   .object({
//     key: ApiStringSchema,
//     value: ApiStringSchema,
//   })
//   .passthrough();

// export type KeyValue = z.infer<typeof KeyValueSchema>;

// export const GapRuleSchema = z
//   .object({
//     gap_lookahead_days: ApiNumberSchema,
//     type: CodeDescriptionSchema.nullish(),
//   })
//   .passthrough();

// export type GapRule = z.infer<typeof GapRuleSchema>;

// export const PropertyImageSchema = z
//   .object({
//     thumbnail: ApiStringSchema,

//     // Do not enum actual room/category names.
//     tooltip: ApiStringSchema,

//     url: ApiStringSchema,
//   })
//   .passthrough();

// export type PropertyImage = z.infer<typeof PropertyImageSchema>;

// export const InternetOfferingSchema = z
//   .object({
//     is_public_internet_free: ApiBooleanSchema,
//     is_room_internet_free: ApiBooleanSchema,
//     public_internet_statement: ApiStringSchema,
//     room_internet_statement: ApiStringSchema,
//     room_rate_per_24_hour: ApiNumberSchema,
//     room_rate_per_hour: ApiNumberSchema,
//   })
//   .passthrough();

// export type InternetOffering = z.infer<typeof InternetOfferingSchema>;

// /* ==========================================================================
//  * User / PMS integration
//  * ========================================================================== */

// export const IntegrationLastCallSchema = z
//   .object({
//     is_acknowledged: ApiBooleanSchema,
//     is_sent: ApiBooleanSchema,
//     revision_id: ApiNumberSchema,
//     sent_date: ApiStringSchema,
//     sent_hour: ApiNumberSchema,
//     sent_minute: ApiNumberSchema,
//   })
//   .passthrough();

// export type IntegrationLastCall = z.infer<typeof IntegrationLastCallSchema>;

// export const UserSchema = z
//   .object({
//     created_on: ApiStringSchema,
//     email: ApiStringSchema,
//     id: ApiNumberSchema,
//     is_active: ApiBooleanSchema,
//     is_email_verified: ApiBooleanSchema,
//     mobile: ApiStringSchema,
//     password: ApiStringSchema,
//     sign_ins: ApiUnknownSchema,
//     type: ApiNumberSchema,
//     username: ApiStringSchema,
//   })
//   .passthrough();

// export type User = z.infer<typeof UserSchema>;

// export const LocationSchema = z
//   .object({
//     latitude: ApiNumberSchema,
//     longitude: ApiNumberSchema,
//   })
//   .passthrough();

// export type Location = z.infer<typeof LocationSchema>;

// export const MarketPlaceSchema = z
//   .object({
//     country_id: ApiNumberSchema,
//     id: ApiNumberSchema,
//     name: ApiStringSchema,
//   })
//   .passthrough();

// export type MarketPlace = z.infer<typeof MarketPlaceSchema>;

// export const SmtpInfoSchema = z
//   .object({
//     host: ApiStringSchema,
//     is_active: ApiBooleanSchema,
//     no_reply_email: ApiStringSchema,
//     password: ApiStringSchema,
//     port: ApiNumberSchema,
//     username: ApiStringSchema,
//   })
//   .passthrough();

// export type SmtpInfo = z.infer<typeof SmtpInfoSchema>;

// /* ==========================================================================
//  * Property offerings
//  * ========================================================================== */

// export const ParkingOfferingSchema = z
//   .object({
//     pricing: ApiNumberSchema,
//     schedule: ApiStringSchema,
//     title: ApiStringSchema,
//   })
//   .passthrough();

// export type ParkingOffering = z.infer<typeof ParkingOfferingSchema>;

// export const PetsAcceptanceSchema = z
//   .object({
//     title: ApiStringSchema,
//   })
//   .passthrough();

// export type PetsAcceptance = z.infer<typeof PetsAcceptanceSchema>;

// export const PickupLocationSchema = z
//   .object({
//     description: ApiStringSchema,
//     id: ApiNumberSchema,
//   })
//   .passthrough();

// export type PickupLocation = z.infer<typeof PickupLocationSchema>;

// export const VehicleTypeSchema = z
//   .object({
//     capacity: ApiNumberSchema,
//     code: ApiStringSchema,
//     description: ApiStringSchema,
//   })
//   .passthrough();

// export type VehicleType = z.infer<typeof VehicleTypeSchema>;

// export const BeddingSetupSchema = z
//   .object({
//     code: ApiStringSchema,
//     count: ApiNumberSchema,
//     name: ApiStringSchema,
//   })
//   .passthrough();

// export type BeddingSetup = z.infer<typeof BeddingSetupSchema>;

// /* ==========================================================================
//  * Housekeeping
//  * ========================================================================== */

// export const HousekeeperSchema = z
//   .object({
//     assigned_units: ApiUnknownSchema,
//     id: ApiNumberSchema,
//     is_active: ApiBooleanSchema,
//     is_soft_deleted: ApiBooleanSchema,
//     mobile: ApiStringSchema,
//     name: ApiStringSchema,
//     note: ApiStringSchema,
//     password: ApiStringSchema,
//     phone_prefix: ApiStringSchema,
//     property_id: ApiNumberSchema,
//     username: ApiStringSchema,
//   })
//   .passthrough();

// export type Housekeeper = z.infer<typeof HousekeeperSchema>;

// /* ==========================================================================
//  * Physical Room
//  *
//  * IMPORTANT:
//  *
//  * This replaces:
//  *   Physicalroom
//  *   Unit
//  *
//  * Property API may return full housekeeping details.
//  * Booking API may return:
//  *   hk_status: null
//  *   housekeeper: null
//  *   is_active: null
//  *
//  * Same entity → one schema.
//  * ========================================================================== */

// export const PhysicalRoomSchema = z
//   .object({
//     calendar_cell: ApiUnknownSchema,
//     hk_status: ApiStringSchema,
//     housekeeper: HousekeeperSchema.nullish(),
//     id: ApiNumberSchema,
//     is_active: ApiBooleanSchema,
//     name: ApiStringSchema,
//   })
//   .passthrough();

// export type PhysicalRoom = z.infer<typeof PhysicalRoomSchema>;

// /* ==========================================================================
//  * Rate Plans
//  * ========================================================================== */

// export const RatePlanDerivationSchema = z
//   .object({
//     derivation_mode: CodeDescriptionSchema.nullish(),
//     derivation_value: ApiNumberSchema,
//     parent_rate_plan_id: ApiNumberSchema,
//     parent_rate_plan_name: ApiStringSchema,
//   })
//   .passthrough();

// export type RatePlanDerivation = z.infer<typeof RatePlanDerivationSchema>;

// export const MealPlanSchema = z
//   .object({
//     code: ApiStringSchema,

//     // Don't enum display names such as "Half board".
//     name: ApiStringSchema,
//   })
//   .passthrough();

// export type MealPlan = z.infer<typeof MealPlanSchema>;

// export const SmokingOptionSchema = z
//   .object({
//     allowed_smoking_options: nullableArray(CodeDescriptionSchema),
//     code: ApiStringSchema,
//     description: ApiStringSchema,
//   })
//   .passthrough();

// export type SmokingOption = z.infer<typeof SmokingOptionSchema>;

// /* ==========================================================================
//  * Agent
//  * ========================================================================== */

// export const AgentSchema = z
//   .object({
//     address: ApiStringSchema,

//     agent_rate_type_code: CodeDescriptionSchema.nullish(),
//     agent_type_code: CodeDescriptionSchema.nullish(),

//     city: ApiStringSchema,

//     cl_post_timing: CodeDescriptionSchema.nullish(),

//     code: ApiStringSchema,

//     contact_name: ApiStringSchema,
//     contract_nbr: ApiStringSchema,

//     country_id: ApiNumberSchema,
//     currency_id: ApiNumberSchema,

//     due_balance: ApiNumberSchema,

//     email: ApiStringSchema,
//     email_copied_upon_booking: ApiStringSchema,

//     has_opening_balance: ApiBooleanSchema,

//     id: ApiNumberSchema,

//     is_active: ApiBooleanSchema,
//     is_send_guest_confirmation_email: ApiBooleanSchema,

//     name: ApiStringSchema,
//     notes: ApiStringSchema,

//     payment_mode: CodeDescriptionSchema.nullish(),

//     phone: ApiStringSchema,

//     property_id: ApiNumberSchema,

//     provided_discount: ApiNumberSchema,

//     question: ApiStringSchema,
//     reference: ApiStringSchema,

//     sort_order: ApiNumberSchema,

//     tax_nbr: ApiStringSchema,
//     verification_mode: ApiStringSchema,
//   })
//   .passthrough();

// export type Agent = z.infer<typeof AgentSchema>;

// /* ==========================================================================
//  * Rate Plan Variation
//  *
//  * Property API may return null.
//  * Booking API may return an actual variation.
//  * ========================================================================== */

// export const RatePlanVariationSchema = z
//   .object({
//     IS_MLS_VIOLATED: ApiBooleanSchema,
//     MLS_ALERT: ApiUnknownSchema,
//     MLS_ALERT_VALUE: ApiUnknownSchema,

//     adult_child_offering: ApiStringSchema,

//     adult_nbr: ApiNumberSchema,
//     child_nbr: ApiNumberSchema,
//     infant_nbr: ApiNumberSchema,

//     amount: ApiNumberSchema,
//     amount_gross: ApiNumberSchema,

//     amount_per_night: ApiNumberSchema,
//     amount_per_night_gross: ApiNumberSchema,

//     applicable_policies: ApiUnknownSchema,

//     bed_preference_code: ApiStringSchema,

//     discount_pct: ApiNumberSchema,

//     discounted_amount: ApiNumberSchema,
//     discounted_gross_amount: ApiNumberSchema,

//     extra_bed_free_nbr: ApiNumberSchema,
//     extra_bed_nbr: ApiNumberSchema,
//     extra_bed_rate_per_night: ApiNumberSchema,

//     food_nbr_upsell: ApiNumberSchema,

//     is_lmd: ApiBooleanSchema,

//     nights: ApiUnknownSchema,
//     nights_nbr: ApiNumberSchema,

//     prepayment_amount: ApiNumberSchema,
//     prepayment_amount_gross: ApiNumberSchema,

//     rate_plan_id: ApiNumberSchema,

//     smoking_code: ApiStringSchema,

//     total_before_discount: ApiNumberSchema,
//   })
//   .passthrough();

// export type RatePlanVariation = z.infer<typeof RatePlanVariationSchema>;

// /* ==========================================================================
//  * Rate Plan
//  *
//  * ONE schema used by:
//  * - Property.roomtypes[].rateplans[]
//  * - Booking.rooms[].rateplan
//  *
//  * Fields are nullable where either API representation may return null.
//  * ========================================================================== */

// export const RatePlanSchema = z
//   .object({
//     agents: nullableArray(AgentSchema),

//     assignable_units: ApiUnknownSchema,

//     cancelation: ApiStringSchema,
//     custom_text: ApiStringSchema,

//     derivation_info: RatePlanDerivationSchema.nullish(),

//     extra_bed_for_code: ApiStringSchema,
//     extra_bed_max: ApiNumberSchema,

//     extra_bed_rate_per_night: ApiNumberSchema,

//     extra_bed_rate_per_night_additional_child: ApiNumberSchema,

//     extra_bed_rate_per_night_first_child: ApiNumberSchema,

//     guarantee: ApiStringSchema,

//     id: ApiNumberSchema,

//     is_active: ApiBooleanSchema,
//     is_available_to_book: ApiBooleanSchema,
//     is_booking_engine_enabled: ApiBooleanSchema,
//     is_channel_enabled: ApiBooleanSchema,
//     is_closed: ApiBooleanSchema,
//     is_derived: ApiBooleanSchema,
//     is_extra_bed_free_for_children: ApiBooleanSchema,
//     is_non_refundable: ApiBooleanSchema,
//     is_targeting_travel_agency: ApiBooleanSchema,

//     meal_plan: MealPlanSchema.nullish(),

//     name: ApiStringSchema,

//     not_available_reason: ApiUnknownSchema,

//     pre_payment_amount: ApiNumberSchema,
//     pre_payment_amount_gross: ApiNumberSchema,

//     rate_restrictions: ApiUnknownSchema,

//     selected_variation: RatePlanVariationSchema.nullish(),

//     sell_mode: CodeDescriptionSchema.nullish(),

//     short_name: ApiStringSchema,

//     sleeps: ApiNumberSchema,

//     spp_settings: ApiUnknownSchema,

//     variations: ApiUnknownSchema,
//   })
//   .passthrough();

// export type RatePlan = z.infer<typeof RatePlanSchema>;

// /* ==========================================================================
//  * Room Type
//  *
//  * ONE schema used by:
//  * - Property.roomtypes[]
//  * - Booking.rooms[].roomtype
//  *
//  * The booking endpoint returns a lightweight RoomType where many fields
//  * are null. The property endpoint returns the complete entity.
//  * ========================================================================== */

// export const RoomTypeSchema = z
//   .object({
//     amenities: nullableArray(AmenitySchema),

//     availabilities: ApiUnknownSchema,

//     bedding_setup: nullableArray(BeddingSetupSchema),

//     description: ApiStringSchema,

//     exposed_inventory: ApiUnknownSchema,

//     id: ApiNumberSchema,

//     images: nullableArray(PropertyImageSchema),

//     inventory: ApiUnknownSchema,

//     is_active: ApiBooleanSchema,
//     is_available_to_book: ApiBooleanSchema,
//     is_bed_configuration_enabled: ApiBooleanSchema,
//     is_channel_enabled: ApiBooleanSchema,

//     main_image: PropertyImageSchema.nullish(),

//     // Do not enum real category names.
//     name: ApiStringSchema,

//     not_available_reason: ApiUnknownSchema,

//     occupancy_default: OccupancySchema.nullish(),
//     occupancy_max: OccupancySchema.nullish(),

//     physicalrooms: nullableArray(PhysicalRoomSchema),

//     rate: ApiUnknownSchema,

//     rateplans: nullableArray(RatePlanSchema),

//     size: ApiNumberSchema,

//     smoking_option: SmokingOptionSchema.nullish(),
//   })
//   .passthrough();

// export type RoomType = z.infer<typeof RoomTypeSchema>;

// /* ==========================================================================
//  * Company
//  * ========================================================================== */

// export const CompanySchema = z
//   .object({
//     address: ApiStringSchema,
//     city: ApiStringSchema,

//     country: CountrySchema.nullish(),

//     credit_note_prefix: ApiStringSchema,
//     credit_note_start_nbr: ApiNumberSchema,

//     credit_receipt_prefix: ApiStringSchema,
//     credit_receipt_start_nbr: ApiNumberSchema,

//     debit_note_prefix: ApiStringSchema,
//     debit_note_start_nbr: ApiNumberSchema,

//     invoice_footer_notes: ApiStringSchema,
//     invoice_prefix: ApiStringSchema,
//     invoice_start_nbr: ApiNumberSchema,

//     name: ApiStringSchema,
//     phone: ApiStringSchema,
//     postal: ApiStringSchema,

//     receipt_prefix: ApiStringSchema,
//     receipt_start_nbr: ApiNumberSchema,

//     tax_nbr: ApiStringSchema,
//   })
//   .passthrough();

// export type Company = z.infer<typeof CompanySchema>;

// /* ==========================================================================
//  * Linked PMS
//  * ========================================================================== */

// export const LinkedPmsSchema = z
//   .object({
//     ari_integration_mode: CodeDescriptionSchema.nullish(),

//     ari_last_call: IntegrationLastCallSchema.nullish(),

//     booking_last_call: IntegrationLastCallSchema.nullish(),

//     bookings_integration_mode: CodeDescriptionSchema.nullish(),

//     code: ApiStringSchema,
//     description: ApiStringSchema,

//     id: ApiNumberSchema,

//     is_active: ApiBooleanSchema,
//     is_read_only: ApiBooleanSchema,

//     mapping_mode: CodeDescriptionSchema.nullish(),
//     partner: CodeDescriptionSchema.nullish(),

//     property_id: ApiNumberSchema,

//     request_count: ApiNumberSchema,

//     revisions_count_per_request: ApiNumberSchema,

//     user: UserSchema.nullish(),
//   })
//   .passthrough();

// export type LinkedPms = z.infer<typeof LinkedPmsSchema>;

// /* ==========================================================================
//  * MPO
//  * ========================================================================== */

// export const MpoSchema = z
//   .object({
//     address: ApiStringSchema,

//     affiliates: nullableArray(z.unknown()),

//     bg_img_url: ApiStringSchema,

//     biling_currency: CurrencySchema.nullish(),

//     booking_name: ApiStringSchema,
//     booking_notify_email: ApiStringSchema,
//     booking_notify_mobile: ApiStringSchema,

//     city: ApiStringSchema,

//     company_name: ApiStringSchema,

//     country: CountrySchema.nullish(),

//     fav_icon: ApiStringSchema,
//     fax: ApiStringSchema,

//     footer_confirmation_text: ApiStringSchema,

//     id: ApiNumberSchema,

//     is_email_notification: ApiBooleanSchema,

//     logo_url: ApiStringSchema,

//     market_places: nullableArray(MarketPlaceSchema),

//     name: ApiStringSchema,
//     notes: ApiStringSchema,
//     phone: ApiStringSchema,

//     smtp_info: SmtpInfoSchema.nullish(),

//     state: ApiStringSchema,

//     user: UserSchema.nullish(),

//     vat_nbr: ApiStringSchema,
//     vat_pct: ApiNumberSchema,

//     website: ApiStringSchema,
//     wl_url: ApiStringSchema,
//   })
//   .passthrough();

// export type Mpo = z.infer<typeof MpoSchema>;

// /* ==========================================================================
//  * Payment methods
//  * ========================================================================== */

// export const LocalizableSchema = z
//   .object({
//     code: ApiStringSchema,
//     description: ApiStringSchema,
//     id: ApiNumberSchema,
//     language: LanguageSchema.nullish(),
//   })
//   .passthrough();

// export type Localizable = z.infer<typeof LocalizableSchema>;

// export const AllowedPaymentMethodSchema = z
//   .object({
//     affiliate_id: ApiNumberSchema,

//     allowed_currencies: ApiStringSchema,

//     code: ApiStringSchema,

//     data: ApiUnknownSchema,

//     description: ApiStringSchema,

//     display_order: ApiNumberSchema,

//     id: ApiNumberSchema,

//     img_url: ApiStringSchema,

//     is_active: ApiBooleanSchema,
//     is_payment_gateway: ApiBooleanSchema,

//     localizables: nullableArray(LocalizableSchema),

//     mpo_id: ApiNumberSchema,

//     property_id: ApiNumberSchema,
//   })
//   .passthrough();

// export type AllowedPaymentMethod = z.infer<typeof AllowedPaymentMethodSchema>;

// /* ==========================================================================
//  * Booking source / cards
//  * ========================================================================== */

// export const BookingSourceSchema = z
//   .object({
//     code: ApiStringSchema,
//     description: ApiStringSchema,

//     id: z.union([z.number(), z.string()]).nullish(),

//     tag: ApiStringSchema,

//     type: ApiStringSchema,
//   })
//   .passthrough();

// export type BookingSource = z.infer<typeof BookingSourceSchema>;

// export const AllowedCardSchema = z
//   .object({
//     id: ApiNumberSchema,
//     name: ApiStringSchema,
//   })
//   .passthrough();

// export type AllowedCard = z.infer<typeof AllowedCardSchema>;

// /* ==========================================================================
//  * Pickup service
//  * ========================================================================== */

// export const PickupOptionSchema = z
//   .object({
//     amount: ApiNumberSchema,

//     currency: CurrencySchema.nullish(),

//     id: ApiNumberSchema,

//     location: PickupLocationSchema.nullish(),

//     pricing_model: CodeDescriptionSchema.nullish(),

//     vehicle: VehicleTypeSchema.nullish(),
//   })
//   .passthrough();

// export type PickupOption = z.infer<typeof PickupOptionSchema>;

// export const PickupServiceSchema = z
//   .object({
//     allowed_locations: nullableArray(PickupLocationSchema),

//     allowed_options: nullableArray(PickupOptionSchema),

//     allowed_pricing_models: nullableArray(CodeDescriptionSchema),

//     allowed_vehicle_types: nullableArray(VehicleTypeSchema),

//     is_enabled: ApiBooleanSchema,

//     is_not_allowed_on_same_day: ApiBooleanSchema,

//     pickup_cancelation_prepayment: CodeDescriptionSchema.nullish(),

//     pickup_instruction: CodeDescriptionSchema.nullish(),
//   })
//   .passthrough();

// export type PickupService = z.infer<typeof PickupServiceSchema>;

// /* ==========================================================================
//  * Social / theme / taxes
//  * ========================================================================== */

// export const SocialMediaSchema = z
//   .object({
//     code: ApiStringSchema,
//     link: ApiStringSchema,
//     name: ApiStringSchema,
//   })
//   .passthrough();

// export type SocialMedia = z.infer<typeof SocialMediaSchema>;

// export const SpaceThemeSchema = z
//   .object({
//     background_image: ApiStringSchema,
//     button_bg_color: ApiStringSchema,
//     button_border_radius: ApiStringSchema,
//     favicon: ApiStringSchema,
//     heading_bar_color: ApiStringSchema,
//     heading_font_color: ApiStringSchema,
//     logo: ApiStringSchema,
//     website: ApiStringSchema,
//   })
//   .passthrough();

// export type SpaceTheme = z.infer<typeof SpaceThemeSchema>;

// export const TaxCategorySchema = z
//   .object({
//     category: CodeDescriptionSchema.nullish(),

//     default_price: ApiNumberSchema,

//     pct: ApiNumberSchema,

//     property_id: ApiNumberSchema,

//     taxation_mode: CodeDescriptionSchema.nullish(),
//   })
//   .passthrough();

// export type TaxCategory = z.infer<typeof TaxCategorySchema>;

// export const TaxSchema = z
//   .object({
//     is_exlusive: ApiBooleanSchema,
//     name: ApiStringSchema,
//     pct: ApiNumberSchema,
//   })
//   .passthrough();

// export type Tax = z.infer<typeof TaxSchema>;

// export const TimeConstraintsSchema = z
//   .object({
//     booking_cutoff: ApiStringSchema,
//     check_in_from: ApiStringSchema,
//     check_in_till: ApiStringSchema,
//     check_out_till: ApiStringSchema,
//   })
//   .passthrough();

// export type TimeConstraints = z.infer<typeof TimeConstraintsSchema>;

// /* ==========================================================================
//  * Property
//  *
//  * This is now the SAME Property schema used inside ExposedBooking.
//  * ========================================================================== */

// export const PropertySchema = z
//   .object({
//     address: ApiStringSchema,

//     adult_child_constraints: AdultChildConstraintsSchema.nullish(),

//     affiliates: nullableArray(z.unknown()),

//     agents: nullableArray(AgentSchema),

//     allowed_booking_sources: nullableArray(BookingSourceSchema),

//     allowed_cards: nullableArray(AllowedCardSchema),

//     allowed_payment_methods: nullableArray(AllowedPaymentMethodSchema),

//     amenities: nullableArray(AmenitySchema),

//     aname: ApiStringSchema,

//     area: ApiStringSchema,

//     baby_cot_offering: BabyCotOfferingSchema.nullish(),

//     be_listing_mode: ApiStringSchema,

//     calendar_extra: ApiStringSchema,

//     calendar_legends: nullableArray(CalendarLegendSchema),

//     city: CitySchema.nullish(),

//     cleaning_frequency: CodeDescriptionSchema.nullish(),

//     company: CompanySchema.nullish(),

//     contacts: nullableArray(ContactSchema),

//     country: CountrySchema.nullish(),

//     currency: CurrencySchema.nullish(),

//     description: PropertyDescriptionSchema.nullish(),

//     extra_info: nullableArray(KeyValueSchema),

//     gap_rule: GapRuleSchema.nullish(),

//     id: ApiNumberSchema,

//     images: nullableArray(PropertyImageSchema),

//     internet_offering: InternetOfferingSchema.nullish(),

//     invoicing_mode: ApiUnknownSchema,

//     is_automatic_check_in_out: ApiBooleanSchema,
//     is_be_enabled: ApiBooleanSchema,
//     is_frontdesk_enabled: ApiBooleanSchema,
//     is_multi_property: ApiBooleanSchema,
//     is_pms_enabled: ApiBooleanSchema,
//     is_upon_request: ApiBooleanSchema,
//     is_vacation_rental: ApiBooleanSchema,

//     linked_pms: nullableArray(LinkedPmsSchema),

//     location: LocationSchema.nullish(),

//     max_nights: ApiNumberSchema,

//     mpo: MpoSchema.nullish(),

//     name: ApiStringSchema,

//     parking_offering: ParkingOfferingSchema.nullish(),

//     payment_methods: ApiUnknownSchema,

//     perma_link: ApiStringSchema,

//     pets_acceptance: PetsAcceptanceSchema.nullish(),

//     phone: ApiStringSchema,

//     pickup_service: PickupServiceSchema.nullish(),

//     postal: ApiStringSchema,

//     privacy_policy: ApiStringSchema,

//     promotions: nullableArray(z.unknown()),

//     registered_name: ApiStringSchema,

//     roomtypes: nullableArray(RoomTypeSchema),

//     social_media: nullableArray(SocialMediaSchema),

//     sources: nullableArray(CodeDescriptionSchema),

//     space_theme: SpaceThemeSchema.nullish(),

//     tags: nullableArray(KeyValueSchema),

//     tax_categories: nullableArray(TaxCategorySchema),

//     tax_nbr: ApiStringSchema,

//     tax_statement: ApiStringSchema,

//     taxation_strategy: CodeDescriptionSchema.nullish(),

//     taxes: nullableArray(TaxSchema),

//     time_constraints: TimeConstraintsSchema.nullish(),
//   })
//   .passthrough();

// export type Property = z.infer<typeof PropertySchema>;

// /* ==========================================================================
//  * Property API
//  * ========================================================================== */

// export const GetExposedPropertyParamsSchema = z
//   .object({
//     aname: ApiStringSchema,
//     currency: CurrencySchema.nullish(),

//     id: ApiNumberSchema,

//     include_sales_rate_plans: ApiBooleanSchema,
//     include_units_hk_status: ApiBooleanSchema,

//     is_backend: ApiBooleanSchema,

//     language: ApiStringSchema,

//     perma_link: ApiStringSchema,
//   })
//   .passthrough();

// export type GetExposedPropertyParams = z.infer<typeof GetExposedPropertyParamsSchema>;

// export const GetExposedPropertyResponseSchema = z
//   .object({
//     ExceptionCode: ApiStringSchema,
//     ExceptionMsg: ApiStringSchema,

//     My_Params_Get_Exposed_Property: GetExposedPropertyParamsSchema.nullish(),

//     My_Result: PropertySchema.nullish(),
//   })
//   .passthrough();

// export type GetExposedPropertyResponse = z.infer<typeof GetExposedPropertyResponseSchema>;

// /* ==========================================================================
//  * BOOKING SHARED STRUCTURES
//  * ========================================================================== */

// /* ==========================================================================
//  * Guest Identification
//  * ========================================================================== */

// export const GuestIdentificationSchema = z
//   .object({
//     number: ApiStringSchema,
//     type: CodeDescriptionSchema.nullish(),
//   })
//   .passthrough();

// export type GuestIdentification = z.infer<typeof GuestIdentificationSchema>;

// /* ==========================================================================
//  * Guest
//  * ========================================================================== */

// export const GuestSchema = z
//   .object({
//     address: ApiStringSchema,

//     alternative_email: ApiStringSchema,

//     cci: ApiStringSchema,

//     city: ApiStringSchema,

//     country: CountrySchema.nullish(),

//     country_id: ApiNumberSchema,

//     country_phone_prefix: ApiStringSchema,

//     dob: ApiStringSchema,

//     email: ApiStringSchema,

//     first_name: ApiStringSchema,

//     id: ApiNumberSchema,

//     id_info: GuestIdentificationSchema.nullish(),

//     is_main: ApiBooleanSchema,

//     last_name: ApiStringSchema,

//     mobile: ApiStringSchema,

//     mobile_without_prefix: ApiStringSchema,

//     nbr_confirmed_bookings: ApiNumberSchema,

//     notes: ApiStringSchema,

//     password: ApiStringSchema,

//     subscribe_to_news_letter: ApiBooleanSchema,
//   })
//   .passthrough();

// export type Guest = z.infer<typeof GuestSchema>;

// /**
//  * Same underlying guest structure.
//  * Keep the semantic alias if useful inside BookingRoom.
//  */
// export const AdditionalGuestSchema = GuestSchema;

// export type AdditionalGuest = z.infer<typeof AdditionalGuestSchema>;

// /* ==========================================================================
//  * Charges
//  * ========================================================================== */

// export const ChargeBreakdownSchema = z
//   .object({
//     city_tax_amount: ApiNumberSchema,
//     city_tax_percent: ApiNumberSchema,

//     net_amount: ApiNumberSchema,

//     service_charge_amount: ApiNumberSchema,
//     service_charge_percent: ApiNumberSchema,

//     tax_amount: ApiNumberSchema,

//     total_amount: ApiNumberSchema,

//     vat_amount: ApiNumberSchema,
//     vat_percent: ApiNumberSchema,
//   })
//   .passthrough();

// export type ChargeBreakdown = z.infer<typeof ChargeBreakdownSchema>;

// /* ==========================================================================
//  * Policy
//  * ========================================================================== */

// export const PolicyBracketSchema = z
//   .object({
//     amount: ApiNumberSchema,
//     amount_formatted: ApiStringSchema,

//     code: ApiStringSchema,

//     currency_id: ApiNumberSchema,

//     due_on: ApiStringSchema,
//     due_on_formatted: ApiStringSchema,

//     gross_amount: ApiNumberSchema,
//     gross_amount_formatted: ApiStringSchema,

//     statement: ApiStringSchema,
//   })
//   .passthrough();

// export type PolicyBracket = z.infer<typeof PolicyBracketSchema>;

// export const BookingPolicySchema = z
//   .object({
//     brackets: nullableArray(PolicyBracketSchema),

//     combined_statement: ApiStringSchema,

//     type: ApiStringSchema,
//   })
//   .passthrough();

// export type BookingPolicy = z.infer<typeof BookingPolicySchema>;

// /* ==========================================================================
//  * Inclusive Tax
//  * ========================================================================== */

// export const CalculatedInclusiveTaxSchema = z
//   .object({
//     CALCULATED_VALUE: ApiNumberSchema,
//     TAX_NAME: ApiStringSchema,
//     TAX_PCT: ApiNumberSchema,
//   })
//   .passthrough();

// export type CalculatedInclusiveTax = z.infer<typeof CalculatedInclusiveTaxSchema>;

// export const InclusiveTaxSummarySchema = z
//   .object({
//     CALCULATED_INCLUSIVE_TAXES: nullableArray(CalculatedInclusiveTaxSchema),

//     NET_PREMIUM: ApiNumberSchema,
//   })
//   .passthrough();

// export type InclusiveTaxSummary = z.infer<typeof InclusiveTaxSummarySchema>;

// /* ==========================================================================
//  * Booking room day
//  * ========================================================================== */

// export const BookingRoomDaySchema = z
//   .object({
//     amount: ApiNumberSchema,

//     charges: ChargeBreakdownSchema.nullish(),

//     cost: ApiNumberSchema,

//     date: ApiStringSchema,

//     system_id: ApiNumberSchema,
//   })
//   .passthrough();

// export type BookingRoomDay = z.infer<typeof BookingRoomDaySchema>;

// /* ==========================================================================
//  * Booking Room
//  *
//  * IMPORTANT:
//  *
//  * rateplan -> RatePlanSchema
//  * roomtype -> RoomTypeSchema
//  * unit     -> PhysicalRoomSchema
//  * occupancy -> OccupancySchema
//  *
//  * No duplicates.
//  * ========================================================================== */

// export const BookingRoomStatusSchema = z
//   .object({
//     code: ApiStringSchema,
//     description: ApiStringSchema,
//   })
//   .passthrough();

// export type BookingRoomStatus = z.infer<typeof BookingRoomStatusSchema>;

// export const BookingRoomSchema = z
//   .object({
//     agent: AgentSchema.nullish(),

//     applicable_policies: nullableArray(BookingPolicySchema),

//     arrival_time: CodeDescriptionSchema.nullish(),

//     assigned_units_pool: ApiStringSchema,

//     bed_preference: ApiUnknownSchema,

//     calendar_extra: ApiStringSchema,

//     charges: ChargeBreakdownSchema.nullish(),

//     check_in: ApiBooleanSchema,

//     cost: ApiNumberSchema,

//     days: nullableArray(BookingRoomDaySchema),

//     departure_time: CodeDescriptionSchema.nullish(),

//     from_date: ApiStringSchema,

//     gross_cost: ApiNumberSchema,
//     gross_guarantee: ApiNumberSchema,
//     gross_total: ApiNumberSchema,

//     guarantee: ApiNumberSchema,

//     guest: GuestSchema.nullish(),

//     hb_preference: ApiUnknownSchema,

//     identifier: ApiStringSchema,

//     in_out: CodeDescriptionSchema.nullish(),

//     inclusive_taxes: InclusiveTaxSummarySchema.nullish(),

//     is_split: ApiBooleanSchema,

//     notes: ApiStringSchema,

//     occupancy: OccupancySchema.nullish(),

//     ota_meta: ApiUnknownSchema,
//     ota_meta_plain: ApiUnknownSchema,
//     ota_taxes: ApiUnknownSchema,
//     ota_unique_id: ApiUnknownSchema,

//     parent_room_identifier: ApiStringSchema,

//     prepayment_amount: ApiNumberSchema,
//     prepayment_amount_gross: ApiNumberSchema,

//     // Reused from property
//     rateplan: RatePlanSchema.nullish(),

//     // Reused from property
//     roomtype: RoomTypeSchema.nullish(),

//     sharing_persons: nullableArray(AdditionalGuestSchema),

//     smoking_option: SmokingOptionSchema.nullish(),

//     status: BookingRoomStatusSchema.nullish(),

//     system_id: ApiNumberSchema,

//     taxes: ApiUnknownSchema,

//     to_date: ApiStringSchema,

//     total: ApiNumberSchema,

//     // Reused from property
//     unit: PhysicalRoomSchema.nullish(),
//   })
//   .passthrough();

// export type BookingRoom = z.infer<typeof BookingRoomSchema>;

// /* ==========================================================================
//  * Financial
//  * ========================================================================== */

// export const PaymentDueDateSchema = z
//   .object({
//     amount: ApiNumberSchema,
//     currencysymbol: ApiStringSchema,
//     date: ApiStringSchema,
//     description: ApiStringSchema,
//     room: ApiStringSchema,
//   })
//   .passthrough();

// export type PaymentDueDate = z.infer<typeof PaymentDueDateSchema>;

// export const PartyFinancialSchema = z
//   .object({
//     cancelation_penality_as_if_today: ApiNumberSchema,

//     collected: ApiNumberSchema,
//     due_amount: ApiNumberSchema,

//     due_dates: nullableArray(PaymentDueDateSchema),

//     gross_cost: ApiNumberSchema,
//     gross_total: ApiNumberSchema,

//     invoice_nbr: ApiStringSchema,

//     payments: nullableArray(z.unknown()),

//     refunds: ApiNumberSchema,

//     total_amount: ApiNumberSchema,
//   })
//   .passthrough();

// export type PartyFinancial = z.infer<typeof PartyFinancialSchema>;

// export const BookingFinancialSchema = PartyFinancialSchema;

// export type BookingFinancial = z.infer<typeof BookingFinancialSchema>;

// /* ==========================================================================
//  * Financial snapshot
//  * ========================================================================== */

// export const FinancialEntrySchema = z
//   .object({
//     bh_financial_detail_id: ApiNumberSchema,

//     charge_source: ApiNumberSchema,

//     city_tax_amount: ApiNumberSchema,
//     city_tax_percent: ApiNumberSchema,

//     credit: ApiNumberSchema,

//     currency_id: ApiNumberSchema,

//     debit: ApiNumberSchema,

//     description: ApiStringSchema,

//     net_amount: ApiNumberSchema,

//     rate_plan_id: ApiNumberSchema,

//     rel_entity: ApiStringSchema,
//     rel_entity_key: ApiStringSchema,

//     room_identifier: ApiStringSchema,

//     room_type_id: ApiNumberSchema,

//     service_charge_amount: ApiNumberSchema,
//     service_charge_percent: ApiNumberSchema,

//     service_date: ApiStringSchema,

//     tax_amount: ApiNumberSchema,

//     total_amount: ApiNumberSchema,

//     vat_amount: ApiNumberSchema,
//     vat_percent: ApiNumberSchema,
//   })
//   .passthrough();

// export type FinancialEntry = z.infer<typeof FinancialEntrySchema>;

// export const BookingFinancialSnapshotSchema = z
//   .object({
//     entries: nullableArray(FinancialEntrySchema),
//     total_debit: ApiNumberSchema,
//   })
//   .passthrough();

// export type BookingFinancialSnapshot = z.infer<typeof BookingFinancialSnapshotSchema>;

// /* ==========================================================================
//  * Booking metadata
//  * ========================================================================== */

// export const BookingCreatedAtSchema = z
//   .object({
//     date: ApiStringSchema,
//     hour: ApiNumberSchema,
//     minute: ApiNumberSchema,
//   })
//   .passthrough();

// export type BookingCreatedAt = z.infer<typeof BookingCreatedAtSchema>;

// export const BookingAuditEventSchema = z
//   .object({
//     date: ApiStringSchema,

//     hour: ApiNumberSchema,

//     id: ApiNumberSchema,

//     minute: ApiNumberSchema,
//     second: ApiNumberSchema,

//     type: ApiStringSchema,

//     user: ApiStringSchema,
//   })
//   .passthrough();

// export type BookingAuditEvent = z.infer<typeof BookingAuditEventSchema>;

// export const BookingDateFormatSchema = z
//   .object({
//     from_date: ApiStringSchema,
//     to_date: ApiStringSchema,
//   })
//   .passthrough();

// export type BookingDateFormat = z.infer<typeof BookingDateFormatSchema>;

// export const BookingOriginSchema = z
//   .object({
//     Icon: ApiStringSchema,
//     Label: ApiStringSchema,
//   })
//   .passthrough();

// export type BookingOrigin = z.infer<typeof BookingOriginSchema>;

// export const BookingExtraSchema = KeyValueSchema;

// export type BookingExtra = z.infer<typeof BookingExtraSchema>;

// export const ExposedBookingSchema = z
//   .object({
//     agent: AgentSchema.nullish(),

//     agent_booking_nbr: ApiStringSchema,

//     agent_financial: PartyFinancialSchema.nullish(),

//     allowed_actions: nullableArray(CodeDescriptionSchema),

//     arrival: CodeDescriptionSchema.nullish(),

//     booked_on: BookingCreatedAtSchema.nullish(),

//     booking_nbr: ApiStringSchema,

//     bypassed_ota_revisions: ApiUnknownSchema,

//     channel_booking_nbr: ApiStringSchema,

//     charges: ChargeBreakdownSchema.nullish(),

//     company_name: ApiStringSchema,
//     company_tax_nbr: ApiStringSchema,

//     cost: ApiNumberSchema,

//     // Shared
//     currency: CurrencySchema.nullish(),

//     dp_effect: ApiUnknownSchema,

//     events: nullableArray(BookingAuditEventSchema),

//     extra_services: ApiUnknownSchema,

//     extras: nullableArray(BookingExtraSchema),

//     financial: BookingFinancialSchema.nullish(),

//     financial_snapshot: BookingFinancialSnapshotSchema.nullish(),

//     format: BookingDateFormatSchema.nullish(),

//     from_date: ApiStringSchema,

//     guest: GuestSchema.nullish(),

//     guest_financial: PartyFinancialSchema.nullish(),

//     invoice_info: ApiUnknownSchema,

//     is_direct: ApiBooleanSchema,
//     is_editable: ApiBooleanSchema,
//     is_in_loyalty_mode: ApiBooleanSchema,
//     is_pms_enabled: ApiBooleanSchema,

//     is_requested_to_cancel: ApiBooleanSchema,

//     is_room_less: ApiBooleanSchema,

//     is_source_editable: ApiBooleanSchema,

//     // Shared
//     occupancy: OccupancySchema.nullish(),

//     origin: BookingOriginSchema.nullish(),

//     ota_commission: ApiNumberSchema,

//     ota_guarante: ApiUnknownSchema,
//     ota_guarantee_plain: ApiUnknownSchema,

//     ota_manipulations: ApiUnknownSchema,

//     ota_notes: ApiUnknownSchema,

//     ota_services: ApiUnknownSchema,
//     ota_services_plain: ApiUnknownSchema,

//     para_charges: nullableArray(z.unknown()),

//     payment_collect: ApiUnknownSchema,
//     payment_type: ApiUnknownSchema,

//     pickup_info: ApiUnknownSchema,

//     promo_key: ApiStringSchema,

//     // THIS IS THE SAME PROPERTY TYPE
//     property: PropertySchema.nullish(),

//     remark: ApiStringSchema,

//     rooms: nullableArray(BookingRoomSchema),

//     // Shared
//     source: BookingSourceSchema.nullish(),

//     status: CodeDescriptionSchema.nullish(),

//     system_id: ApiNumberSchema,

//     to_date: ApiStringSchema,

//     total: ApiNumberSchema,
//   })
//   .passthrough();

// export type ExposedBooking = z.infer<typeof ExposedBookingSchema>;
