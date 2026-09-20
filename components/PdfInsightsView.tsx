// components/PdfInsightsView.tsx — Standalone PDF & Document Intelligence Engine
import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  ArrowRight, 
  Download, 
  Copy, 
  Send, 
  HelpCircle, 
  FileCheck, 
  Loader2, 
  MessageSquare, 
  RefreshCw,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Search,
  ExternalLink,
  Layers,
  ArrowUpRight,
  Bookmark,
  Home
} from 'lucide-react';
import { 
  PdfInsightReport, 
  PdfQnAPair, 
  RiskLevel, 
  DocumentPage, 
  PdfStrategyItem, 
  PdfActionItem, 
  PdfKeyMetric, 
  PdfRiskItem,
  PdfVoiceAction
} from '../types';
import { 
  analyzePdfDocument, 
  askQuestionAboutPdf, 
  PRELOADED_SAMPLE_PDFS 
} from '../services/pdfAnalyzer';
import { exportDocumentInsightsToPdf } from '../services/pdfReportGenerator';
import { MarkdownRenderer } from './MarkdownRenderer';

interface PdfInsightsViewProps {
  onBackToDashboard?: () => void;
  initialFile?: File | null;
  pdfVoiceAction?: PdfVoiceAction;
}

export const PdfInsightsView: React.FC<PdfInsightsViewProps> = ({ 
  onBackToDashboard,
  initialFile,
  pdfVoiceAction
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentReaderRef = useRef<HTMLDivElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'summary' | 'strategies' | 'actions' | 'risks' | 'qna'>('summary');
  const [isUploadedDocument, setIsUploadedDocument] = useState<boolean>(false);
  
  // Active citation reference state for scroll and highlight
  const [activeCitation, setActiveCitation] = useState<{
    pageNumber: number;
    quote: string;
    label?: string;
  } | null>(null);

  const [readerSearchTerm, setReaderSearchTerm] = useState('');
  const [activeReaderPage, setActiveReaderPage] = useState<number>(1);
  const [isPdfEmbeddedView, setIsPdfEmbeddedView] = useState(false);

  // Initialize with the first pre-loaded executive report
  const [currentReport, setCurrentReport] = useState<PdfInsightReport>(() => {
    const sample = PRELOADED_SAMPLE_PDFS[0];
    const data = sample.sampleData;
    return {
      id: 'pdf-sample-0',
      fileName: data.fileName || sample.title,
      fileSize: data.fileSize || '418.5 KB',
      analyzedAt: 'Pre-loaded Executive Analysis',
      documentType: data.documentType || 'Quarterly Commercial & Financial Performance Review',
      pageCount: data.pageCount || 3,
      pages: data.pages || [],
      executiveSummary: data.executiveSummary || '',
      keyMetrics: data.keyMetrics || [],
      strategies: data.strategies || [],
      strategicInsights: data.strategicInsights || [],
      risksAndGovernance: data.risksAndGovernance || [],
      recommendedActions: data.recommendedActions || [],
      overallRiskLevel: data.overallRiskLevel || RiskLevel.MEDIUM,
      topics: data.topics || ['Gross Margin', 'Credit Governance', 'Distributor Performance', 'Rebate Audit'],
      rawTextPreview: 'Q3 Executive Commercial Review analyzes gross bookings across 4 regional divisions...'
    };
  });

  // Interactive Document Q&A State
  const [qnAList, setQnAList] = useState<PdfQnAPair[]>([
    {
      id: 'q-initial',
      question: 'What is the primary cause of margin compression in this report?',
      answer: 'Margin compression (-190 bps) is primarily driven by unauthorized tier-2 distributor volume discounts (averaging 8.2% vs budgeted 5.0%) and extended 64-day payment cycles in the South region. (Referenced on Page 2).',
      timestamp: 'Initial Analysis'
    }
  ]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [copiedState, setCopiedState] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  // Auto-process initialFile if passed from parent
  useEffect(() => {
    if (initialFile) {
      handleFile(initialFile);
    }
  }, [initialFile]);

  // React to Voice Actions
  useEffect(() => {
    if (!pdfVoiceAction) return;

    // 1. Select document sample
    if (pdfVoiceAction.type === 'select_document' && pdfVoiceAction.documentIndex !== undefined) {
      const sample = PRELOADED_SAMPLE_PDFS[pdfVoiceAction.documentIndex];
      if (sample) handleLoadSample(sample);
    }

    // 2. Switch output tab
    if (pdfVoiceAction.outputTab) {
      setActiveOutputTab(pdfVoiceAction.outputTab);
    }

    // 3. Scroll to page
    if (pdfVoiceAction.pageNumber !== undefined) {
      setActiveReaderPage(pdfVoiceAction.pageNumber);
      setTimeout(() => {
        const el = document.getElementById(`doc-page-${pdfVoiceAction.pageNumber}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [pdfVoiceAction?.timestamp]);

  // File Upload Handler (PDF or Text Document)
  const handleFile = async (file: File) => {
    const nameLower = file.name.toLowerCase();
    const isAllowed = nameLower.endsWith('.pdf') || 
                      nameLower.endsWith('.txt') || 
                      nameLower.endsWith('.md') || 
                      nameLower.endsWith('.text') || 
                      file.type.startsWith('text/') || 
                      file.type === 'application/pdf';

    if (!isAllowed) {
      alert('Please upload a PDF (.pdf) or text document (.txt, .md).');
      return;
    }

    setIsAnalyzing(true);
    try {
      const report = await analyzePdfDocument(file);
      setCurrentReport(report);
      setIsUploadedDocument(true);
      setActiveReaderPage(1);
      setActiveCitation(null);
      setQnAList([
        {
          id: `q-${Date.now()}`,
          question: `What are the executive takeaways from ${file.name}?`,
          answer: report.executiveSummary,
          timestamp: 'Instant Synthesis'
        }
      ]);
      setCompletedTasks({});
    } catch (err: any) {
      console.error('Error analyzing document:', err);
      alert('Failed to analyze document: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Load a Pre-loaded Sample
  const handleLoadSample = (sample: typeof PRELOADED_SAMPLE_PDFS[0]) => {
    const data = sample.sampleData;
    setCurrentReport({
      id: `sample-${Date.now()}`,
      fileName: data.fileName || sample.title,
      fileSize: data.fileSize || '350 KB',
      analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      documentType: data.documentType || sample.category,
      pageCount: data.pageCount || data.pages?.length || 3,
      pages: data.pages || [],
      executiveSummary: data.executiveSummary || '',
      keyMetrics: data.keyMetrics || [],
      strategies: data.strategies || [],
      strategicInsights: data.strategicInsights || [],
      risksAndGovernance: data.risksAndGovernance || [],
      recommendedActions: data.recommendedActions || [],
      overallRiskLevel: data.overallRiskLevel || RiskLevel.MEDIUM,
      topics: data.topics || [],
      rawTextPreview: sample.description
    });
    setIsUploadedDocument(false);
    setActiveReaderPage(1);
    setActiveCitation(null);
    setQnAList([
      {
        id: `q-${Date.now()}`,
        question: `What is the core objective of this document?`,
        answer: data.executiveSummary?.slice(0, 240) + '...',
        timestamp: 'Sample Insight'
      }
    ]);
    setCompletedTasks({});
  };

  // Scroll to Page and Highlight Content
  const scrollToPageAndHighlight = (pageNumber: number, quote: string, label?: string) => {
    setActiveCitation({
      pageNumber,
      quote,
      label
    });
    setActiveReaderPage(pageNumber);

    // Scroll reader element to target page
    setTimeout(() => {
      const pageElem = document.getElementById(`doc-page-${pageNumber}`);
      if (pageElem) {
        pageElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Ask Question Handler
  const handleAsk = async (queryText?: string) => {
    const query = (queryText || userQuestion).trim();
    if (!query || !currentReport || isAsking) return;

    setUserQuestion('');
    setIsAsking(true);

    try {
      const answer = await askQuestionAboutPdf(currentReport, query, qnAList);
      setQnAList(prev => [
        ...prev,
        {
          id: `q-${Date.now()}`,
          question: query,
          answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error('Q&A Error:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const handleCopyReport = () => {
    if (!currentReport) return;
    const text = `EXECUTIVE DOCUMENT INTELLIGENCE REPORT
Document: ${currentReport.fileName}
Type: ${currentReport.documentType}
Risk Level: ${currentReport.overallRiskLevel}
Analyzed: ${currentReport.analyzedAt}

1. EXECUTIVE SUMMARY:
${currentReport.executiveSummary}

2. KEY METRICS:
${currentReport.keyMetrics.map(m => `- ${m.label}: ${m.value} (${m.context || ''}) [Ref Page ${m.pageNumber || 1}]`).join('\n')}

3. STRATEGIES:
${currentReport.strategies?.map(s => `- ${s.title}: ${s.description} (Expected Impact: ${s.impact || 'High'}) [Ref Page ${s.pageNumber || 1}: "${s.referenceQuote || ''}"]`).join('\n')}

4. ACTION ITEMS:
${currentReport.recommendedActions.map(a => `- [${a.priority}] ${a.task} (Owner: ${a.owner || 'Leadership'}, ROI: ${a.expectedRoi}) [Ref Page ${a.pageNumber || 1}]`).join('\n')}

5. RISKS & GOVERNANCE:
${currentReport.risksAndGovernance.map(r => `- [${r.severity}] ${r.risk}: ${r.impact || ''} (Mitigation: ${r.mitigation || ''}) [Ref Page ${r.pageNumber || 1}]`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2500);
  };

  const handleDownloadReport = () => {
    if (!currentReport) return;
    try {
      exportDocumentInsightsToPdf(currentReport);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
      alert('Unable to generate PDF report directly. Please try again.');
    }
  };

  // Helper to render page text with highlighted quote and search term following the app theme
  const renderHighlightedPageContent = (page: DocumentPage) => {
    const text = page.content;
    const isCurrentCitationPage = Boolean(activeCitation && activeCitation.pageNumber === page.pageNumber);
    const rawQuote = isCurrentCitationPage && activeCitation ? activeCitation.quote.trim() : '';
    const cleanSearchTerm = readerSearchTerm.trim().toLowerCase();

    // 1. Neither citation nor search query: standard clean text
    if (!rawQuote && !cleanSearchTerm) {
      return (
        <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-sans">
          {text}
        </p>
      );
    }

    // 2. Active Citation Highlighting on this page
    if (rawQuote && rawQuote.length > 3) {
      const lowerText = text.toLowerCase();
      // Clean quotes, punctuation and trailing ellipses
      const cleanQuote = rawQuote
        .replace(/^["'“”]+|["'“”]+$/g, '')
        .replace(/\.\.\.$/, '')
        .trim();

      let matchStart = -1;
      let matchEnd = -1;

      if (cleanQuote.length >= 3) {
        const idx = lowerText.indexOf(cleanQuote.toLowerCase());
        if (idx !== -1) {
          matchStart = idx;
          matchEnd = idx + cleanQuote.length;
        }
      }

      // If no exact match, try matching by meaningful phrase or sentence segment
      if (matchStart === -1 && cleanQuote.length > 20) {
        const prefix = cleanQuote.slice(0, 32).trim();
        const prefixIdx = lowerText.indexOf(prefix.toLowerCase());
        if (prefixIdx !== -1) {
          matchStart = prefixIdx;
          matchEnd = Math.min(text.length, prefixIdx + cleanQuote.length);
        } else {
          // Try sentence fragments separated by comma or semicolon
          const segments = cleanQuote.split(/[,.;]/).map(s => s.trim()).filter(s => s.length > 15);
          for (const seg of segments) {
            const segIdx = lowerText.indexOf(seg.toLowerCase());
            if (segIdx !== -1) {
              matchStart = segIdx;
              matchEnd = segIdx + seg.length;
              break;
            }
          }
        }
      }

      if (matchStart !== -1) {
        const before = text.substring(0, matchStart);
        const match = text.substring(matchStart, matchEnd);
        const after = text.substring(matchEnd);

        return (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-100/90 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-[11px] font-bold shadow-xs">
              <Bookmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Cited In Document: {activeCitation?.label || 'Direct Evidence'}</span>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-sans">
              {before}
              <mark className="bg-indigo-100 dark:bg-indigo-900/80 text-indigo-950 dark:text-indigo-50 font-bold px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-600 ring-2 ring-indigo-400/40 dark:ring-indigo-400/60 shadow-xs inline my-0.5">
                {match}
              </mark>
              {after}
            </p>
          </div>
        );
      } else {
        // Citation is cited on this page, but text slightly paraphrased:
        // Render a high-contrast themed reference callout block at the top so the quote is 100% visible and readable!
        return (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs shadow-xs">
              <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300 text-[11px] mb-1.5">
                <Bookmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Document Citation ({activeCitation?.label || 'Direct Source'}):</span>
              </div>
              <p className="italic font-medium text-slate-800 dark:text-slate-100 leading-relaxed bg-white/90 dark:bg-slate-900/90 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
                "{rawQuote}"
              </p>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-sans">
              {text}
            </p>
          </div>
        );
      }
    }

    // 3. Search query highlighting
    if (cleanSearchTerm) {
      const parts = text.split(new RegExp(`(${cleanSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
      return (
        <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-sans">
          {parts.map((part, i) => 
            part.toLowerCase() === cleanSearchTerm ? (
              <mark key={i} className="bg-indigo-100 dark:bg-indigo-900/80 text-indigo-950 dark:text-indigo-50 font-bold px-1.5 py-0.5 rounded border border-indigo-300 dark:border-indigo-600">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </p>
      );
    }

    // Fallback: simple text
    return (
      <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-sans">
        {text}
      </p>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Scope & Mode Header Banner (Dynamic according to uploaded PDF or current sample) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                {isUploadedDocument ? 'Uploaded Document Intelligence' : 'Dedicated Document Intelligence Mode'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isUploadedDocument 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                {isUploadedDocument ? `✓ Active File: ${currentReport.fileName}` : '✓ Completely Decoupled from Sales Dataset'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>{isUploadedDocument ? `Intelligence: ${currentReport.fileName}` : 'PDF & Text Document Intelligence'}</span>
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5 max-w-2xl leading-relaxed">
              {isUploadedDocument ? (
                <>
                  Synthesizing <strong className="text-slate-800">{currentReport.fileName}</strong> ({currentReport.pages?.length || currentReport.pageCount || 1} pages, {currentReport.fileSize}). AI has generated <strong className="text-slate-800">executive summaries, strategic directives, and leadership action items</strong> with page-level citations.
                </>
              ) : (
                <>
                  AI extracts <strong className="text-slate-800">summaries, strategic directives, and concrete action items</strong> with interactive page-level citations and in-document highlights.
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Exit Document Mode and return to main CSV/Excel Advisor"
              >
                <Home className="w-4 h-4 text-slate-500" />
                <span>Exit to Home</span>
              </button>
            )}

            <label className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 active:scale-95">
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isAnalyzing ? 'Analyzing Document...' : 'Upload PDF / Text Document'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.text,text/plain,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                }}
                disabled={isAnalyzing}
              />
            </label>
          </div>
        </div>

        {/* Drag & Drop Quick Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`mt-3 border-2 border-dashed rounded-xl py-2 px-3 sm:py-2.5 sm:px-4 text-center transition-all ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50/60' 
              : 'border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-slate-600">
            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span><strong className="text-slate-800">Drag and drop PDF or text document</strong> to synthesize.</span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-slate-500">Zero records added to sales dataset • Pure executive intelligence & citations</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Column = AI Outputs (Summarize, Strategy, Action Items); Right Column = Document Reader with Scroll & Highlight */}
      {currentReport && (
        <div className="space-y-6">
          {/* Document Meta Header Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">{currentReport.fileName}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {currentReport.documentType}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    currentReport.overallRiskLevel === RiskLevel.HIGH
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : currentReport.overallRiskLevel === RiskLevel.MEDIUM
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {currentReport.overallRiskLevel} Risk
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2.5 flex-wrap">
                  <span>Analyzed: <strong className="text-slate-700">{currentReport.analyzedAt}</strong></span>
                  <span>•</span>
                  <span>Pages: <strong className="text-slate-700">{currentReport.pages?.length || currentReport.pageCount || 1}</strong></span>
                  <span>•</span>
                  <span>Size: <strong className="text-slate-700">{currentReport.fileSize}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-600 font-medium">Active Intelligence Mode</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyReport}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy complete structured briefing"
              >
                {copiedState ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                <span>{copiedState ? 'Copied!' : 'Copy Summary'}</span>
              </button>
              <button
                onClick={handleDownloadReport}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Download Executive Intelligence Briefing in PDF Format"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>

          {/* Key Metric Highlights (Click to Jump to Document Citation) */}
          {currentReport.keyMetrics && currentReport.keyMetrics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentReport.keyMetrics.map((metric, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    if (metric.pageNumber && metric.referenceQuote) {
                      scrollToPageAndHighlight(metric.pageNumber, metric.referenceQuote, metric.label);
                    }
                  }}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs transition-all cursor-pointer ${
                    activeCitation?.quote === metric.referenceQuote
                      ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-500/40 bg-indigo-50/30 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{metric.label}</span>
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <BookOpen className="w-2.5 h-2.5" />
                      Page {metric.pageNumber || 1}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2 font-mono tracking-tight flex items-baseline gap-2">
                    <span>{metric.value}</span>
                    {metric.trend === 'up' ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </span>
                    ) : metric.trend === 'down' ? (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center">
                        <TrendingDown className="w-3.5 h-3.5" />
                      </span>
                    ) : null}
                  </div>
                  {metric.context && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate" title={metric.context}>
                      {metric.context}
                    </p>
                  )}
                  {metric.referenceQuote && (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1 font-medium hover:underline">
                      <span>Jump to quote in document</span>
                      <ArrowRight className="w-3 h-3" />
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Split Pane: Left = Structured Outputs (Summarize, Strategy, Action Items) | Right = Document Reader */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: AI Executive Intelligence Output Hub (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Output Category Tabs */}
              <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setActiveOutputTab('summary')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeOutputTab === 'summary'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1. Summarize</span>
                </button>

                <button
                  onClick={() => setActiveOutputTab('strategies')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeOutputTab === 'strategies'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>2. Strategy ({currentReport.strategies?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveOutputTab('actions')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeOutputTab === 'actions'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>3. Action Items ({currentReport.recommendedActions?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveOutputTab('risks')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeOutputTab === 'risks'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Risks & Governance</span>
                </button>

                <button
                  onClick={() => setActiveOutputTab('qna')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeOutputTab === 'qna'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask Gemini</span>
                </button>
              </div>

              {/* Tab 1: Executive Summary */}
              {activeOutputTab === 'summary' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Executive Summary & Overview</h3>
                        <p className="text-xs text-slate-500">Core narrative synthesis and operational baseline</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const firstPage = currentReport.pages?.[0];
                        if (firstPage) {
                          scrollToPageAndHighlight(firstPage.pageNumber, firstPage.content.slice(0, 100), 'Executive Summary');
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>View in Reader (Page 1)</span>
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-slate-800 text-sm leading-relaxed">
                    <MarkdownRenderer content={currentReport.executiveSummary} />
                  </div>

                  {/* Strategic Insights Bullet Points */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Strategic Insights</h4>
                    <div className="space-y-2.5">
                      {currentReport.strategicInsights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="leading-relaxed">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Topic Tags */}
                  {currentReport.topics && currentReport.topics.length > 0 && (
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-slate-500 mr-2">Identified Pillars:</span>
                      <div className="inline-flex gap-1.5 flex-wrap mt-1">
                        {currentReport.topics.map((t, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Strategy Directives */}
              {activeOutputTab === 'strategies' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Strategic Directives & Blueprints</h3>
                        <p className="text-xs text-slate-500">Formulated from underlying operational evidence</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      Click strategy to scroll & highlight document page
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {currentReport.strategies && currentReport.strategies.length > 0 ? (
                      currentReport.strategies.map((strat) => {
                        const isHighlighted = activeCitation?.quote === strat.referenceQuote;
                        return (
                          <div 
                            key={strat.id}
                            onClick={() => {
                              if (strat.pageNumber && strat.referenceQuote) {
                                scrollToPageAndHighlight(strat.pageNumber, strat.referenceQuote, strat.title);
                              }
                            }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              isHighlighted 
                                ? 'bg-indigo-50/40 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-500/40' 
                                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                                <span>{strat.title}</span>
                              </h4>
                              <button 
                                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1 shrink-0 shadow-2xs hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                title="Scroll to substantiated page in document"
                              >
                                <BookOpen className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                <span>Page {strat.pageNumber || 1}</span>
                              </button>
                            </div>

                            <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
                              {strat.description}
                            </p>

                            {strat.impact && (
                              <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span><strong>Expected Impact:</strong> {strat.impact}</span>
                              </div>
                            )}

                            {strat.referenceQuote && (
                              <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 italic bg-slate-50/90 dark:bg-slate-800/90 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                                <span className="font-bold text-indigo-700 dark:text-indigo-300 not-italic mr-1.5 inline-flex items-center gap-1">
                                  <Bookmark className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                  Document Evidence:
                                </span>
                                <span className="text-slate-700 dark:text-slate-200 font-medium">"{strat.referenceQuote}"</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500">No strategic directives extracted.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Action Items */}
              {activeOutputTab === 'actions' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Leadership Action Plan & Directives</h3>
                        <p className="text-xs text-slate-500">Action item output linked directly to document citations</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      {Object.values(completedTasks).filter(Boolean).length} of {currentReport.recommendedActions.length} Done
                    </span>
                  </div>

                  <div className="space-y-3">
                    {currentReport.recommendedActions.map((action) => {
                      const isDone = Boolean(completedTasks[action.id]);
                      const isHighlighted = activeCitation?.quote === action.referenceQuote;

                      return (
                        <div
                          key={action.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isDone 
                              ? 'bg-slate-50/60 dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-60' 
                              : isHighlighted
                              ? 'bg-indigo-50/40 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-500/40'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={(e) => setCompletedTasks(prev => ({ ...prev, [action.id]: e.target.checked }))}
                                className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    action.priority === 'Immediate'
                                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                      : action.priority === 'High'
                                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  }`}>
                                    {action.priority}
                                  </span>
                                  <span className={`text-sm font-semibold ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                                    {action.task}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                                  {action.owner && <span>Assigned: <strong className="text-slate-700 dark:text-slate-300">{action.owner}</strong></span>}
                                  {action.owner && <span>•</span>}
                                  <span>ROI / Impact: <strong className="text-emerald-700 dark:text-emerald-400">{action.expectedRoi}</strong></span>
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                if (action.pageNumber && action.referenceQuote) {
                                  scrollToPageAndHighlight(action.pageNumber, action.referenceQuote, action.task);
                                } else {
                                  scrollToPageAndHighlight(action.pageNumber || 1, action.task.slice(0, 40), action.task);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
                              title="Jump to reference page in document reader"
                            >
                              <BookOpen className="w-3 h-3 text-indigo-600" />
                              <span>Page {action.pageNumber || 1}</span>
                            </button>
                          </div>

                          {action.referenceQuote && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 italic bg-slate-50/90 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                              <span className="font-bold text-indigo-700 dark:text-indigo-300 not-italic mr-1.5 inline-flex items-center gap-1">
                                <Bookmark className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                Document Source:
                              </span>
                              <span className="text-slate-700 dark:text-slate-200 font-medium">"{action.referenceQuote}"</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 4: Risks & Governance */}
              {activeOutputTab === 'risks' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Risks, Pitfalls & Governance Flags</h3>
                        <p className="text-xs text-slate-500">Identified compliance gaps and exposure areas</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {currentReport.risksAndGovernance.length} flags identified
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {currentReport.risksAndGovernance.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-xl border transition-all ${
                          item.severity === RiskLevel.HIGH
                            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                            : item.severity === RiskLevel.MEDIUM
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <AlertTriangle className={`w-4 h-4 shrink-0 ${
                              item.severity === RiskLevel.HIGH ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                            }`} />
                            <span>{item.risk}</span>
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              item.severity === RiskLevel.HIGH
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                : item.severity === RiskLevel.MEDIUM
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600'
                            }`}>
                              {item.severity} Risk
                            </span>
                            {item.pageNumber && (
                              <button
                                onClick={() => {
                                  if (item.referenceQuote) {
                                    scrollToPageAndHighlight(item.pageNumber!, item.referenceQuote, item.risk);
                                  } else {
                                    scrollToPageAndHighlight(item.pageNumber!, item.risk.slice(0, 30), item.risk);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs transition-colors"
                              >
                                Page {item.pageNumber}
                              </button>
                            )}
                          </div>
                        </div>

                        {item.impact && (
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-2">
                            <strong className="text-slate-900 dark:text-slate-100">Consequence:</strong> {item.impact}
                          </p>
                        )}

                        {item.mitigation && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span><strong className="text-slate-800 dark:text-slate-200">Mitigation:</strong> {item.mitigation}</span>
                          </div>
                        )}

                        {item.referenceQuote && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 italic bg-white/60 dark:bg-slate-800/70 p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                            <span className="font-bold text-indigo-700 dark:text-indigo-300 not-italic mr-1.5 inline-flex items-center gap-1">
                              <Bookmark className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                              Document Evidence:
                            </span>
                            <span className="text-slate-700 dark:text-slate-200 font-medium">"{item.referenceQuote}"</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Interactive Q&A ("Ask Gemini") */}
              {activeOutputTab === 'qna' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Ask Gemini About This Document</h3>
                        <p className="text-xs text-slate-500">Query questions grounded in document text with citations</p>
                      </div>
                    </div>
                    <span className="text-xs text-purple-700 font-semibold bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full">
                      Gemini 3.8 Flash
                    </span>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Try asking:</span>
                    {[
                      'What are the main risks identified?',
                      'Summarize the strategies and action items',
                      'What are the immediate next steps?',
                      'Which partners are highlighted?'
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleAsk(q)}
                        disabled={isAsking}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>

                  {/* Q&A Chat List */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {qnAList.map((item) => (
                      <div key={item.id} className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-start justify-between gap-2 text-xs">
                          <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-mono">Q</span>
                            {item.question}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">{item.timestamp}</span>
                        </div>
                        <div className="text-xs text-slate-700 pl-5.5 leading-relaxed border-l-2 border-indigo-200 ml-2">
                          <MarkdownRenderer content={item.answer} />
                        </div>
                      </div>
                    ))}
                    {isAsking && (
                      <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-700 flex items-center gap-2 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        <span>Gemini is analyzing document text and cross-referencing pages...</span>
                      </div>
                    )}
                  </div>

                  {/* Input Field */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder={`Ask any specific question about "${currentReport.fileName}"...`}
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                      disabled={isAsking}
                      className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                    />
                    <button
                      onClick={() => handleAsk()}
                      disabled={!userQuestion.trim() || isAsking}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Ask</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Interactive Document Reader with Scroll-To-Page & Highlights (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Document Reader</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {currentReport.pages?.length || 1} Pages • Auto-Scroll & Citation Highlight
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Page Jump Selector */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-lg p-1 text-xs">
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, activeReaderPage - 1);
                        setActiveReaderPage(newPage);
                        document.getElementById(`doc-page-${newPage}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      disabled={activeReaderPage <= 1}
                      className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer transition-colors"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1.5 font-bold text-slate-700 dark:text-slate-300">
                      {activeReaderPage} / {currentReport.pages?.length || 1}
                    </span>
                    <button
                      onClick={() => {
                        const maxPage = currentReport.pages?.length || 1;
                        const newPage = Math.min(maxPage, activeReaderPage + 1);
                        setActiveReaderPage(newPage);
                        document.getElementById(`doc-page-${newPage}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      disabled={activeReaderPage >= (currentReport.pages?.length || 1)}
                      className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer transition-colors"
                      title="Next Page"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Citation Status Tag if Selected */}
              {activeCitation && (
                <div className="p-3 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 text-xs flex items-center justify-between gap-2 animate-in fade-in shadow-2xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 animate-pulse" />
                    <span className="truncate">
                      <strong className="text-indigo-900 dark:text-indigo-200 font-bold">Citation (Page {activeCitation.pageNumber}):</strong>{" "}
                      <span className="text-slate-700 dark:text-slate-300 italic">"{activeCitation.quote.slice(0, 50)}{activeCitation.quote.length > 50 ? '...' : ''}"</span>
                    </span>
                  </div>
                  <button 
                    onClick={() => setActiveCitation(null)}
                    className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 hover:underline shrink-0 px-2.5 py-1 rounded-md bg-indigo-100/80 dark:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 transition-colors cursor-pointer"
                  >
                    Clear Pin
                  </button>
                </div>
              )}

              {/* Reader Container (Scrollable Pages) */}
              <div 
                ref={documentReaderRef}
                className="space-y-4 max-h-[640px] overflow-y-auto pr-1 pb-4"
              >
                {currentReport.pages && currentReport.pages.length > 0 ? (
                  currentReport.pages.map((page) => {
                    const isTargetPage = activeCitation?.pageNumber === page.pageNumber;

                    return (
                      <div
                        id={`doc-page-${page.pageNumber}`}
                        key={page.pageNumber}
                        className={`rounded-xl border p-5 transition-all shadow-xs ${
                          isTargetPage
                            ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-500/30'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Page Header */}
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center">
                              {page.pageNumber}
                            </span>
                            <span>{page.title || `Page ${page.pageNumber}`}</span>
                          </span>

                          {isTargetPage && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/70 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700/80 flex items-center gap-1">
                              <Bookmark className="w-2.5 h-2.5" />
                              Active Citation
                            </span>
                          )}
                        </div>

                        {/* Page Content with Highlighted Quotes */}
                        <div className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                          {renderHighlightedPageContent(page)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No document pages available to preview.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfInsightsView;
