import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { WalmartListingRow } from '@/types/walmart';

export async function parseUpload(file: File): Promise<WalmartListingRow[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return parseCSV(file);
  }

  if (ext === 'xlsx' || ext === 'xls') {
    return parseXLSX(file);
  }

  throw new Error('Unsupported file type');
}

function parseCSV(file: File): Promise<WalmartListingRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: result => resolve(result.data as WalmartListingRow[]),
      error: err => reject(err),
    });
  });
}

async function parseXLSX(file: File): Promise<WalmartListingRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Default: first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(sheet) as WalmartListingRow[];
}
