import axios from 'axios';
import * as z from 'zod';
import {
  DistinctSetupTablesResponseSchema,
  EditSetupParamsSchema,
  EditSetupManyParamsSchema,
  GetSetupEntriesByTblNameMultiParamsSchema,
  GetSetupEntriesByTblNameParamsSchema,
  GetSetupEntryByCodeParamsSchema,
  ZIEntrySchema,
  ZExposedLanguagesSchema,
  type EditSetupParams,
  type EditSetupManyParams,
  type GetSetupEntriesByTblNameMultiParams,
  type GetSetupEntriesByTblNameParams,
  type GetSetupEntryByCodeParams,
  type SetupEntry,
  type ExposedLanguages,
} from './types';

export * from './types';

export class SetupService {
  /**
   * All entries belonging to a single setup table (e.g. one translation table).
   */
  public async getSetupEntriesByTblName(params: GetSetupEntriesByTblNameParams): Promise<SetupEntry[]> {
    const payload = GetSetupEntriesByTblNameParamsSchema.parse(params);
    const { data } = await axios.post('/Get_Setup_Entries_By_TBL_NAME', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return z.array(ZIEntrySchema).parse(data.My_Result ?? []);
  }

  /**
   * Entries across several setup tables in a single round trip — used to load
   * every translation table's rows at once instead of one request per table.
   */
  public async getSetupEntriesByTblNameMulti(params: GetSetupEntriesByTblNameMultiParams): Promise<SetupEntry[]> {
    const payload = GetSetupEntriesByTblNameMultiParamsSchema.parse(params);
    const { data } = await axios.post('/Get_Setup_Entries_By_TBL_NAME_Multi', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return z.array(ZIEntrySchema).parse(data.My_Result ?? []);
  }

  /**
   * Every distinct TBL_NAME that currently has at least one setup entry.
   * Normalizes the response to plain strings regardless of whether the API
   * returns bare names or row objects carrying a TBL_NAME field.
   */
  public async getDistinctSetupTables(): Promise<string[]> {
    const { data } = await axios.post('/Get_Distinct_Setup_Tables', {});
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    const rows = DistinctSetupTablesResponseSchema.parse(data.My_Result ?? []);
    return rows.map(row => (typeof row === 'string' ? row : row.TBL_NAME));
  }

  /**
   * A single entry by its natural key (table + code). Returns null when no
   * matching row exists.
   */
  public async getSetupEntryByCode(params: GetSetupEntryByCodeParams): Promise<SetupEntry | null> {
    const payload = GetSetupEntryByCodeParamsSchema.parse(params);
    const { data } = await axios.post('/Get_SetupEntry_By_Code', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return data.My_Result ? ZIEntrySchema.parse(data.My_Result) : null;
  }

  /**
   * Creates or updates a setup entry. There is no separate delete endpoint —
   * soft-delete a row by resubmitting it with `ISDELETED: true`.
   */
  public async editSetup(params: EditSetupParams) {
    const payload = EditSetupParamsSchema.parse(params);
    const { data } = await axios.post('/Edit_Setup', payload);
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return payload;
  }
  /**
   * Creates or updates a setup entry in bulk. There is no separate delete endpoint —
   * soft-delete a row by resubmitting it with `ISDELETED: true`.
   */
  public async editSetupMany(params: EditSetupManyParams): Promise<SetupEntry[]> {
    const payload = EditSetupManyParamsSchema.parse(params);
    const { data } = await axios.post('/Edit_Setup_Many', { list_setup_entries: payload });
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return payload;
  }

  /**
   * Fetches the exposed languages available to the engine.
   *
   * @returns A validated list of languages including code, culture, name,
   * text direction, flag URL, and identifier.
   * @throws If the API returns an exception or the response fails validation.
   */
  public async getExposedLanguages(): Promise<ExposedLanguages> {
    const { data } = await axios.post('https://gateway.igloorooms.com/IRBE/Get_Exposed_Languages', {});
    if (data.ExceptionMsg !== '') {
      throw new Error(data.ExceptionMsg);
    }
    return ZExposedLanguagesSchema.parse(data.My_Result);
  }
}
