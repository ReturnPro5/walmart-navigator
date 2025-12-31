export interface WalmartListingRow {
  TRGID: string;
  ProgramName: string;
  MasterProgramName?: string;
  CategoryName?: string;
  Title?: string;
  UPC?: string;

  CheckedInOn?: string;
  OpsComplete: boolean;
  OpsCompleteDate?: string;

  AvailableForSale: boolean;
  AvailableForSaleDate?: string;

  LocationNotListable: boolean;
  ProductStatus?: string;
  B2CAuction?: boolean;
}
