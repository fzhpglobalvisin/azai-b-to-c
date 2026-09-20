// services/biEngine.ts — Dynamic BI Calculation Engine
// Adapts automatically to the actual columns present in any user dataset. Zero hardcoded mock column requirements.

import { SalesRecord, BIEngineOutput, BIKpis, BITrends, BIRankings, BIRiskAnalysis, BIDistributorAnalysis } from '../types';

// ─── Helpers to detect relevant dynamic keys from records ─────────────

interface DynamicColumnMapping {
  metricKey: string;
  costKey: string;
  discountKey: string;
  outstandingKey: string;
  quantityKey: string;
  dateKey: string;
  primaryCategoryKey: string;
  secondaryCategoryKey: string;
  distributorKey: string;
  regionKey: string;
}

function detectColumns(data: SalesRecord[]): DynamicColumnMapping {
  if (data.length === 0) {
    return {
      metricKey: '',
      costKey: '',
      discountKey: '',
      outstandingKey: '',
      quantityKey: '',
      dateKey: '',
      primaryCategoryKey: '',
      secondaryCategoryKey: '',
      distributorKey: '',
      regionKey: '',
    };
  }

  const allKeys = Object.keys(data[0] || {});
  const lowerMap = new Map<string, string>();
  allKeys.forEach(k => lowerMap.set(k.toLowerCase().replace(/[^a-z0-9]/g, ''), k));

  const findKey = (patterns: string[]): string => {
    for (const p of patterns) {
      for (const [norm, orig] of lowerMap.entries()) {
        if (norm === p || norm.includes(p)) return orig;
      }
    }
    return '';
  };

  // Detect numeric columns
  const numericKeys = allKeys.filter(k => {
    const val = data[0]?.[k];
    return typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null);
  });

  // Metric key (revenue, amount, sales, total, value, or first numeric column)
  const metricKey = findKey(['revenue', 'amount', 'sales', 'total', 'turnover', 'price', 'val', 'grandtotal']) || numericKeys[0] || '';
  const costKey = findKey(['cost', 'cogs', 'expense', 'purchaseprice', 'buyprice', 'fee']);
  const discountKey = findKey(['discount', 'rebate', 'deduction']);
  const outstandingKey = findKey(['outstanding', 'due', 'debt', 'receivable', 'balance', 'unpaid']);
  const quantityKey = findKey(['quantity', 'qty', 'units', 'volume', 'count', 'pcs']) || (numericKeys.length > 1 && numericKeys[1] !== metricKey ? numericKeys[1] : '');

  // Categorical keys
  const nonNumericKeys = allKeys.filter(k => k !== metricKey && k !== costKey && k !== discountKey && k !== outstandingKey && k !== quantityKey);

  const dateKey = findKey(['date', 'time', 'day', 'month', 'year', 'period', 'timestamp', 'createdat']);
  const primaryCategoryKey = findKey(['product', 'item', 'service', 'category', 'sku', 'treatment', 'description', 'title']) || nonNumericKeys[0] || '';
  const secondaryCategoryKey = findKey(['customer', 'client', 'account', 'patient', 'buyer', 'name', 'user']) || (nonNumericKeys.length > 1 ? nonNumericKeys[1] : '');
  const regionKey = findKey(['region', 'zone', 'territory', 'city', 'location', 'country', 'state', 'branch']) || (nonNumericKeys.length > 2 ? nonNumericKeys[2] : '');
  const distributorKey = findKey(['distributor', 'vendor', 'partner', 'channel', 'supplier', 'doctor', 'rep', 'salesrep']) || (nonNumericKeys.length > 3 ? nonNumericKeys[3] : '');

  return {
    metricKey,
    costKey,
    discountKey,
    outstandingKey,
    quantityKey,
    dateKey,
    primaryCategoryKey,
    secondaryCategoryKey,
    distributorKey,
    regionKey,
  };
}

// ─── Public API ──────────────────────────────────────────────────────

export function computeBI(data: SalesRecord[]): BIEngineOutput {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      kpis: {
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
        grossMargin: 0,
        totalDiscount: 0,
        discountRate: 0,
        totalOutstanding: 0,
        avgOrderValue: 0,
        totalQuantity: 0,
        uniqueCustomers: 0,
        uniqueProducts: 0,
      },
      trends: { monthly: [], daily: [] },
      rankings: { topProducts: [], topCustomers: [], topDistributors: [], regionBreakdown: [] },
      risk: { highRiskAccounts: [], overDiscounted: [], concentrationRisk: { topCustomerShare: 0, topProductShare: 0 } },
      distributors: { performance: [] },
    };
  }

  const mapping = detectColumns(data);

  return {
    kpis: computeKpis(data, mapping),
    trends: computeTrends(data, mapping),
    rankings: computeRankings(data, mapping),
    risk: computeRisk(data, mapping),
    distributors: computeDistributors(data, mapping),
  };
}

// ─── Core KPIs ───────────────────────────────────────────────────────

function computeKpis(data: SalesRecord[], m: DynamicColumnMapping): BIKpis {
  const totalRevenue = m.metricKey ? data.reduce((sum, r) => sum + (Number(r[m.metricKey]) || 0), 0) : 0;
  const totalCost = m.costKey ? data.reduce((sum, r) => sum + (Number(r[m.costKey]) || 0), 0) : 0;
  const totalDiscount = m.discountKey ? data.reduce((sum, r) => sum + (Number(r[m.discountKey]) || 0), 0) : 0;
  const totalOutstanding = m.outstandingKey ? data.reduce((sum, r) => sum + (Number(r[m.outstandingKey]) || 0), 0) : 0;
  const totalQuantity = m.quantityKey ? data.reduce((sum, r) => sum + (Number(r[m.quantityKey]) || 0), 0) : data.length;

  const grossProfit = totalCost > 0 ? (totalRevenue - totalCost - totalDiscount) : totalRevenue;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const discountRate = totalRevenue > 0 ? (totalDiscount / totalRevenue) * 100 : 0;
  const avgOrderValue = data.length > 0 ? totalRevenue / data.length : 0;

  const uniqueCustomers = m.secondaryCategoryKey ? new Set(data.map(r => r[m.secondaryCategoryKey])).size : 0;
  const uniqueProducts = m.primaryCategoryKey ? new Set(data.map(r => r[m.primaryCategoryKey])).size : 0;

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    grossMargin,
    totalDiscount,
    discountRate,
    totalOutstanding,
    avgOrderValue,
    totalQuantity,
    uniqueCustomers,
    uniqueProducts,
  };
}

// ─── Time Series ─────────────────────────────────────────────────────

function computeTrends(data: SalesRecord[], m: DynamicColumnMapping): BITrends {
  if (!m.dateKey) return { monthly: [], daily: [] };

  const monthlyMap = new Map<string, { revenue: number; cost: number; profit: number; orders: number }>();
  const dailyMap = new Map<string, { revenue: number; orders: number }>();

  for (const r of data) {
    const rawDate = String(r[m.dateKey] || '');
    if (!rawDate) continue;

    const period = rawDate.slice(0, 7); // YYYY-MM
    const rev = m.metricKey ? (Number(r[m.metricKey]) || 0) : 1;
    const cost = m.costKey ? (Number(r[m.costKey]) || 0) : 0;
    const disc = m.discountKey ? (Number(r[m.discountKey]) || 0) : 0;

    const existMonthly = monthlyMap.get(period) || { revenue: 0, cost: 0, profit: 0, orders: 0 };
    existMonthly.revenue += rev;
    existMonthly.cost += cost;
    existMonthly.profit += (rev - cost - disc);
    existMonthly.orders += 1;
    monthlyMap.set(period, existMonthly);

    const existDaily = dailyMap.get(rawDate) || { revenue: 0, orders: 0 };
    existDaily.revenue += rev;
    existDaily.orders += 1;
    dailyMap.set(rawDate, existDaily);
  }

  const monthly = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, vals]) => ({ period, ...vals }));

  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }));

  return { monthly, daily };
}

// ─── Rankings & Breakdowns ───────────────────────────────────────────

function computeRankings(data: SalesRecord[], m: DynamicColumnMapping): BIRankings {
  const totalRevenue = m.metricKey ? data.reduce((sum, r) => sum + (Number(r[m.metricKey]) || 0), 0) : 0;

  // Primary Category Rankings (e.g. Products, Items, Services)
  const topProducts = m.primaryCategoryKey ? (() => {
    const map = new Map<string, { revenue: number; quantity: number; cost: number; discount: number }>();
    for (const r of data) {
      const key = String(r[m.primaryCategoryKey] || 'Unassigned');
      const rev = m.metricKey ? (Number(r[m.metricKey]) || 0) : 1;
      const qty = m.quantityKey ? (Number(r[m.quantityKey]) || 0) : 1;
      const cost = m.costKey ? (Number(r[m.costKey]) || 0) : 0;
      const disc = m.discountKey ? (Number(r[m.discountKey]) || 0) : 0;

      const existing = map.get(key) || { revenue: 0, quantity: 0, cost: 0, discount: 0 };
      existing.revenue += rev;
      existing.quantity += qty;
      existing.cost += cost;
      existing.discount += disc;
      map.set(key, existing);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        revenue: v.revenue,
        quantity: v.quantity,
        margin: v.revenue > 0 ? ((v.revenue - v.cost - v.discount) / v.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  })() : [];

  // Secondary Category Rankings (e.g. Customers, Clients, Accounts)
  const topCustomers = m.secondaryCategoryKey ? (() => {
    const map = new Map<string, { revenue: number; orders: number; outstanding: number }>();
    for (const r of data) {
      const key = String(r[m.secondaryCategoryKey] || 'Unassigned');
      const rev = m.metricKey ? (Number(r[m.metricKey]) || 0) : 1;
      const out = m.outstandingKey ? (Number(r[m.outstandingKey]) || 0) : 0;

      const existing = map.get(key) || { revenue: 0, orders: 0, outstanding: 0 };
      existing.revenue += rev;
      existing.orders += 1;
      existing.outstanding += out;
      map.set(key, existing);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  })() : [];

  // Tertiary Category Rankings (Distributors / Partners / Reps)
  const topDistributors = m.distributorKey ? (() => {
    const map = new Map<string, { revenue: number; orders: number }>();
    for (const r of data) {
      const key = String(r[m.distributorKey] || 'Unassigned');
      const rev = m.metricKey ? (Number(r[m.metricKey]) || 0) : 1;
      const existing = map.get(key) || { revenue: 0, orders: 0 };
      existing.revenue += rev;
      existing.orders += 1;
      map.set(key, existing);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  })() : [];

  // Region / Geographic Breakdown
  const regionBreakdown = m.regionKey ? (() => {
    const map = new Map<string, { revenue: number; profit: number }>();
    for (const r of data) {
      const key = String(r[m.regionKey] || 'Unassigned');
      const rev = m.metricKey ? (Number(r[m.metricKey]) || 0) : 1;
      const cost = m.costKey ? (Number(r[m.costKey]) || 0) : 0;
      const disc = m.discountKey ? (Number(r[m.discountKey]) || 0) : 0;

      const existing = map.get(key) || { revenue: 0, profit: 0 };
      existing.revenue += rev;
      existing.profit += (rev - cost - disc);
      map.set(key, existing);
    }
    return Array.from(map.entries())
      .map(([region, v]) => ({
        region,
        revenue: v.revenue,
        profit: v.profit,
        share: totalRevenue > 0 ? (v.revenue / totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  })() : [];

  return {
    topProducts,
    topCustomers,
    topDistributors,
    regionBreakdown,
  };
}

// ─── Risk Analysis ───────────────────────────────────────────────────

function computeRisk(data: SalesRecord[], m: DynamicColumnMapping): BIRiskAnalysis {
  const totalRevenue = m.metricKey ? data.reduce((sum, r) => sum + (Number(r[m.metricKey]) || 0), 0) : 0;

  // High Risk Accounts (by outstanding balance if available)
  const highRiskAccounts = m.outstandingKey && m.secondaryCategoryKey ? (() => {
    const map = new Map<string, { outstanding: number; revenue: number }>();
    for (const r of data) {
      const cust = String(r[m.secondaryCategoryKey] || 'Unassigned');
      const out = Number(r[m.outstandingKey]) || 0;
      const rev = m.metricKey ? (Number(r[m.metricKey]) || 0) : 0;

      const existing = map.get(cust) || { outstanding: 0, revenue: 0 };
      existing.outstanding += out;
      existing.revenue += rev;
      map.set(cust, existing);
    }
    return Array.from(map.entries())
      .filter(([, v]) => v.outstanding > 0)
      .map(([customer, v]) => ({
        customer,
        outstanding: v.outstanding,
        creditDays: 30,
        revenue: v.revenue,
      }))
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 10);
  })() : [];

  // Over-discounted transactions
  const overDiscounted = m.discountKey && m.metricKey ? (() => {
    return data
      .filter(r => {
        const rev = Number(r[m.metricKey]) || 0;
        const disc = Number(r[m.discountKey]) || 0;
        return rev > 0 && (disc / rev) > 0.15;
      })
      .slice(0, 10)
      .map((r, i) => {
        const rev = Number(r[m.metricKey]) || 0;
        const disc = Number(r[m.discountKey]) || 0;
        return {
          invoiceNo: String(r.invoiceNo || r.id || `Row-${i + 1}`),
          product: String(r[m.primaryCategoryKey] || 'Item'),
          discount: disc,
          revenue: rev,
          discountPct: rev > 0 ? (disc / rev) * 100 : 0,
        };
      });
  })() : [];

  // Concentration risk
  const topCustomerRevenue = highRiskAccounts[0]?.revenue || 0;
  const topCustomerShare = totalRevenue > 0 ? (topCustomerRevenue / totalRevenue) * 100 : 0;

  return {
    highRiskAccounts,
    overDiscounted,
    concentrationRisk: {
      topCustomerShare,
      topProductShare: 0,
    },
  };
}

// ─── Distributor / Partner Analysis ──────────────────────────────────

function computeDistributors(data: SalesRecord[], m: DynamicColumnMapping): BIDistributorAnalysis {
  if (!m.distributorKey) return { performance: [] };

  const map = new Map<string, { revenue: number; customers: Set<string>; orders: number; outstanding: number }>();
  for (const r of data) {
    const dist = String(r[m.distributorKey] || 'Unassigned');
    const rev = m.metricKey ? (Number(r[m.metricKey]) || 0) : 1;
    const cust = m.secondaryCategoryKey ? String(r[m.secondaryCategoryKey] || '') : '';
    const out = m.outstandingKey ? (Number(r[m.outstandingKey]) || 0) : 0;

    const existing = map.get(dist) || { revenue: 0, customers: new Set(), orders: 0, outstanding: 0 };
    existing.revenue += rev;
    existing.orders += 1;
    existing.outstanding += out;
    if (cust) existing.customers.add(cust);
    map.set(dist, existing);
  }

  const performance = Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      revenue: v.revenue,
      customers: v.customers.size || v.orders,
      avgOrderValue: v.orders > 0 ? v.revenue / v.orders : 0,
      outstandingRatio: v.revenue > 0 ? (v.outstanding / v.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return { performance };
}
