// Mock data for Walmart US Dashboard

export interface KPIData {
  value: number | string;
  label: string;
  delta?: number;
  deltaLabel?: string;
  format?: 'number' | 'currency' | 'percent';
}

export interface InventoryItem {
  id: string;
  upc: string;
  model: string;
  title: string;
  category: string;
  condition: string;
  facility: string;
  program: string;
  quantity: number;
  cost: number;
  retail: number;
  expectedRecovery: number;
  checkInDate: string;
  listedDate: string | null;
  agingDays: number;
  lifecycleStatus: 'Inbound' | 'Processing' | 'Listed' | 'Live' | 'Sold' | 'Stuck';
  listingStatus: 'Published' | 'Unpublished' | 'Suppressed' | 'Out of Stock';
  suppressionReason?: string;
  views: number;
  unitsSold: number;
  gmv: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface AgingBucket {
  range: string;
  count: number;
  value: number;
}

export interface CategoryRisk {
  category: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

// Generate Walmart Fiscal Weeks
export const generateFiscalWeeks = (): string[] => {
  const weeks: string[] = [];
  for (let i = 1; i <= 52; i++) {
    weeks.push(`FY25-W${i.toString().padStart(2, '0')}`);
  }
  return weeks;
};

export const fiscalWeeks = generateFiscalWeeks();

export const facilities = ['Dallas DC', 'Phoenix DC', 'Atlanta DC', 'Chicago DC', 'LA DC'];
export const categories = ['Electronics', 'Home & Garden', 'Apparel', 'Toys', 'Sports', 'Automotive'];
export const conditions = ['New', 'Refurbished', 'Open Box', 'Like New'];
export const programs = ['Retail Returns', 'Overstock', 'Liquidation', 'Seasonal'];

// Executive KPIs
export const executiveKPIs: KPIData[] = [
  { value: 24873, label: 'Active Listings', delta: 3.2, deltaLabel: 'vs last week', format: 'number' },
  { value: 87.4, label: 'Listed Rate', delta: 2.1, deltaLabel: 'vs last week', format: 'percent' },
  { value: 34.2, label: 'Sell-Through Rate', delta: -1.4, deltaLabel: 'vs last week', format: 'percent' },
  { value: 4.2, label: 'Avg Days to List', delta: -0.3, deltaLabel: 'vs last week', format: 'number' },
  { value: 18.7, label: 'Avg Days Live', delta: 1.2, deltaLabel: 'vs last week', format: 'number' },
  { value: 1284650, label: 'GMV (Period)', delta: 8.4, deltaLabel: 'vs last week', format: 'currency' },
  { value: 3421, label: 'Inventory at Risk', delta: -5.2, deltaLabel: 'vs last week', format: 'number' },
  { value: 12.4, label: 'Risk Rate', delta: -1.8, deltaLabel: 'vs last week', format: 'percent' },
];

// Inventory Status Distribution
export const inventoryStatusData = [
  { name: 'Live', value: 18234, color: 'hsl(142, 76%, 36%)' },
  { name: 'Unlisted', value: 4521, color: 'hsl(215, 16%, 47%)' },
  { name: 'Suppressed', value: 1872, color: 'hsl(0, 84%, 60%)' },
  { name: 'Out of Stock', value: 892, color: 'hsl(45, 93%, 47%)' },
];

// Risk Distribution
export const riskDistributionData = [
  { name: 'Low', value: 15234, color: 'hsl(142, 76%, 36%)' },
  { name: 'Medium', value: 5421, color: 'hsl(45, 93%, 47%)' },
  { name: 'High', value: 2872, color: 'hsl(25, 95%, 53%)' },
  { name: 'Critical', value: 1892, color: 'hsl(0, 84%, 60%)' },
];

// Funnel Data
export const funnelData: FunnelStage[] = [
  { stage: 'Inbound', count: 32450, percentage: 100 },
  { stage: 'Processed', count: 28340, percentage: 87.3 },
  { stage: 'Listed', count: 25120, percentage: 77.4 },
  { stage: 'Live', count: 18234, percentage: 56.2 },
  { stage: 'Sold', count: 8920, percentage: 27.5 },
];

// Aging Buckets
export const agingBucketsData: AgingBucket[] = [
  { range: '0-30', count: 12450, value: 342000 },
  { range: '31-60', count: 8230, value: 284000 },
  { range: '61-90', count: 4120, value: 156000 },
  { range: '90+', count: 2890, value: 98000 },
];

// Category Risk Heatmap
export const categoryRiskData: CategoryRisk[] = [
  { category: 'Electronics', low: 3240, medium: 1230, high: 890, critical: 420 },
  { category: 'Home & Garden', low: 2890, medium: 980, high: 540, critical: 280 },
  { category: 'Apparel', low: 4120, medium: 1540, high: 720, critical: 340 },
  { category: 'Toys', low: 2340, medium: 870, high: 420, critical: 180 },
  { category: 'Sports', low: 1890, medium: 640, high: 280, critical: 120 },
  { category: 'Automotive', low: 1240, medium: 420, high: 180, critical: 90 },
];

// Weekly GMV Trend
export const gmvTrendData = [
  { week: 'W44', gmv: 892000, units: 2340 },
  { week: 'W45', gmv: 1024000, units: 2780 },
  { week: 'W46', gmv: 987000, units: 2560 },
  { week: 'W47', gmv: 1156000, units: 3120 },
  { week: 'W48', gmv: 1284650, units: 3420 },
  { week: 'W49', gmv: 1342000, units: 3680 },
  { week: 'W50', gmv: 1198000, units: 3240 },
];

// Suppression Reasons
export const suppressionReasonsData = [
  { reason: 'Missing Images', count: 542, percentage: 29 },
  { reason: 'Price Issue', count: 421, percentage: 22.5 },
  { reason: 'Missing Attributes', count: 389, percentage: 20.8 },
  { reason: 'Content Violation', count: 287, percentage: 15.3 },
  { reason: 'Quality Score', count: 233, percentage: 12.4 },
];

// Sample Inventory Items
export const sampleInventoryItems: InventoryItem[] = [
  {
    id: 'WM-001',
    upc: '012345678901',
    model: 'XB-2000',
    title: 'Samsung Galaxy Buds Pro - Phantom Black',
    category: 'Electronics',
    condition: 'Open Box',
    facility: 'Dallas DC',
    program: 'Retail Returns',
    quantity: 24,
    cost: 89.99,
    retail: 149.99,
    expectedRecovery: 119.99,
    checkInDate: '2024-11-15',
    listedDate: '2024-11-18',
    agingDays: 45,
    lifecycleStatus: 'Live',
    listingStatus: 'Published',
    views: 1240,
    unitsSold: 12,
    gmv: 1439.88,
    riskLevel: 'Low',
  },
  {
    id: 'WM-002',
    upc: '012345678902',
    model: 'HD-5500',
    title: 'Dyson V15 Detect Cordless Vacuum',
    category: 'Home & Garden',
    condition: 'Refurbished',
    facility: 'Phoenix DC',
    program: 'Overstock',
    quantity: 8,
    cost: 289.99,
    retail: 549.99,
    expectedRecovery: 399.99,
    checkInDate: '2024-10-20',
    listedDate: '2024-10-25',
    agingDays: 71,
    lifecycleStatus: 'Live',
    listingStatus: 'Published',
    views: 890,
    unitsSold: 3,
    gmv: 1199.97,
    riskLevel: 'Medium',
  },
  {
    id: 'WM-003',
    upc: '012345678903',
    model: 'NK-AIR-01',
    title: 'Nike Air Max 270 - Men\'s Size 10',
    category: 'Apparel',
    condition: 'New',
    facility: 'Atlanta DC',
    program: 'Seasonal',
    quantity: 45,
    cost: 65.00,
    retail: 150.00,
    expectedRecovery: 89.99,
    checkInDate: '2024-12-01',
    listedDate: null,
    agingDays: 29,
    lifecycleStatus: 'Processing',
    listingStatus: 'Unpublished',
    views: 0,
    unitsSold: 0,
    gmv: 0,
    riskLevel: 'Medium',
  },
  {
    id: 'WM-004',
    upc: '012345678904',
    model: 'LG-TV-55',
    title: 'LG 55" 4K OLED Smart TV - 2024 Model',
    category: 'Electronics',
    condition: 'Open Box',
    facility: 'Chicago DC',
    program: 'Retail Returns',
    quantity: 3,
    cost: 899.99,
    retail: 1499.99,
    expectedRecovery: 1099.99,
    checkInDate: '2024-09-15',
    listedDate: '2024-09-20',
    agingDays: 106,
    lifecycleStatus: 'Stuck',
    listingStatus: 'Suppressed',
    suppressionReason: 'Missing Images',
    views: 45,
    unitsSold: 0,
    gmv: 0,
    riskLevel: 'Critical',
  },
  {
    id: 'WM-005',
    upc: '012345678905',
    model: 'HS-LEGO-01',
    title: 'LEGO Star Wars Millennium Falcon',
    category: 'Toys',
    condition: 'New',
    facility: 'LA DC',
    program: 'Overstock',
    quantity: 12,
    cost: 124.99,
    retail: 169.99,
    expectedRecovery: 149.99,
    checkInDate: '2024-11-28',
    listedDate: '2024-11-30',
    agingDays: 32,
    lifecycleStatus: 'Live',
    listingStatus: 'Published',
    views: 2340,
    unitsSold: 8,
    gmv: 1199.92,
    riskLevel: 'Low',
  },
];

// Top/Bottom Performers
export const topPerformers = sampleInventoryItems.filter(i => i.unitsSold > 5);
export const bottomPerformers = sampleInventoryItems.filter(i => i.lifecycleStatus === 'Live' && i.unitsSold === 0);

// Actions recommendations
export const actionRecommendations = [
  { action: 'List Now', count: 2340, description: 'Items ready to list' },
  { action: 'Fix Attributes', count: 892, description: 'Missing required data' },
  { action: 'Reprice', count: 1240, description: 'Not competitive' },
  { action: 'Add Images', count: 542, description: 'Missing product images' },
  { action: 'Liquidate', count: 420, description: 'Aged 90+ days' },
];
