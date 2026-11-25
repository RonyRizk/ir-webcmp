import type { SetupService } from '@/services/setup';

type CsvExporter = Pick<SetupService, 'exportSetupEntriesToCSV'>;
type Download = (url: string, filename?: string) => void;

/**
 * Exports every setup entry in one language. Setup builds the file server-side and
 * answers with its URL. Language codes go up upper-cased, as Get_Missing_Setup_Entries
 * expects too.
 */
export async function exportSetupEntriesCsv(service: CsvExporter, languageCode: string, download: Download): Promise<void> {
  const language = languageCode.toUpperCase();
  const url = await service.exportSetupEntriesToCSV({ language });
  if (!url) {
    throw new Error(`Setup returned no CSV file for ${language}`);
  }
  download(url, `setup-entries-${language}.csv`);
}
