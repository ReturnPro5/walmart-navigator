import { WalmartListingRow } from '@/types/walmart';
import { daysBetween } from './dates';

export type RiskBucket = 'Low' | 'Medium' | 'High' | 'Critical';

export function getDaysLive(row: WalmartListingRow): number | null {
  if (!row.AvailableForSale || !row.AvailableForSaleDate) return null;
  return daysBetween(row.AvailableForSaleDate, new Date().toISOString());
}

export function getRiskBucket(row: WalmartListingRow): RiskBucket {
  if (row.LocationNotListable) return 'Critical';

  if (row.OpsComplete && !row.AvailableForSale) return 'Critical';

  const daysLive = getDaysLive(row);

  if (daysLive === null) return 'Critical';
  if (daysLive < 30) return 'Low';
  if (daysLive < 60) return 'Medium';
  if (daysLive < 90) return 'High';

  return 'Critical';
}
