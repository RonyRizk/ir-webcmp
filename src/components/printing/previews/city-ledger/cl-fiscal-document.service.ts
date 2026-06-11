import Token from '@/models/Token';
import { CityLedgerService, type ClTx } from '@/services/city-ledger';
import { PropertyService } from '@/services/property.service';
import type { IProperty } from '@/models/property';

export interface ClFiscalDocumentData {
  property: IProperty;
  transactions: ClTx[];
}

export class ClFiscalDocumentService {
  private tokenService = new Token();
  private propertyService = new PropertyService();
  private cityLedgerService = new CityLedgerService();

  init(baseurl: string | undefined, ticket: string): void {
    if (baseurl) this.tokenService.setBaseUrl(baseurl);
    this.tokenService.setToken(ticket);
  }

  async fetchData(propertyId: number, agentId: number, documentNumber?: string): Promise<ClFiscalDocumentData> {
    const [propertyData, clResult] = await Promise.all([
      this.propertyService.getExposedProperty({ id: propertyId, language: 'en' }),
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
