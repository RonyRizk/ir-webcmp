import { type ChannelReportResult, type ChannelSalesParams, parseChannelReportResult, parseChannelSalesParams } from '@/components/ir-sales-by-channel/types';
import calendar_data from '@/stores/calendar-data';
import { downloadFile } from '@/utils/utils';
import axios from 'axios';

import {
  AllowedPropertiesSchema,
  CountrySalesParams,
  DailyRevenueReportParams,
  ExposedRectifierParams,
  ExposedRectifierParamsSchema,
  FetchedProperty,
  FetchNotificationsParamsSchema,
  FetchNotificationsResult,
  FetchNotificationsResultSchema,
  FetchUnBookableRooms,
  FetchUnBookableRoomsResult,
  FetchUnBookableRoomsSchema,
  GetUnifiedFolioParams,
  GetUnifiedFolioParamsSchema,
  GetUnifiedFolioResponse,
  GetUnifiedFolioResult,
  HandleExposedPropertyTaxCategoriesParams,
  HandleExposedPropertyTaxCategoriesParamsSchema,
  MonthlyStatsParams,
  MonthlyStatsResults,
  SetPropertyCalendarExtraParams,
  SetPropertyCalendarExtraParamsSchema,
  SetPropertyGapConfigParams,
  SetPropertyGapConfigParamsSchema,
  SetRoomCalendarExtraParams,
  SetRoomCalendarExtraParamsSchema,
  PrintGuestFolioDocParams,
  PrintGuestFolioDocParamsSchema,
} from './types';

export class PropertyService {
  public async printGuestFolioDoc(params: PrintGuestFolioDocParams): Promise<string | null> {
    const payload = PrintGuestFolioDocParamsSchema.parse(params);
    const { data } = await axios.post('/Print_Guest_Folio_Doc', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }
  public async handleExposedPropertyTaxCategories(params: HandleExposedPropertyTaxCategoriesParams) {
    const payload = HandleExposedPropertyTaxCategoriesParamsSchema.parse(params);
    const { data } = await axios.post('/Handle_Exposed_Property_Tax_Categories', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data;
  }

  public async setPropertyGapConfig(params: SetPropertyGapConfigParams) {
    const payload = SetPropertyGapConfigParamsSchema.parse(params);
    const { data } = await axios.post('/Set_Property_Gap_Config', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data;
  }

  public async getExposedProperty(params: {
    id: number | null;
    language: string;
    is_backend?: boolean;
    aname?: string;
    include_units_hk_status?: boolean;
    include_sales_rate_plans?: boolean;
  }) {
    try {
      const { data } = await axios.post(`/Get_Exposed_Property`, params);
      if (data.ExceptionMsg !== '') {
        throw new Error(data.ExceptionMsg);
      }
      const results = data.My_Result;
      calendar_data.property = { ...results };
      calendar_data.adultChildConstraints = results.adult_child_constraints;
      calendar_data.allowedBookingSources = results.allowed_booking_sources;
      calendar_data.allowed_payment_methods = results.allowed_payment_methods;
      calendar_data.currency = results.currency;
      calendar_data.is_vacation_rental = results.is_vacation_rental;
      calendar_data.pickup_service = results.pickup_service;
      calendar_data.max_nights = results.max_nights;
      calendar_data.roomsInfo = results.roomtypes;
      calendar_data.taxes = results.taxes;
      calendar_data.id = results.id;
      calendar_data.country = results.country;
      calendar_data.name = results.name;
      calendar_data.is_automatic_check_in_out = results.is_automatic_check_in_out;
      calendar_data.tax_statement = results.tax_statement;
      calendar_data.is_frontdesk_enabled = results.is_frontdesk_enabled;
      calendar_data.is_pms_enabled = results.is_pms_enabled;
      const spitTime = results?.time_constraints?.check_out_till?.split(':');
      calendar_data.checkin_checkout_hours = {
        offset: results.city.gmt_offset,
        hour: Number(spitTime[0] || 0),
        minute: Number(spitTime[1] || 0),
      };
      return data;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
  public async getActiveOptimExposedProperties() {
    const { data } = await axios.post('/Get_Active_Optim_Exposed_Properties', {});
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return AllowedPropertiesSchema.parse(data.My_Result);
  }
  public async exposedRectifier(params: ExposedRectifierParams) {
    const payload = ExposedRectifierParamsSchema.parse(params);
    const { data } = await axios.post('/Exposed_Rectifier', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }
  public async setPropertyCalendarExtra(params: SetPropertyCalendarExtraParams) {
    const payload = SetPropertyCalendarExtraParamsSchema.parse(params);
    const { data } = await axios.post('/Set_Property_Calendar_Extra', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }

  public async setRoomCalendarExtra(params: SetRoomCalendarExtraParams) {
    const payload = SetRoomCalendarExtraParamsSchema.parse(params);
    const { data } = await axios.post('/Set_Room_Calendar_Extra', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }
  public async getChannelSales(params: ChannelSalesParams): Promise<ChannelReportResult> {
    const _params = parseChannelSalesParams(params);
    const { data } = await axios.post('/Get_Channel_Sales', _params);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    if (params.is_export_to_excel) {
      downloadFile(data.My_Params_Get_Channel_Sales.Link_excel);
    }
    return parseChannelReportResult(data.My_Result);
  }

  public async getExposedAllowedProperties() {
    const { data } = await axios.post('/Get_Exposed_Allowed_Properties', {});
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return AllowedPropertiesSchema.parse(data.My_Result);
  }

  public async searchExposedAllowedProperties(searchTerm: string): Promise<FetchedProperty[]> {
    const payload = searchTerm ? { search_term: searchTerm } : {};
    const { data } = await axios.post('/Get_Exposed_Allowed_Properties', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return Array.isArray(data.My_Result) ? data.My_Result : [];
  }

  public async getUnifiedFolio(params: GetUnifiedFolioParams): Promise<GetUnifiedFolioResponse> {
    const payload = GetUnifiedFolioParamsSchema.parse(params);
    const { data } = await axios.post('/Get_Unified_Folio', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    const params_echo = data.My_Params_Get_Unified_Folio;
    if (payload.is_export_to_excel && params_echo?.Link_excel) {
      downloadFile(params_echo.Link_excel);
    }
    const rows: GetUnifiedFolioResult = data.My_Result ?? [];
    const total: number = params_echo?.o_Total_Rows ?? rows.length;
    return { rows, total };
  }

  public async getCountrySales(params: CountrySalesParams) {
    const { data } = await axios.post('/Get_Country_Sales', params);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    if (params.is_export_to_excel) {
      downloadFile(data.My_Params_Get_Country_Sales.Link_excel);
    }
    return data.My_Result;
  }

  public async getDailyRevenueReport(params: DailyRevenueReportParams) {
    const { data } = await axios.post('/Get_Daily_Revenue_Report', params);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    if (params.is_export_to_excel) {
      downloadFile(data.My_Params_Get_Daily_Revenue_Report.Link_excel);
    }
    return data.My_Result;
  }

  public async setExposedCleaningFrequency(params: { property_id: number; code: string }) {
    const { data } = await axios.post('/Set_Exposed_Cleaning_Frequency', params);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }

  public async getMonthlyStats(params: MonthlyStatsParams): Promise<MonthlyStatsResults> {
    const { data } = await axios.post('/Get_Monthly_Stats', params);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    if (params.is_export_to_excel) {
      downloadFile(data.My_Params_Get_Monthly_Stats.Link_excel);
    }
    return data.My_Result;
  }

  public async fetchNotifications(property_id: number): Promise<FetchNotificationsResult> {
    const payload = FetchNotificationsParamsSchema.parse({ property_id });
    const { data } = await axios.post('/Fetch_Notifications', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return FetchNotificationsResultSchema.parse(data.My_Result);
  }

  public async fetchUnBookableRooms(params: FetchUnBookableRooms): Promise<FetchUnBookableRoomsResult | null> {
    const payload = FetchUnBookableRoomsSchema.parse(params);
    const { data } = await axios.post('/Fetch_UnBookable_Rooms', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }

  public async setExposedGapNightsPolicy(params: { property_id: number; rule_code: string; applicable_days: number }) {
    const { data } = await axios.post('/Set_Exposed_Gap_Nights_Policy', params);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result;
  }
}
