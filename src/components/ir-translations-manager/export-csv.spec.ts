import { exportSetupEntriesCsv } from './export-csv';

describe('exporting setup entries to CSV', () => {
  it('asks Setup for the chosen language and downloads the file it points to', async () => {
    const requested: unknown[] = [];
    const service = {
      exportSetupEntriesToCSV: async (params: { language: string }) => {
        requested.push(params);
        return 'https://cdn.igloorooms.com/exports/setup_ar.csv';
      },
    };
    const downloads: [string, string?][] = [];

    await exportSetupEntriesCsv(service, 'ar', (url, filename) => downloads.push([url, filename]));

    expect(requested).toEqual([{ language: 'AR' }]);
    expect(downloads).toEqual([['https://cdn.igloorooms.com/exports/setup_ar.csv', 'setup-entries-AR.csv']]);
  });

  it('fails without downloading anything when Setup returns no file', async () => {
    const service = { exportSetupEntriesToCSV: async () => null as unknown as string };
    const downloads: string[] = [];

    await expect(exportSetupEntriesCsv(service, 'fr', url => downloads.push(url))).rejects.toThrow();

    expect(downloads).toEqual([]);
  });
});
