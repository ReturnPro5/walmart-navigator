export interface WalmartListingRow {
  // Core identifiers
  id?: string;
  TRGID?: string;
  UPC?: string;
  Model?: string;
  Title?: string;
  ItemID?: string;
  SKU?: string;

  // Location & Program
  ProgramName?: string;
  FacilityName?: string;
  LocationName?: string;
  CategoryName?: string;

  // Condition
  Condition?: string;
  FinalCondition?: string;

  // Dates
  CheckedInOn?: string;
  OpsCompletedOn?: string;
  AvailableForSaleDate?: string;
  ListedDate?: string;
  SoldDate?: string;

  // Status flags
  OpsComplete?: boolean;
  AvailableForSale?: boolean;
  LocationNotListable?: boolean;

  // Financials
  Cost?: number;
  Retail?: number;
  ExpectedRecovery?: number;
  GMV?: number;

  // Performance
  Views?: number;
  UnitsSold?: number;
  Orders?: number;

  // Inventory
  QuantityOnHand?: number;
  QuantityReserved?: number;

  // Aging
  AgingDays?: number;

  // Pricing
  CurrentPrice?: number;
  CompetitorPrice?: number;

  // Suppression
  SuppressionReason?: string;
  IsSuppressed?: boolean;
}
