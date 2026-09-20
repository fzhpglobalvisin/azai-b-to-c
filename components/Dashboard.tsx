// components/Dashboard.tsx — Layer 4a: Dashboard consuming BI Engine
import React, { useMemo, useState, useEffect } from 'react';
import { SalesRecord, AdvisoryOutput, RiskLevel, Language, DatasetInfo, BIEngineOutput, CustomChartConfig } from '../types';
import CustomChartBuilder from './CustomChartBuilder';
import { computeBI } from '../services/biEngine';
import { 
  ComposedChart,
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { analyzeSalesData } from '../services/gemini';
import { TrendingUp, DollarSign, Target, ShieldAlert, Zap, Loader2, FileSpreadsheet, ArrowRight, AlertTriangle, Sparkles } from 'lucide-react';
import ExecutiveActionPlanCard from './ExecutiveActionPlanCard';
import { ExecutiveActionPlan } from '../types';

interface DashboardProps {
  data: SalesRecord[];
  language: Language;
  highlightedMetric?: string;
  datasetInfo?: DatasetInfo;
  onViewDataset?: () => void;
  biOutput?: BIEngineOutput;
  activeActionPlan?: ExecutiveActionPlan;
  onDismissActionPlan?: () => void;
  onOpenVoiceTester?: () => void;
  customChart?: CustomChartConfig;
  onUpdateCustomChart?: (config: CustomChartConfig) => void;
}

const UI_TRANSLATIONS: Record<string, any> = {
  [Language.ENGLISH]: {
    rootCause: "Root Cause", recommendation: "Recommendation", expectedImpact: "Expected Impact",
    strategicAdvisory: "AI Strategic Advisory", risk: "Risk", loading: "Analyzing data...",
    revenue: "Total Revenue", profit: "Net Profit", outstanding: "Total Outstanding",
    discount: "Avg Discount", trendTitle: "Sales Trend vs Targets", mixTitle: "Product Mix",
    monthlyView: "Monthly Aggregation"
  },
  [Language.URDU]: {
    rootCause: "بنیادی وجہ", recommendation: "تجویز", expectedImpact: "متوقع اثر",
    strategicAdvisory: "مصنوعی ذہانت کی حکمت عملی", risk: "خطرہ", loading: "تجزیہ ہو رہا ہے...",
    revenue: "کل آمدنی", profit: "خالص منافع", outstanding: "کل واجب الادا",
    discount: "اوسط رعایت", trendTitle: "فروخت کا رجحان", mixTitle: "مصنوعات کا مرکب",
    monthlyView: "ماہانہ جائزہ"
  },
  [Language.ARABIC]: {
    rootCause: "السبب الجذري", recommendation: "التوصية", expectedImpact: "الأثر المتوقع",
    strategicAdvisory: "الاستشارة الاستراتيجية", risk: "المخاطر", loading: "جاري التحليل...",
    revenue: "إجمالي الإيرادات", profit: "صافي الربح", outstanding: "إجمالي المبالغ المستحقة",
    discount: "متوسط الخصم", trendTitle: "اتجاه المبيعات", mixTitle: "مزيج المنتجات",
    monthlyView: "عرض شهري"
  },
  [Language.AUTO]: {
    rootCause: "Root Cause", recommendation: "Recommendation", expectedImpact: "Expected Impact",
    strategicAdvisory: "Dynamic AI Advisory", risk: "Risk", loading: "Detecting language & analyzing...",
    revenue: "Total Revenue", profit: "Net Profit", outstanding: "Outstanding",
    discount: "Discount Rate", trendTitle: "Performance Trends", mixTitle: "Product Revenue Distribution",
    monthlyView: "Engine View"
  }
};

const Dashboard: React.FC<DashboardProps> = ({
  data,
  language,
  highlightedMetric,
  datasetInfo,
  onViewDataset,
  biOutput: propBiOutput,
  activeActionPlan,
  onDismissActionPlan,
  onOpenVoiceTester,
  customChart,
  onUpdateCustomChart
}) => {
  const [advisory, setAdvisory] = useState<AdvisoryOutput[]>([]);
  const [loading, setLoading] = useState(false);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS[Language.AUTO];
  const isRtl = language === Language.ARABIC || language === Language.URDU;

  // Single source of truth: consume BI engine output
  const engine = useMemo(() => {
    return propBiOutput || computeBI(data);
  }, [propBiOutput, data]);

  const { kpis, rankings, trends, risk } = engine;

  // Trend series for charts
  const trendData = useMemo(() => {
    if (trends.monthly.length > 0) {
      return trends.monthly.map(m => ({
        name: m.period,
        revenue: m.revenue,
        target: Math.round(m.revenue * 1.1),
      }));
    }
    return trends.daily.slice(-14).map(d => ({
      name: d.date,
      revenue: d.revenue,
      target: Math.round(d.revenue * 1.1),
    }));
  }, [trends]);

  // Product mix for pie chart
  const pieData = useMemo(() => {
    return rankings.topProducts.slice(0, 5).map(p => ({
      name: p.name,
      value: p.revenue,
    }));
  }, [rankings.topProducts]);

  useEffect(() => {
    const fetchAdvisory = async () => {
      if (data.length === 0) return;
      setLoading(true);
      try {
        const prompt = `Provide prioritized strategy for the current segment. Language: ${language}.`;
        const result = await analyzeSalesData(data, prompt, language);
        setAdvisory(result);
      } catch (err) {
        console.error("Advisory fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdvisory();
  }, [data, language]);

  const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

  return (
    <div className={`space-y-6 md:space-y-8 pb-20 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Active Dataset Status Bar */}
      {datasetInfo && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{datasetInfo.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-100 dark:border-indigo-800">
                  {data.length} records analyzed
                </span>
                {datasetInfo.validationSummary && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-100 dark:border-emerald-800">
                    Validated ({datasetInfo.validationSummary.validRows} clean)
                  </span>
                )}
                {datasetInfo.sourceType === 'uploaded' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                    Uploaded {datasetInfo.fileSize ? `(${datasetInfo.fileSize})` : ''}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Last updated: {datasetInfo.uploadedAt} • Calculated metrics powered by BI Engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {onOpenVoiceTester && (
              <button
                onClick={onOpenVoiceTester}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Test Voice Instructions & Generate Action Plans"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Voice & Action Plan</span>
              </button>
            )}
            {onViewDataset && (
              <button
                onClick={onViewDataset}
                className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Inspect Raw Dataset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Generated AI Executive Action Plan & Directive */}
      {activeActionPlan && (
        <ExecutiveActionPlanCard
          plan={activeActionPlan}
          onDismiss={onDismissActionPlan || (() => {})}
          isRtl={isRtl}
        />
      )}

      {/* Risk Alert Strip if engine detected critical alerts */}
      {risk.highRiskAccounts.length > 0 && (
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200 text-xs shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-amber-950 dark:text-amber-300">BI Engine Risk Detection: </span>
            <span className="text-amber-900 dark:text-amber-200">
              {risk.highRiskAccounts.length} customer accounts have critical outstanding balances exceeding threshold. Top exposure:{' '}
              {risk.highRiskAccounts.slice(0, 2).map(a => `${a.customer} ($${Math.round(a.outstanding).toLocaleString()})`).join(', ')}.
            </span>
          </div>
        </div>
      )}

      {/* Top Stats from BI Engine */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          title={t.revenue} 
          value={`$${Math.round(kpis.totalRevenue).toLocaleString()}`} 
          subtext={`${kpis.uniqueCustomers} customers · AOV $${Math.round(kpis.avgOrderValue).toLocaleString()}`}
          icon={<TrendingUp className="w-4 h-4 md:w-5 md:h-5" />} 
          color="text-emerald-600" 
          bg="bg-emerald-50"
          isHighlighted={highlightedMetric === 'revenue'}
        />
        <StatCard 
          title={t.profit} 
          value={`$${Math.round(kpis.grossProfit).toLocaleString()}`} 
          subtext={`${kpis.grossMargin.toFixed(1)}% gross margin`}
          icon={<DollarSign className="w-4 h-4 md:w-5 md:h-5" />} 
          color="text-indigo-600" 
          bg="bg-indigo-50"
          isHighlighted={highlightedMetric === 'profit'}
        />
        <StatCard 
          title={t.outstanding} 
          value={`$${Math.round(kpis.totalOutstanding).toLocaleString()}`} 
          subtext={risk.highRiskAccounts.length > 0 ? `${risk.highRiskAccounts.length} high risk accounts` : 'Normal range'}
          icon={<ShieldAlert className="w-4 h-4 md:w-5 md:h-5" />} 
          color="text-rose-600" 
          bg="bg-rose-50"
          isHighlighted={highlightedMetric === 'outstanding'}
        />
        <StatCard 
          title={t.discount} 
          value={`${kpis.discountRate.toFixed(1)}%`} 
          subtext={`$${Math.round(kpis.totalDiscount).toLocaleString()} total discounts`}
          icon={<Zap className="w-4 h-4 md:w-5 md:h-5" />} 
          color="text-amber-600" 
          bg="bg-amber-50"
          isHighlighted={highlightedMetric === 'discount'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className={`flex items-center justify-between mb-4 md:mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div>
              <h3 className="font-bold text-sm md:text-base text-slate-800 dark:text-slate-100">{t.trendTitle}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Computed by BI Engine time series aggregation</p>
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{t.monthlyView}</span>
          </div>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} reversed={isRtl} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} orientation={isRtl ? 'right' : 'left'} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                <Line type="monotone" dataKey="target" stroke="#cbd5e1" strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">{t.mixTitle}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map((p, i) => (
              <div key={p.name} className={`flex items-center justify-between text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{p.name}</span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">${Math.round(p.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="custom-chart-builder">
        <CustomChartBuilder 
          data={data}
          selectedDimension={customChart?.dimension}
          selectedMeasure={customChart?.measure}
          chartType={customChart?.chartType}
          lastCommand={customChart?.lastCommand}
          explanation={customChart?.explanation}
          onDimensionChange={(dim) => onUpdateCustomChart?.({ ...customChart, dimension: dim })}
          onMeasureChange={(meas) => onUpdateCustomChart?.({ ...customChart, measure: meas })}
          onChartTypeChange={(type) => onUpdateCustomChart?.({ ...customChart, chartType: type })}
          onConfigChange={(cfg) => onUpdateCustomChart?.(cfg)}
        />
      </div>

      <div className="space-y-6">
        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <Zap className="w-5 h-5 text-indigo-500" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.strategicAdvisory}</h3>
          {loading && (
            <div className={`flex items-center gap-2 text-slate-400 text-xs animate-pulse ${isRtl ? 'mr-2' : 'ml-2'}`}>
              <Loader2 className="w-3 h-3 animate-spin" /> {t.loading}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {advisory.length > 0 ? advisory.map((item, idx) => (
            <AdvisoryCard key={idx} item={item} labels={t} isRtl={isRtl} />
          )) : Array.from({length: 3}).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />)}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  subtext?: string; 
  icon: React.ReactNode; 
  color: string; 
  bg: string; 
  isHighlighted?: boolean 
}> = ({ title, value, subtext, icon, color, bg, isHighlighted }) => (
  <div className={`p-4 md:p-6 rounded-2xl shadow-sm border transition-all duration-500 flex items-start gap-3 md:gap-4 ${
    isHighlighted 
      ? 'ring-4 ring-indigo-500 ring-opacity-50 border-indigo-500 scale-105 bg-indigo-50 dark:bg-indigo-950/40 shadow-indigo-100 dark:shadow-none' 
      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
  }`}>
    <div className={`p-2 md:p-3 rounded-xl ${bg} ${color}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] md:text-sm font-medium text-slate-400 dark:text-slate-400 truncate">{title}</p>
      <h4 className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100 mt-0.5 md:mt-1 truncate">{value}</h4>
      {subtext && <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 truncate">{subtext}</p>}
    </div>
  </div>
);

const AdvisoryCard: React.FC<{ item: AdvisoryOutput; labels: any; isRtl: boolean }> = ({ item, labels, isRtl }) => {
  const riskColors = {
    [RiskLevel.LOW]: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800',
    [RiskLevel.MEDIUM]: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800',
    [RiskLevel.HIGH]: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800',
  };
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full hover:shadow-md transition-shadow">
      <div className={`flex justify-between items-start mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wide ${riskColors[item.riskLevel]}`}>{item.riskLevel} {labels.risk}</span>
      </div>
      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2 leading-tight">{item.keyInsight}</h4>
      <div className="mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter mb-1">{labels.rootCause}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{item.rootCause}</p>
      </div>
      <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 space-y-3">
        <div className={`flex items-start gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0"><Target className="w-3.5 h-3.5" /></div>
          <div><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{labels.recommendation}</p><p className="text-xs text-slate-500 dark:text-slate-400">{item.recommendedAction}</p></div>
        </div>
        <div className={`flex items-start gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0"><TrendingUp className="w-3.5 h-3.5" /></div>
          <div><p className="text-xs font-bold text-slate-800 dark:text-slate-200">{labels.expectedImpact}</p><p className="text-xs text-slate-500 dark:text-slate-400">{item.expectedImpact}</p></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
