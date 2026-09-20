// components/VoiceInstructionTesterModal.tsx — Interactive Voice AI & Action Plan Test Console
import React, { useState, useMemo } from 'react';
import { 
  SalesRecord, 
  BIEngineOutput, 
  Language, 
  DashboardState,
  DatasetInfo 
} from '../types';
import { processVoiceInstruction } from '../services/gemini';
import { 
  Mic, 
  Sparkles, 
  Send, 
  X, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  ArrowRight, 
  Loader2 
} from 'lucide-react';

interface VoiceInstructionTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SalesRecord[];
  biOutput: BIEngineOutput;
  language: Language;
  onUpdateDashboard: React.Dispatch<React.SetStateAction<DashboardState>>;
  datasetInfo?: DatasetInfo;
}

const PRESET_TESTS = [
  {
    title: 'North Region Commercial Push',
    prompt: 'Show North region, analyze performance and give me an action plan with priority tasks',
    icon: '🎯',
    desc: 'Filters data to North, analyzes sales velocity, and generates regional growth checklist'
  },
  {
    title: 'Credit Risk & Debt Recovery',
    prompt: 'Filter high risk accounts with outstanding debt and generate an immediate recovery action plan',
    icon: '⚠️',
    desc: 'Sorts by debt, highlights outstanding, and generates a credit freeze & 10-day recovery plan'
  },
  {
    title: 'Standard Gear Margin Strategy',
    prompt: 'Focus on Standard Gear product, inspect profit margins and recommend discount optimization steps',
    icon: '📦',
    desc: 'Filters to Standard Gear, analyzes margins, and creates discount governance tasks'
  },
  {
    title: 'Voice Chart: Revenue by Product (Bar)',
    prompt: 'Show revenue by product in a bar chart and scroll to custom chart builder',
    icon: '📊',
    desc: 'Switches custom chart dimension to Product, measure to Revenue, format to Bar'
  },
  {
    title: 'Voice Chart: Quantity over Date (Line)',
    prompt: 'Plot quantity by date as a line chart to analyze sales timeline volume',
    icon: '📈',
    desc: 'Switches custom chart dimension to Date, measure to Quantity, format to Line'
  },
  {
    title: 'Voice Chart: Discount by Region (Pie)',
    prompt: 'Chart region by discount as a pie chart to visualize promotional spend',
    icon: '🥧',
    desc: 'Switches custom chart dimension to Region, measure to Discount, format to Pie'
  },
  {
    title: 'Full Enterprise Reset & Strategy',
    prompt: 'Reset dashboard filters and generate a global business performance conclusion and next steps',
    icon: '🌐',
    desc: 'Restores global view and builds a cross-segment strategic roadmap'
  },
  {
    title: 'Voice Route: Open PDF Insights',
    prompt: 'Open PDF insights and switch to document intelligence mode',
    icon: '📄',
    desc: 'Switches application to isolated PDF/Text Document Intelligence mode'
  },
  {
    title: 'Voice Action: Show Strategies Tab',
    prompt: 'Switch to strategies tab and highlight page 2 findings',
    icon: '🎯',
    desc: 'Navigates to strategies directives and scrolls to document citation'
  }
];

const VoiceInstructionTesterModal: React.FC<VoiceInstructionTesterModalProps> = ({
  isOpen,
  onClose,
  data,
  biOutput,
  language,
  onUpdateDashboard,
  datasetInfo
}) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastExecutedPrompt, setLastExecutedPrompt] = useState<string | null>(null);
  const [executionLog, setExecutionLog] = useState<{ step: string; status: 'done' | 'active' }[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Dynamic presets derived directly from uploaded dataset columns
  const activePresets = useMemo(() => {
    const schema = datasetInfo?.schema;
    const numCols = schema?.numericColumns || [];
    const catCols = schema?.categoricalColumns || [];

    if (numCols.length === 0 || catCols.length === 0) {
      return PRESET_TESTS;
    }

    const m1 = numCols[0];
    const m2 = numCols.length > 1 ? numCols[1] : m1;
    const d1 = catCols[0];
    const d2 = catCols.length > 1 ? catCols[1] : d1;

    return [
      {
        title: `Chart: ${m1} by ${d1} (Bar)`,
        prompt: `Show ${m1} by ${d1} in a bar chart and scroll to custom chart builder`,
        icon: '📊',
        desc: `Configures custom chart with ${d1} as dimension, ${m1} as measure, and bar layout`
      },
      {
        title: `Chart: ${m2} over ${d2} (Line)`,
        prompt: `Plot ${m2} by ${d2} as a line chart to analyze progression`,
        icon: '📈',
        desc: `Configures custom chart with ${d2} as dimension, ${m2} as measure, and line layout`
      },
      {
        title: `Chart: ${m1} Distribution by ${d2} (Pie)`,
        prompt: `Chart ${d2} by ${m1} as a pie chart to visualize allocation`,
        icon: '🥧',
        desc: `Visualizes ${d2} breakdown by ${m1} in pie chart format`
      },
      {
        title: `Strategic Plan: Analyze ${d1}`,
        prompt: `Analyze performance across ${d1} and generate an action plan with priority tasks`,
        icon: '🎯',
        desc: `Evaluates ${d1} segments and generates priority operational roadmap`
      },
      {
        title: 'Full Strategy Reset',
        prompt: 'Reset dashboard filters and generate a global business performance conclusion and next steps',
        icon: '🌐',
        desc: 'Restores global view and builds a cross-segment strategic roadmap'
      }
    ];
  }, [datasetInfo]);

  if (!isOpen) return null;

  const executeInstruction = async (promptText: string) => {
    if (!promptText.trim() || isProcessing) return;

    setIsProcessing(true);
    setLastExecutedPrompt(promptText);
    setExecutionLog([
      { step: 'Parsing voice instruction & intent...', status: 'active' }
    ]);

    try {
      await new Promise(r => setTimeout(r, 400));
      setExecutionLog(prev => [
        { step: 'Analyzing instruction with real dataset schema...', status: 'done' },
        { step: 'Manipulating dashboard data & calculating segment...', status: 'active' }
      ]);

      const result = await processVoiceInstruction(promptText, data, biOutput, language, datasetInfo?.schema);

      await new Promise(r => setTimeout(r, 400));
      setExecutionLog(prev => [
        ...prev.map(p => ({ ...p, status: 'done' as const })),
        { step: 'Formulating conclusion & strategic recommendations...', status: 'done' },
        { step: 'Compiling actionable execution checklist...', status: 'done' }
      ]);

      // Manipulate Dashboard State
      onUpdateDashboard(prev => ({
        ...prev,
        activeTab: result.targetTab ? result.targetTab : 'dashboard',
        pdfVoiceAction: result.pdfVoiceAction ? result.pdfVoiceAction : prev.pdfVoiceAction,
        filter: result.manipulatedFilters !== undefined ? result.manipulatedFilters : prev.filter,
        highlightedMetric: result.highlightedMetric,
        sortBy: result.sortBy,
        sortDirection: result.sortDirection,
        drillDown: result.drillDown,
        customChart: result.customChart ? result.customChart : prev.customChart,
        activeActionPlan: result.actionPlan
      }));

      if (result.customChart) {
        setTimeout(() => {
          const chartEl = document.getElementById('custom-chart-builder');
          if (chartEl) chartEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }

      // Speak verbal response if speech synthesis available
      if ('speechSynthesis' in window && result.verbalResponse) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(result.verbalResponse);
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }

      await new Promise(r => setTimeout(r, 500));
      // Close modal so user sees the dashboard transform and action plan card
      onClose();
    } catch (err) {
      console.error("Test execution failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Browser Web Speech API for real voice test
  const startBrowserSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser speech recognition is not supported in this browser. You can type or click the preset tests below!");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        setInputPrompt(spokenText);
        setIsListening(false);
        executeInstruction(spokenText);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-white shadow-inner">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold">Voice AI & Action Plan Test Console</h3>
              <p className="text-xs text-indigo-200">
                Test voice instructions that manipulate dashboard data & generate actionable directives
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Custom Input & Mic Bar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Speak or Type Voice Instruction
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={e => setInputPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') executeInstruction(inputPrompt);
                  }}
                  placeholder="e.g. 'Show North region and recommend sales growth actions'..."
                  className="w-full px-4 py-3 pl-10 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                  disabled={isProcessing}
                />
                <Volume2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              <button
                onClick={startBrowserSpeechRecognition}
                type="button"
                className={`p-3 rounded-2xl border transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-200'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200'
                }`}
                title="Speak using microphone"
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                onClick={() => executeInstruction(inputPrompt)}
                disabled={!inputPrompt.trim() || isProcessing}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Run</span>
              </button>
            </div>
            {isListening && (
              <p className="text-xs text-rose-600 font-bold mt-2 animate-pulse flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                <span>Listening to your voice... Speak now!</span>
              </p>
            )}
          </div>

          {/* Preset One-Click Test Cases */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Or Select a One-Click Test Scenario:
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">Click to test instantly</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activePresets.map((test, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setInputPrompt(test.prompt);
                    executeInstruction(test.prompt);
                  }}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group bg-white shadow-2xs hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{test.icon}</span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {test.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {test.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-indigo-600">
                    <span className="italic truncate max-w-[200px]">"{test.prompt}"</span>
                    <Play className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Execution Progress Stepper (if running) */}
          {isProcessing && (
            <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl animate-in fade-in space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 mb-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Executing: "{lastExecutedPrompt}"</span>
              </div>
              {executionLog.map((log, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-indigo-800">
                  {log.status === 'done' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                  )}
                  <span>{log.step}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Both Live Gemini Voice & Local BI Engine are connected</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceInstructionTesterModal;
