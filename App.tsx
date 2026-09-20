// App.tsx — 7-Layer BI Pipeline Orchestrator
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SalesRecord, Language, DashboardState, DatasetInfo } from './types';
import Dashboard from './components/Dashboard';
import VoiceAssistant from './components/VoiceAssistant';
import DataUploader from './components/DataUploader';
import HomeView from './components/HomeView';
import BusinessSolutions from './components/BusinessSolutions';
import DatasetExplorer from './components/DatasetExplorer';
import FormatGuideModal from './components/FormatGuideModal';
import VoiceInstructionTesterModal from './components/VoiceInstructionTesterModal';
import PdfInsightsView from './components/PdfInsightsView';
import SocialShareBar from './components/SocialShareBar';
import { LayoutDashboard, FileBarChart, PieChart, Users, Globe, Home, FileSpreadsheet, Filter, Calendar, ArrowUpDown, Target, Sparkles, FileText, Sun, Moon } from 'lucide-react';
import { BusinessSolution } from './types';
import { computeBI } from './services/biEngine';
import { buildAIContext } from './services/aiContextBuilder';

const MOCK_DATA: SalesRecord[] = Array.from({ length: 50 }, (_, i) => ({
  date: `2024-0${(i % 9) + 1}-15`,
  invoiceNo: `INV-${1000 + i}`,
  customerName: ['Acme Corp', 'Global Retail', 'Tech Solutions', 'Peak Systems'][i % 4],
  distributor: ['Distro A', 'Distro B', 'Distro C'][i % 3],
  product: ['Premium Widget', 'Standard Gear', 'Eco Valve', 'Smart Sensor'][i % 4],
  quantity: Math.floor(Math.random() * 100) + 10,
  revenue: Math.floor(Math.random() * 5000) + 1000,
  discount: Math.floor(Math.random() * 500),
  cost: Math.floor(Math.random() * 800) + 200,
  creditDays: [30, 60, 90][i % 3],
  outstandingAmount: Math.floor(Math.random() * 2000),
  region: ['North', 'South', 'East', 'West'][i % 4],
  salesRep: ['Alice', 'Bob', 'Charlie'][i % 3],
}));

const SIDEBAR_LABELS: Record<string, any> = {
  [Language.ENGLISH]: { home: "Home", dash: "Dashboard", reports: "Dataset & Records", dist: "Distributors", pdfInsights: "PDF Insights", subtitle: "Sales Intelligence" },
  [Language.SPANISH]: { home: "Inicio", dash: "Tablero", reports: "Datos y Registros", dist: "Distribuidores", pdfInsights: "Perspectivas PDF", subtitle: "Inteligencia Comercial" },
  [Language.FRENCH]: { home: "Accueil", dash: "Tableau de bord", reports: "Données et Rapports", dist: "Distributeurs", pdfInsights: "Aperçus PDF", subtitle: "Intelligence Commerciale" },
  [Language.URDU]: { home: "ہوم", dash: "ڈیش بورڈ", reports: "ڈیٹا سیٹ اور ریکارڈز", dist: "تقسیم کار", pdfInsights: "پی ڈی ایف بصیرت", subtitle: "سیلز انٹیلی جنس" },
  [Language.ARABIC]: { home: "الرئيسية", dash: "لوحة القيادة", reports: "مجموعة البيانات", dist: "الموزعون", pdfInsights: "رؤى PDF", subtitle: "ذكاء المبيعات" },
  [Language.HINDI]: { home: "होम", dash: "डैशबोर्ड", reports: "डेटासेट और रिकॉर्ड्स", dist: "वितरक", pdfInsights: "पीडीएफ अंतर्दृष्टि", subtitle: "बिक्री इंटेलिजेंस" },
  [Language.AUTO]: { home: "Home", dash: "Dashboard", reports: "Dataset & Records", dist: "Distributors", pdfInsights: "PDF Insights", subtitle: "Multilingual Advisor" },
};

const App: React.FC = () => {
  const [salesData, setSalesData] = useState<SalesRecord[]>(MOCK_DATA);
  const [datasetInfo, setDatasetInfo] = useState<DatasetInfo>({
    name: 'Enterprise FMCG Sales Dataset (Pre-loaded Sample)',
    recordCount: MOCK_DATA.length,
    uploadedAt: 'Pre-loaded Sample Seed',
    sourceType: 'default',
    fileSize: '14.2 KB'
  });
  const [isFormatGuideOpen, setIsFormatGuideOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(Language.AUTO);
  const [selectedSolution, setSelectedSolution] = useState<BusinessSolution | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isVoiceTesterOpen, setIsVoiceTesterOpen] = useState(false);
  
  // Theme state: 'light' | 'dark' for visual ergonomics during long analysis sessions
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('app-theme', theme);
      } catch (e) {}
    }
  }, [theme]);

  const [dashboardState, setDashboardState] = useState<DashboardState>({
    filter: {},
    highlightedMetric: undefined,
    activeTab: 'home'
  });

  const activeTab = dashboardState.activeTab;
  const setActiveTab = (tab: 'home' | 'dashboard' | 'reports' | 'distributors' | 'pdfInsights') => {
    setDashboardState(prev => ({ ...prev, activeTab: tab }));
  };

  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const handleOpenPdfInsights = (file?: File) => {
    if (file) {
      setPendingPdfFile(file);
    }
    setActiveTab('pdfInsights');
  };

  const handleVoiceClose = useCallback(() => {
    setIsVoiceActive(false);
  }, []);

  const handleDataLoaded = (newData: SalesRecord[], info: DatasetInfo) => {
    setSalesData(newData);
    setDatasetInfo(info);
    setDashboardState(prev => ({ ...prev, filter: {}, drillDown: undefined, activeTab: 'dashboard' }));
  };

  const handleResetToSample = () => {
    setSalesData(MOCK_DATA);
    setDatasetInfo({
      name: 'Enterprise FMCG Sales Dataset (Pre-loaded Sample)',
      recordCount: MOCK_DATA.length,
      uploadedAt: 'Pre-loaded Sample Seed',
      sourceType: 'default',
      fileSize: '14.2 KB'
    });
    setDashboardState(prev => ({ ...prev, filter: {}, drillDown: undefined, sortBy: undefined, dateRange: undefined }));
  };

  const handleDownloadTemplate = () => {
    const template = `date,invoiceNo,customerName,distributor,product,quantity,revenue,cost,discount,creditDays,outstandingAmount,region,salesRep
2024-03-01,INV-2001,Acme Industrial,Distro North,Premium Sensor,50,4500,1800,200,30,500,North,Alice
2024-03-02,INV-2002,Global Logistics,Distro South,Standard Gear,100,6200,2400,350,60,1200,South,Bob
2024-03-03,INV-2003,Apex Healthcare,Distro East,Eco Valve,75,3800,1500,100,45,0,East,Charlie
2024-03-04,INV-2004,Metro Transit,Distro West,Smart Module,30,5100,2100,150,30,1500,West,Alice
2024-03-05,INV-2005,Pinnacle Corp,Distro North,Standard Gear,80,4800,1900,250,60,0,North,Bob`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'erp_sales_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort the dataset according to dashboardState
  const filteredData = useMemo(() => {
    let result = salesData.filter(r => {
      const { region, product, distributor, customer } = dashboardState.filter;
      if (region && r.region !== region) return false;
      if (product && r.product !== product) return false;
      if (distributor && r.distributor !== distributor) return false;
      if (customer && r.customerName !== customer) return false;
      
      // Date range filtering
      if (dashboardState.dateRange) {
        if (r.date < dashboardState.dateRange.start || r.date > dashboardState.dateRange.end) {
          return false;
        }
      }
      return true;
    });

    // Dynamic sorting
    if (dashboardState.sortBy) {
      const field = dashboardState.sortBy as keyof SalesRecord;
      const asc = dashboardState.sortDirection === 'asc';
      result = [...result].sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return asc ? valA - valB : valB - valA;
        }
        return asc 
          ? String(valA || '').localeCompare(String(valB || '')) 
          : String(valB || '').localeCompare(String(valA || ''));
      });
    }

    return result;
  }, [salesData, dashboardState.filter, dashboardState.dateRange, dashboardState.sortBy, dashboardState.sortDirection]);

  // ─── Layer 3: BI Calculation Engine ────────────────────────────────
  const biOutput = useMemo(() => {
    return computeBI(filteredData);
  }, [filteredData]);

  // ─── Layer 4b: Rich AI Context Builder ─────────────────────────────
  const dataContext = useMemo(() => {
    return buildAIContext(biOutput, dashboardState);
  }, [biOutput, dashboardState]);

  const labels = SIDEBAR_LABELS[language] || SIDEBAR_LABELS[Language.AUTO];
  const isRtl = language === Language.ARABIC || language === Language.URDU;

  return (
    <div className={`flex h-screen bg-slate-50 overflow-hidden ${isRtl ? 'flex-row-reverse' : 'flex-row'} flex-col md:flex-row`}>
      {/* Sidebar - Hidden on Mobile */}
      <aside className={`hidden md:flex w-64 bg-white border-slate-200 flex-col ${isRtl ? 'border-l' : 'border-r'} ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            Business Strategy Advisor
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">{labels.subtitle}</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'home' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Home className="w-4 h-4" /> {labels.home}
          </button>
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
            <PieChart className="w-4 h-4" /> {labels.dash}
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'reports' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
            <FileBarChart className="w-4 h-4" /> {labels.reports}
          </button>
          <button onClick={() => setActiveTab('distributors')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'distributors' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Users className="w-4 h-4" /> {labels.dist}
          </button>
          <button onClick={() => setActiveTab('pdfInsights')} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'pdfInsights' ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
            <FileText className="w-4 h-4 text-indigo-500" /> {labels.pdfInsights || 'PDF Insights'}
            <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">AI</span>
          </button>
        </nav>

        {/* Sidebar Footer with Visual Ergonomics Theme Toggle & Language */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {/* Light / Dark Mode Toggle */}
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-1 flex items-center justify-between">
              <span>Visual Ergonomics</span>
              <span className="text-[10px] font-semibold text-indigo-500 capitalize">{theme} Mode</span>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Switch to Light Theme"
              >
                <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500 fill-amber-400/20' : 'text-slate-400'}`} />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Switch to Dark Theme (Ergonomic for long analysis sessions)"
              >
                <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400 fill-indigo-400/20' : 'text-slate-400'}`} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          <div className={`flex items-center gap-3 px-2 py-1 text-xs text-slate-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[120px] font-medium">{language}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-auto pb-20 md:pb-0" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Social Media Sharing Bar at the Very Top of the Page */}
        <div className="px-4 md:px-8 pt-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors">
          <SocialShareBar 
            appTitle="AI Business Strategy Advisor & Document Intelligence" 
          />
        </div>

        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto py-1">
            <h2 className="text-base md:text-lg font-semibold text-slate-800 capitalize shrink-0">
              {activeTab === 'home' ? labels.home : activeTab === 'dashboard' ? labels.dash : activeTab === 'reports' ? labels.reports : labels.dist}
            </h2>

            {/* Clickable Dataset Pill */}
            <button
              onClick={() => setActiveTab('reports')}
              className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 transition-all group shrink-0"
              title="Click to view and inspect all rows in this dataset"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-semibold max-w-[100px] sm:max-w-[160px] md:max-w-[200px] truncate">
                {datasetInfo.name}
              </span>
              <span className="px-1.5 py-0.5 bg-white rounded-md text-[10px] font-bold text-indigo-600 shadow-2xs border border-slate-200/60 hidden sm:inline">
                {filteredData.length}/{salesData.length}
              </span>
            </button>

            {/* Active Filters Pill */}
            {Object.keys(dashboardState.filter).length > 0 && (
              <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3 text-indigo-600" />
                <span>Filtered: {Object.entries(dashboardState.filter).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(', ')}</span>
                <button 
                  onClick={() => setDashboardState(prev => ({ ...prev, filter: {} }))} 
                  className="hover:text-indigo-900 ml-1 text-xs"
                  title="Clear filter"
                >
                  ×
                </button>
              </span>
            )}

            {/* Drill Down Pill */}
            {dashboardState.drillDown && (
              <span className="text-[10px] bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shrink-0">
                <Target className="w-3 h-3 text-purple-600" />
                <span>Drill-down: {dashboardState.drillDown.type} = {dashboardState.drillDown.value}</span>
                <button 
                  onClick={() => setDashboardState(prev => ({ ...prev, drillDown: undefined }))} 
                  className="hover:text-purple-900 ml-1 text-xs"
                  title="Clear drill-down"
                >
                  ×
                </button>
              </span>
            )}

            {/* Date Range Pill */}
            {dashboardState.dateRange && (
              <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shrink-0">
                <Calendar className="w-3 h-3 text-blue-600" />
                <span>{dashboardState.dateRange.start} → {dashboardState.dateRange.end}</span>
                <button 
                  onClick={() => setDashboardState(prev => ({ ...prev, dateRange: undefined }))} 
                  className="hover:text-blue-900 ml-1 text-xs"
                  title="Clear date range"
                >
                  ×
                </button>
              </span>
            )}

            {/* Sort Pill */}
            {dashboardState.sortBy && (
              <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3 h-3 text-slate-500" />
                <span>Sorted by {dashboardState.sortBy} ({dashboardState.sortDirection || 'desc'})</span>
                <button 
                  onClick={() => setDashboardState(prev => ({ ...prev, sortBy: undefined, sortDirection: undefined }))} 
                  className="hover:text-slate-900 ml-1 text-xs"
                  title="Clear sort"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          <div className={`flex items-center gap-2 md:gap-3 ${isRtl ? 'flex-row-reverse' : ''} shrink-0 ml-2`}>
            <button
              onClick={() => handleOpenPdfInsights()}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-95 shrink-0 ${
                activeTab === 'pdfInsights'
                  ? 'bg-indigo-600 text-white shadow-indigo-200'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Extract executive insights, risks & metrics from PDF without modifying dataset"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">PDF Insights</span>
            </button>

            <button
              onClick={() => setIsVoiceTesterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
              title="Test Voice AI Commands & Generate Action Plan"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voice Test Lab</span>
            </button>

            <DataUploader 
              onDataLoaded={handleDataLoaded} 
              onOpenFormatGuide={() => setIsFormatGuideOpen(true)}
              onOpenPdfInsights={handleOpenPdfInsights}
            />

            {/* Quick Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
              title={`Toggle ${theme === 'light' ? 'Dark' : 'Light'} Mode for visual ergonomics`}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-600 hover:text-indigo-600 transition-colors" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 fill-amber-400/20" />
              )}
            </button>

            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">JD</div>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {activeTab === 'home' ? (
            <HomeView 
              language={language} 
              onStartVoice={() => setIsVoiceActive(true)} 
              onSelectSolution={setSelectedSolution}
              onOpenPdfInsights={() => handleOpenPdfInsights()}
            />
          ) : activeTab === 'reports' ? (
            <DatasetExplorer
              data={filteredData}
              datasetInfo={datasetInfo}
              onResetToSample={handleResetToSample}
              onOpenUpload={() => {
                const uploaderBtn = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (uploaderBtn) uploaderBtn.click();
              }}
              onOpenFormatGuide={() => setIsFormatGuideOpen(true)}
            />
          ) : activeTab === 'pdfInsights' ? (
            <PdfInsightsView 
              initialFile={pendingPdfFile}
              pdfVoiceAction={dashboardState.pdfVoiceAction}
              onBackToDashboard={() => {
                setPendingPdfFile(null);
                setActiveTab('home');
              }} 
            />
          ) : (
            <Dashboard 
              data={filteredData} 
              language={language} 
              highlightedMetric={dashboardState.highlightedMetric} 
              datasetInfo={datasetInfo}
              biOutput={biOutput}
              activeActionPlan={dashboardState.activeActionPlan}
              onDismissActionPlan={() => setDashboardState(prev => ({ ...prev, activeActionPlan: undefined }))}
              onOpenVoiceTester={() => setIsVoiceTesterOpen(true)}
              customChart={dashboardState.customChart}
              onUpdateCustomChart={(cfg) => setDashboardState(prev => ({ ...prev, customChart: cfg }))}
              onViewDataset={() => setActiveTab('reports')}
            />
          )}
        </div>

        <VoiceAssistant 
          language={language} 
          dataContext={dataContext} 
          onUpdateDashboard={setDashboardState}
          externalActive={isVoiceActive}
          onExternalClose={handleVoiceClose}
        />

        <VoiceInstructionTesterModal
          isOpen={isVoiceTesterOpen}
          onClose={() => setIsVoiceTesterOpen(false)}
          data={filteredData}
          biOutput={biOutput}
          language={language}
          onUpdateDashboard={setDashboardState}
          datasetInfo={datasetInfo}
        />

        <BusinessSolutions 
          isOpen={!!selectedSolution} 
          onClose={() => setSelectedSolution(null)} 
          solution={selectedSolution} 
        />

        <FormatGuideModal
          isOpen={isFormatGuideOpen}
          onClose={() => setIsFormatGuideOpen(false)}
          onDownloadTemplate={handleDownloadTemplate}
        />

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around h-16 px-2 z-30">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">{labels.home}</span>
          </button>
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <PieChart className="w-5 h-5" />
            <span className="text-[10px] font-medium">{labels.dash}</span>
          </button>
          <button onClick={() => setActiveTab('pdfInsights')} className={`flex flex-col items-center gap-1 ${activeTab === 'pdfInsights' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">PDF</span>
          </button>
          <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 ${activeTab === 'reports' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <FileBarChart className="w-5 h-5" />
            <span className="text-[10px] font-medium">{labels.reports}</span>
          </button>
          <button onClick={() => setActiveTab('distributors')} className={`flex flex-col items-center gap-1 ${activeTab === 'distributors' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">{labels.dist}</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default App;