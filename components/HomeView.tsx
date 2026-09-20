import React from 'react';
import { Mic, Zap, Target, Users, TrendingUp, Globe, ArrowRight, Play, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';
import { BusinessSolution, Language } from '../types';

interface HomeViewProps {
  onStartVoice: () => void;
  onSelectSolution: (solution: BusinessSolution) => void;
  language: Language;
  onOpenPdfInsights?: () => void;
}

const SOLUTIONS: BusinessSolution[] = [
  {
    id: 'acq',
    title: 'Customer Acquisition',
    description: 'Leverage AI-driven targeting to identify high-value prospects and optimize your conversion funnel.',
    icon: 'target',
    details: [
      'Predictive lead scoring based on historical ERP data',
      'Automated outreach personalization using Gemini',
      'Multi-channel campaign performance tracking',
      'Competitor market share analysis'
    ]
  },
  {
    id: 'rev',
    title: 'Revenue Optimization',
    description: 'Maximize your bottom line through dynamic pricing models and intelligent cross-selling strategies.',
    icon: 'trending',
    details: [
      'Elasticity-based dynamic pricing suggestions',
      'Basket analysis for effective cross-selling',
      'Churn prediction and retention automation',
      'Seasonal demand forecasting'
    ]
  },
  {
    id: 'exp',
    title: 'Market Expansion',
    description: 'Identify untapped regional opportunities and scale your operations with data-backed confidence.',
    icon: 'globe',
    details: [
      'Geographic whitespace identification',
      'Local distributor performance benchmarking',
      'Regulatory and compliance risk mapping',
      'Logistics optimization for new territories'
    ]
  }
];

const HomeView: React.FC<HomeViewProps> = ({ 
  onStartVoice, 
  onSelectSolution, 
  language,
  onOpenPdfInsights 
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-12 md:space-y-20 py-6 md:py-12 px-4">
      {/* Hero Section */}
      <section className="text-center space-y-6 md:space-y-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full md:w-[600px] h-[400px] md:h-[600px] bg-indigo-100 rounded-full blur-[80px] md:blur-[120px] -z-10 opacity-50" />
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs md:text-sm font-bold animate-bounce">
          <Zap className="w-3 h-3 md:w-4 md:h-4 fill-current" />
          AI-Powered Business Intelligence
        </div>
        
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
          <span className="text-transparent 
           bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">AI Business Advisor </span>
        </h1>

        <div className="flex justify-center py-4">
          <button 
            onClick={onStartVoice}
            className="relative w-56 h-56 md:w-72 md:h-72 group/mic transition-transform hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 bg-indigo-600 rounded-full animate-ping opacity-10 group-hover/mic:opacity-20" />
            <div className="absolute inset-4 bg-indigo-500 rounded-full animate-pulse opacity-20 group-hover/mic:opacity-30" />
            <div className="absolute inset-8 bg-indigo-400 rounded-full opacity-30 group-hover/mic:opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-36 h-36 md:w-48 md:h-48 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 md:border-8 border-indigo-50 group-hover/mic:border-indigo-100 transition-colors">
                <Mic className="w-14 h-14 md:w-20 md:h-20 text-indigo-600 group-hover/mic:text-indigo-700 transition-colors" />
              </div>
            </div>
          </button>
        </div>
        
        <p className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Talk to our advanced AI advisor to unlock hidden growth opportunities, optimize your sales funnel, and dominate your market.
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 pt-4 md:pt-8">
          <button 
            onClick={onStartVoice}
            className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <Mic className="w-5 h-5 text-white" />
            <span>Start Voice Advisor</span>
          </button>

          {onOpenPdfInsights && (
            <button
              onClick={onOpenPdfInsights}
              className="w-full md:w-auto px-8 py-4 bg-white text-slate-800 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-2xl font-bold text-base shadow-sm transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <FileText className="w-5 h-5 text-rose-500" />
              <span>PDF & Text Insights</span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Standalone</span>
            </button>
          )}
        </div>
      </section>

      {/* Voice Agent Features Section */}
      <section className="relative group">
        <div className="absolute inset-0 bg-indigo-600 rounded-[32px] md:rounded-[40px] rotate-1 scale-[1.02] opacity-5 group-hover:rotate-0 transition-transform duration-500" />
        <div className="relative bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] p-6 md:p-12 shadow-xl flex flex-col md:flex-row items-center gap-8 md:gap-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-indigo-50 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl md:blur-3xl" />
          
          <div className="w-full md:w-2/3 space-y-4 md:space-y-6 relative z-10">
            <button 
              onClick={onStartVoice}
              className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-110 transition-all active:scale-95"
            >
              <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </button>
            <button 
              onClick={onStartVoice}
              className="text-left group/text"
            >
              <h2 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight group-hover/text:text-indigo-600 transition-colors">
                The AI Advisor that <br /> understands your business.
              </h2>
            </button>
            <p className="text-sm md:text-lg text-slate-600">
              Our voice agent doesn't just talk; it analyzes your real-time ERP data, identifies risks, and suggests immediate actions in your preferred language.
            </p>
          </div>
          
          <div className="w-full md:w-1/3 space-y-4 relative z-10">
            <ul className="space-y-3 md:space-y-4">
              {['Real-time ERP Data Analysis', 'Multilingual Support', 'Actionable Insights'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 text-sm md:text-base font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Zap className="w-3 h-3 fill-current" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Business Solutions Grid */}
      <section className="space-y-8 md:space-y-12">
        <div className="text-center space-y-3 md:space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Tailored Solutions</h2>
          <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto">Select a focal area to see how our AI can transform your business operations today.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {SOLUTIONS.map((solution) => (
            <div 
              key={solution.id}
              onClick={() => onSelectSolution(solution)}
              className="group bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-indigo-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="relative z-10 space-y-4 md:space-y-6">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  {solution.icon === 'target' && <Target className="w-6 h-6 md:w-7 md:h-7" />}
                  {solution.icon === 'trending' && <TrendingUp className="w-6 h-6 md:w-7 md:h-7" />}
                  {solution.icon === 'globe' && <Globe className="w-6 h-6 md:w-7 md:h-7" />}
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold text-slate-900">{solution.title}</h3>
                <p className="text-sm md:text-base text-slate-500 leading-relaxed">{solution.description}</p>
                
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs md:text-sm group-hover:gap-4 transition-all">
                  Explore Solution <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PDF Document Intelligence Spotlight Card */}
        {onOpenPdfInsights && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[28px] p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg border border-indigo-900/40">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full">
                    Document AI
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> No dataset or records modified
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Have a PDF report, audit memo, or contract?
                </h3>
                <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Let Gemini 3.8 Flash extract executive summaries, KPIs, identified risks, and next steps directly from your PDF document without putting anything into your sales dataset.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenPdfInsights}
              className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95 cursor-pointer"
            >
              <span>Analyze PDF Document</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* Trust Section */}
      <section className="bg-slate-900 rounded-[32px] md:rounded-[40px] p-8 md:p-12 text-center text-white space-y-6 md:space-y-8">
        <h3 className="text-2xl md:text-3xl font-bold">Ready to scale?</h3>
        <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">Join 500+ companies using our AI Advisor to drive data-backed growth.</p>
        <button 
          onClick={onStartVoice}
          className="w-full md:w-auto px-8 md:px-12 py-3 md:py-4 bg-white text-slate-900 rounded-xl md:rounded-2xl font-bold hover:bg-indigo-50 transition-all"
        >
          Get Started Now
        </button>
      </section>
    </div>
  );
};

export default HomeView;
