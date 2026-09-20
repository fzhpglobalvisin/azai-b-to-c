
export type DynamicRecord = Record<string, any>;

// SalesRecord is now dynamically typed to represent any user dataset columns
export type SalesRecord = DynamicRecord;

export interface DatasetSchema {
  columns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
}

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface AdvisoryOutput {
  keyInsight: string;
  rootCause: string;
  riskLevel: RiskLevel;
  recommendedAction: string;
  expectedImpact: string;
}

export interface BusinessSolution {
  id: string;
  title: string;
  description: string;
  icon: string;
  details: string[];
}

// ─── Layer 1: Data Loader ────────────────────────────────────────────

export interface LoaderResult {
  rows: Record<string, unknown>[];
  metadata: LoaderMetadata;
}

export interface LoaderMetadata {
  fileName: string;
  fileSize: string;
  format: 'csv' | 'tsv' | 'json' | 'xlsx' | 'xls' | 'sap-csv' | 'pdf' | 'image' | 'zip';
  sheetNames?: string[];
  rawRowCount: number;
  detectedDelimiter?: string;
}

// ─── Layer 2: Validation ─────────────────────────────────────────────

export interface ValidationResult {
  valid: SalesRecord[];
  schema: DatasetSchema;
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
  summary: ValidationSummary;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  autoFixedFields: number;
}

export interface ValidationIssue {
  row: number;
  field: string;
  value: unknown;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
  autoFixed?: boolean;
  fixedValue?: unknown;
}

// ─── Layer 3: BI Calculation Engine ──────────────────────────────────

export interface BIEngineOutput {
  kpis: BIKpis;
  trends: BITrends;
  rankings: BIRankings;
  risk: BIRiskAnalysis;
  distributors: BIDistributorAnalysis;
}

export interface BIKpis {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  totalDiscount: number;
  discountRate: number;
  totalOutstanding: number;
  avgOrderValue: number;
  totalQuantity: number;
  uniqueCustomers: number;
  uniqueProducts: number;
}

export interface BITrends {
  monthly: { period: string; revenue: number; cost: number; profit: number; orders: number }[];
  daily: { date: string; revenue: number; orders: number }[];
}

export interface BIRankings {
  topProducts: { name: string; revenue: number; quantity: number; margin: number }[];
  topCustomers: { name: string; revenue: number; orders: number; outstanding: number }[];
  topDistributors: { name: string; revenue: number; orders: number }[];
  regionBreakdown: { region: string; revenue: number; profit: number; share: number }[];
}

export interface BIRiskAnalysis {
  highRiskAccounts: { customer: string; outstanding: number; creditDays: number; revenue: number }[];
  overDiscounted: { invoiceNo: string; product: string; discount: number; revenue: number; discountPct: number }[];
  concentrationRisk: { topCustomerShare: number; topProductShare: number };
}

export interface BIDistributorAnalysis {
  performance: { name: string; revenue: number; customers: number; avgOrderValue: number; outstandingRatio: number }[];
}

// ─── Layer 4: Dashboard State ────────────────────────────────────────

export interface DashboardFilter {
  [key: string]: string | undefined;
  region?: string;
  product?: string;
  distributor?: string;
  customer?: string;
}

export interface ActionItem {
  id: string;
  task: string;
  owner?: string;
  priority: 'Immediate' | 'High' | 'Medium' | 'Low';
  expectedRoi: string;
  deadline?: string;
  completed?: boolean;
}

export interface ExecutiveActionPlan {
  id: string;
  timestamp: string;
  triggeredBy: string;
  conclusion: string;
  rootCause?: string;
  riskLevel: RiskLevel;
  recommendations: string[];
  actionItems: ActionItem[];
}

export interface CustomChartConfig {
  dimension?: string;
  measure?: string;
  chartType?: 'bar' | 'line' | 'area' | 'pie';
  lastCommand?: string;
  explanation?: string;
}

export interface PdfVoiceAction {
  type: 'route' | 'select_document' | 'switch_tab' | 'scroll_page';
  documentIndex?: number;
  documentTitle?: string;
  outputTab?: 'summary' | 'strategies' | 'actions' | 'risks' | 'qna';
  pageNumber?: number;
  timestamp: number;
}

export interface DashboardState {
  filter: DashboardFilter;
  highlightedMetric?: 'revenue' | 'profit' | 'outstanding' | 'discount';
  activeTab: 'home' | 'dashboard' | 'reports' | 'distributors' | 'pdfInsights';
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  drillDown?: { type: 'customer' | 'product' | 'region' | 'distributor'; value: string };
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  customChart?: CustomChartConfig;
  dateRange?: { start: string; end: string };
  comparison?: { type: 'region' | 'product' | 'distributor'; values: [string, string] };
  activeActionPlan?: ExecutiveActionPlan;
  pdfVoiceAction?: PdfVoiceAction;
}

export interface DocumentPage {
  pageNumber: number;
  content: string;
  title?: string;
}

export interface PdfStrategyItem {
  id: string;
  title: string;
  description: string;
  pageNumber?: number;
  referenceQuote?: string;
  impact?: string;
}

export interface PdfActionItem {
  id: string;
  task: string;
  priority: 'Immediate' | 'High' | 'Medium' | 'Low';
  owner?: string;
  expectedRoi: string;
  pageNumber?: number;
  referenceQuote?: string;
  completed?: boolean;
}

export interface PdfKeyMetric {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  context?: string;
  pageNumber?: number;
  referenceQuote?: string;
}

export interface PdfRiskItem {
  risk: string;
  severity: RiskLevel;
  impact?: string;
  mitigation?: string;
  pageNumber?: number;
  referenceQuote?: string;
}

export interface PdfInsightReport {
  id: string;
  fileName: string;
  fileSize: string;
  analyzedAt: string;
  documentType: string;
  pageCount: number;
  pages: DocumentPage[];
  executiveSummary: string;
  keyMetrics: PdfKeyMetric[];
  strategies: PdfStrategyItem[];
  strategicInsights: string[];
  risksAndGovernance: PdfRiskItem[];
  recommendedActions: PdfActionItem[];
  overallRiskLevel: RiskLevel;
  topics?: string[];
  rawTextPreview?: string;
  base64Data?: string;
}

export interface PdfQnAPair {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

export interface DatasetInfo {
  name: string;
  recordCount: number;
  uploadedAt: string;
  sourceType: 'default' | 'uploaded' | 'empty';
  fileSize?: string;
  validationSummary?: ValidationSummary;
  schema?: DatasetSchema;
}

export enum Language {
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  FRENCH = 'French',
  URDU = 'Urdu',
  ARABIC = 'Arabic',
  HINDI = 'Hindi',
  AUTO = 'Auto-Detect'
}
