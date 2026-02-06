import Papa from 'papaparse';

export async function parseUpload(file: File): Promise<Record<string, any>[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data as Record<string, any>[]),
        error: reject,
      });
    });
  }

  throw new Error('Only CSV files are supported');
}
