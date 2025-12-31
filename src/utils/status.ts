import { WalmartListingRow } from '@/types/walmart';

export type InventoryStatus =
  | 'Live'
  | 'Blocked'
  | 'Ops Complete'
  | 'Processing';

export function getInventoryStatus(row: WalmartListingRow): InventoryStatus {
  if (row.LocationNotListable) return 'Blocked';
  if (row.AvailableForSale) return 'Live';
  if (row.OpsComplete) return 'Ops Complete';
  return 'Processing';
}
