import ApiClient from '@/models/ApiClient';
import { CityLedgerService, type ClTx } from '@/services/city-ledger';
import { PropertyService } from '@/services/property.service';
import type { IProperty } from '@/models/property';
import { LocaleController } from '@/services/locale/locale.controller';

export interface ClFiscalDocumentData {
  property: IProperty;
  transactions: ClTx[];
}

export class ClFiscalDocumentService {
  private apiClientService = new ApiClient();
  private propertyService = new PropertyService();
  private cityLedgerService = new CityLedgerService();

  init(baseurl: string | undefined, ticket: string): void {
    if (baseurl) this.apiClientService.setBaseUrl(baseurl);
    this.apiClientService.setApiClient(ticket);
  }

  async fetchData(propertyId: number, agentId: number, documentNumber?: string): Promise<ClFiscalDocumentData> {
    const [propertyData, clResult] = await Promise.all([
      this.propertyService.getExposedProperty({ id: propertyId, language: LocaleController.language }),
      this.cityLedgerService.fetchCL({
        AGENCY_ID: agentId,
        START_ROW: 0,
        END_ROW: 1000,
        SEARCH_QUERY: documentNumber,
      }),
    ]);
    return {
      property: propertyData?.My_Result ?? null,
      transactions: clResult?.My_Cl_tx ?? [],
    };
  }
}
