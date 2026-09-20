// services/aiContextBuilder.ts — Pure Dynamic AI Context Builder
// Translates the user's REAL dataset schema, columns, metrics, and records into rich context for Gemini.
// Strictly enforces zero mock column names.

import { BIEngineOutput, DashboardState, DatasetInfo, SalesRecord } from '../types';

export function buildAIContext(
  engine: BIEngineOutput, 
  dashboardState: DashboardState, 
  datasetInfo?: DatasetInfo,
  rawData?: SalesRecord[]
): string {
  const { kpis, trends, rankings, risk, distributors } = engine;
  const filters = dashboardState.filter;
  const sections: string[] = [];

  const data = rawData || [];
  const schema = datasetInfo?.schema;
  const columns = schema?.columns || (data.length > 0 ? Object.keys(data[0]) : []);
  const numericColumns = schema?.numericColumns || [];
  const categoricalColumns = schema?.categoricalColumns || [];
  const dateColumns = schema?.dateColumns || [];

  // ─── Real Schema Header ───────────────────────────────────────────
  sections.push(`REAL DATASET SCHEMA (EXTRACTED DIRECTLY FROM USER FILE):
Dataset Name: ${datasetInfo?.name || 'User Uploaded Dataset'}
Total Records: ${data.length.toLocaleString()}
All Column Names: [${columns.join(', ')}]
Numeric Measure Columns: [${numericColumns.join(', ')}]
Categorical Dimension Columns: [${categoricalColumns.join(', ')}]
Date Columns: [${dateColumns.join(', ')}]`);

  // ─── Real Column Metrics ──────────────────────────────────────────
  if (numericColumns.length > 0 && data.length > 0) {
    const metricSummaries = numericColumns.slice(0, 8).map(col => {
      const nums = data.map(r => Number(r[col]) || 0);
      const total = nums.reduce((a, b) => a + b, 0);
      const avg = total / nums.length;
      const max = Math.max(...nums);
      const min = Math.min(...nums);
      return `- Column "${col}": Total = ${Math.round(total).toLocaleString()} | Avg = ${Math.round(avg).toLocaleString()} | Min = ${Math.round(min).toLocaleString()} | Max = ${Math.round(max).toLocaleString()}`;
    });
    sections.push(`REAL NUMERIC MEASURES SUMMARY:\n${metricSummaries.join('\n')}`);
  }

  // ─── Real Dimension Breakdowns ────────────────────────────────────
  if (categoricalColumns.length > 0 && data.length > 0) {
    const primaryMetric = numericColumns[0];
    const dimSummaries = categoricalColumns.slice(0, 5).map(col => {
      const map = new Map<string, number>();
      data.forEach(r => {
        const val = String(r[col] || 'Unassigned');
        const metricVal = primaryMetric ? (Number(r[primaryMetric]) || 0) : 1;
        map.set(val, (map.get(val) || 0) + metricVal);
      });
      const topItems = Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => primaryMetric ? `${k} (${primaryMetric}: ${Math.round(v).toLocaleString()})` : `${k} (${v} records)`)
        .join(', ');
      return `- Dimension "${col}" Top Values: ${topItems}`;
    });
    sections.push(`REAL CATEGORICAL DIMENSIONS BREAKDOWN:\n${dimSummaries.join('\n')}`);
  }

  // ─── Active Filters & State ───────────────────────────────────────
  const activeFilters = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k} = "${v}"`);

  if (activeFilters.length > 0) {
    sections.push(`ACTIVE USER FILTERS: ${activeFilters.join(', ')}. All figures reflect this filtered segment.`);
  }

  if (dashboardState.customChart) {
    sections.push(`CURRENT CUSTOM CHART CONFIGURATION:
- X-Axis Dimension: "${dashboardState.customChart.dimension || 'None'}"
- Y-Axis Measure: "${dashboardState.customChart.measure || 'None'}"
- Chart Type: "${dashboardState.customChart.chartType || 'bar'}"
- Last Command: "${dashboardState.customChart.lastCommand || 'Manual'}"`);
  }

  // ─── Engine Aggregations (Only if relevant) ───────────────────────
  if (kpis.totalRevenue > 0) {
    sections.push(`CALCULATED PERFORMANCE TOTALS:
- Total Primary Measure: ${fmt(kpis.totalRevenue)}
- Total Secondary Measure: ${fmt(kpis.totalCost)}
- Net Profit / Margin: ${fmt(kpis.grossProfit)} (${kpis.grossMargin.toFixed(1)}%)
- Total Count / Volume: ${fmt(kpis.totalQuantity)}`);
  }

  if (trends.monthly.length > 1) {
    const recent = trends.monthly.slice(-6);
    const trendStr = recent.map(m => `${m.period}: ${fmt(m.revenue)}`).join(' | ');
    sections.push(`TIME SERIES TRENDS: ${trendStr}`);
  }

  // ─── CRITICAL CONSTRAINT FOR AI ADVISOR ───────────────────────────
  sections.push(`CRITICAL ANTI-HALLUCINATION INSTRUCTIONS:
1. You MUST ONLY reference the actual column names present in this dataset: [${columns.join(', ')}].
2. NEVER mention or assume mock column names (e.g., do NOT invent "distributor", "region", "product", "salesRep", "outstanding", "discount", "invoiceNo" unless those exact column names are listed above).
3. Always formulate your verbal advice, insights, and chart suggestions strictly around the user's real columns and values.`);

  return sections.join('\n\n');
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString();
}
