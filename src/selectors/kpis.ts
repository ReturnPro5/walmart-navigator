import { WalmartListingRow } from '@/types/walmart';
import { getRiskBucket } from '@/utils/risk';
import { daysBetween } from '@/utils/dates';

export function activeListings(rows: WalmartListingRow[]) {
  return rows.filter(
    r => r.AvailableForSale && !r.LocationNotListable
  ).length;
}

export function listedRate(rows: WalmartListingRow[]) {
  if (!rows.length) return 0;
  const listed = rows.filter(r => r.AvailableForSale).length;
  return (listed / rows.length) * 100;
}

export function avgDaysToList(rows: WalmartListingRow[]) {
  const values = rows
    .map(r => daysBetween(r.CheckedInOn, r.AvailableForSaleDate))
    .filter((v): v is number => v !== null);

  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function avgDaysLive(rows: WalmartListingRow[]) {
  const values = rows
    .filter(r => r.AvailableForSale)
    .map(r => daysBetween(r.AvailableForSaleDate, new Date().toISOString()))
    .filter((v): v is number => v !== null);

  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function inventoryAtRisk(rows: WalmartListingRow[]) {
  return rows.filter(r => {
    const risk = getRiskBucket(r);
    return risk === 'High' || risk === 'Critical';
  }).length;
}

export function riskRate(rows: WalmartListingRow[]) {
  if (!rows.length) return 0;
  return (inventoryAtRisk(rows) / rows.length) * 100;
}
