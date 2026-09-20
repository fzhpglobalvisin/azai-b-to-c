// components/CustomChartBuilder.tsx — Interactive & AI Voice-Controllable Custom Chart Builder
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Volume2, 
  Check, 
  HelpCircle, 
  MessageSquare,
  X,
  ArrowRight,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Activity
} from 'lucide-react';
import { parseCustomChartFromVoice } from '../services/gemini';
import { CustomChartConfig } from '../types';

export type ChartType = 'bar' | 'line' | 'area' | 'pie';

type DataItem = { [key: string]: any };

export interface CustomChartBuilderProps {
  data?: DataItem[];
  selectedDimension?: string;
  selectedMeasure?: string;
  chartType?: ChartType;
  lastCommand?: string;
  explanation?: string;
  onDimensionChange?: (dim: string) => void;
  onMeasureChange?: (meas: string) => void;
  onChartTypeChange?: (type: ChartType) => void;
  onConfigChange?: (cfg: CustomChartConfig) => void;
  defaultDimension?: string;
  defaultMeasure?: string;
}

const COLOR_PALETTE: string[] = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e', '#06b6d4'];

const formatLabel = (str: string): string => 
  str ? str.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()) : '';

const SAMPLE_VOICE_COMMANDS = [
  { label: 'Revenue by Product (Bar)', prompt: 'Show revenue by product in a bar chart', icon: BarChart3 },
  { label: 'Quantity over Date (Line)', prompt: 'Plot quantity by date as a line chart', icon: TrendingUp },
  { label: 'Discount by Region (Pie)', prompt: 'Chart region by discount as a pie chart', icon: PieIcon },
  { label: 'Outstanding by Customer (Bar)', prompt: 'Chart customer by outstanding debt', icon: BarChart3 },
  { label: 'Revenue by Distributor (Area)', prompt: 'Show distributor by revenue in an area chart', icon: Activity }
];

export const CustomChartBuilder: React.FC<CustomChartBuilderProps> = ({ 
  data = [], 
  selectedDimension: propDimension,
  selectedMeasure: propMeasure,
  chartType: propChartType,
  lastCommand: propLastCommand,
  explanation: propExplanation,
  onDimensionChange,
  onMeasureChange,
  onChartTypeChange,
  onConfigChange,
  defaultDimension, 
  defaultMeasure 
}) => {
  // Extract all dimensions (keys) and measures (numeric keys)
  const { dimensions, measures } = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return { dimensions: [], measures: [] };
    }

    const dimSet = new Set<string>();
    const measSet = new Set<string>();

    data.forEach((item) => {
      if (!item || typeof item !== 'object') return;

      Object.keys(item).forEach((key) => {
        const val = item[key];
        if (val === null || val === undefined) return;

        dimSet.add(key);

        const numVal = Number(val);
        if (!isNaN(numVal) && typeof val !== 'boolean') {
          measSet.add(key);
        }
      });
    });

    const dimArray = Array.from(dimSet);
    const measArray = Array.from(measSet);

    return { 
      dimensions: dimArray, 
      measures: measArray.length > 0 ? measArray : dimArray 
    };
  }, [data]);

  // Local state
  const [internalDimension, setInternalDimension] = useState<string>('');
  const [internalMeasure, setInternalMeasure] = useState<string>('');
  const [internalChartType, setInternalChartType] = useState<ChartType>('bar');
  
  // AI & Voice Interaction State
  const [activeVoiceNotice, setActiveVoiceNotice] = useState<string | null>(null);
  const [isAiGlow, setIsAiGlow] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimSpeech, setInterimSpeech] = useState<string>('');
  const [showVoiceGuide, setShowVoiceGuide] = useState<boolean>(false);
  const [textVoicePrompt, setTextVoicePrompt] = useState<string>('');
  const [showTextInput, setShowTextInput] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  // Helper to match dimension loosely (e.g. 'product' matches 'product' or 'productName')
  const resolveMatchingField = (target: string | undefined, list: string[]): string | undefined => {
    if (!target || list.length === 0) return undefined;
    const lower = target.toLowerCase();
    return list.find(item => item.toLowerCase() === lower || item.toLowerCase().includes(lower) || lower.includes(item.toLowerCase()));
  };

  // Sync with incoming props from parent / AI
  useEffect(() => {
    if (propDimension) {
      const match = resolveMatchingField(propDimension, dimensions);
      if (match) setInternalDimension(match);
    }
  }, [propDimension, dimensions]);

  useEffect(() => {
    if (propMeasure) {
      const match = resolveMatchingField(propMeasure, measures);
      if (match) setInternalMeasure(match);
    }
  }, [propMeasure, measures]);

  useEffect(() => {
    if (propChartType && ['bar', 'line', 'area', 'pie'].includes(propChartType)) {
      setInternalChartType(propChartType);
    }
  }, [propChartType]);

  // When AI or Voice triggers an update, trigger visual highlight glow
  useEffect(() => {
    if (propLastCommand) {
      setActiveVoiceNotice(propLastCommand);
      setIsAiGlow(true);
      const timer = setTimeout(() => setIsAiGlow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [propLastCommand, propDimension, propMeasure, propChartType]);

  // Default selection if empty — derives strictly from actual dataset columns
  useEffect(() => {
    if (dimensions.length > 0 && !internalDimension) {
      const fallbackDim = defaultDimension && dimensions.includes(defaultDimension) 
        ? defaultDimension 
        : dimensions[0];
      setInternalDimension(fallbackDim);
    }
    if (measures.length > 0 && !internalMeasure) {
      const fallbackMeas = defaultMeasure && measures.includes(defaultMeasure) 
        ? defaultMeasure 
        : measures[0];
      setInternalMeasure(fallbackMeas);
    }
  }, [dimensions, measures, defaultDimension, defaultMeasure, internalDimension, internalMeasure]);

  const activeDimension = internalDimension;
  const activeMeasure = internalMeasure;
  const activeChartType = internalChartType;

  const handleDimensionChange = (dim: string) => {
    setInternalDimension(dim);
    onDimensionChange?.(dim);
    onConfigChange?.({
      dimension: dim,
      measure: activeMeasure,
      chartType: activeChartType
    });
  };

  const handleMeasureChange = (meas: string) => {
    setInternalMeasure(meas);
    onMeasureChange?.(meas);
    onConfigChange?.({
      dimension: activeDimension,
      measure: meas,
      chartType: activeChartType
    });
  };

  const handleChartTypeChange = (type: ChartType) => {
    setInternalChartType(type);
    onChartTypeChange?.(type);
    onConfigChange?.({
      dimension: activeDimension,
      measure: activeMeasure,
      chartType: type
    });
  };

  // Dynamic Voice Sample Commands generated directly from dataset columns
  const dynamicVoiceCommands = useMemo(() => {
    if (measures.length === 0 || dimensions.length === 0) return [];
    const m1 = measures[0];
    const m2 = measures.length > 1 ? measures[1] : m1;
    const d1 = dimensions.find(d => d !== m1) || dimensions[0];
    const d2 = dimensions.find(d => d !== m1 && d !== d1) || d1;

    return [
      { label: `${formatLabel(m1)} by ${formatLabel(d1)} (Bar)`, prompt: `Show ${m1} by ${d1} in a bar chart`, icon: BarChart3 },
      { label: `${formatLabel(m2)} by ${formatLabel(d2)} (Line)`, prompt: `Plot ${m2} by ${d2} as a line chart`, icon: TrendingUp },
      { label: `${formatLabel(m1)} by ${formatLabel(d2)} (Pie)`, prompt: `Chart ${d2} by ${m1} as a pie chart`, icon: PieIcon },
      { label: `${formatLabel(m2)} by ${formatLabel(d1)} (Area)`, prompt: `Show ${d1} by ${m2} in an area chart`, icon: Activity }
    ];
  }, [dimensions, measures]);

  // Direct Voice Execution Handler
  const executeVoiceCommand = (commandText: string) => {
    if (!commandText.trim()) return;

    const datasetSchema = {
      columns: dimensions,
      numericColumns: measures,
      categoricalColumns: dimensions.filter(d => !measures.includes(d)),
      dateColumns: []
    };

    const parsedConfig = parseCustomChartFromVoice(commandText, datasetSchema);
    
    if (parsedConfig) {
      const matchedDim = resolveMatchingField(parsedConfig.dimension, dimensions) || activeDimension;
      const matchedMeas = resolveMatchingField(parsedConfig.measure, measures) || activeMeasure;
      const finalType = parsedConfig.chartType || activeChartType;

      if (matchedDim) {
        setInternalDimension(matchedDim);
        onDimensionChange?.(matchedDim);
      }
      if (matchedMeas) {
        setInternalMeasure(matchedMeas);
        onMeasureChange?.(matchedMeas);
      }
      if (finalType) {
        setInternalChartType(finalType);
        onChartTypeChange?.(finalType);
      }

      const updatedConfig: CustomChartConfig = {
        dimension: matchedDim,
        measure: matchedMeas,
        chartType: finalType,
        lastCommand: commandText,
        explanation: `AI configured chart to analyze ${formatLabel(matchedMeas)} by ${formatLabel(matchedDim)} in ${finalType} format.`
      };

      onConfigChange?.(updatedConfig);
      setActiveVoiceNotice(commandText);
      setIsAiGlow(true);
      setTimeout(() => setIsAiGlow(false), 3000);

      // Verbal confirmation
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(
            `Chart updated. Displaying ${formatLabel(matchedMeas)} by ${formatLabel(matchedDim)} as a ${finalType} chart.`
          );
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }
    } else {
      // Fallback: search for chart types
      const lower = commandText.toLowerCase();
      if (lower.includes('pie')) handleChartTypeChange('pie');
      else if (lower.includes('line')) handleChartTypeChange('line');
      else if (lower.includes('area')) handleChartTypeChange('area');
      else if (lower.includes('bar')) handleChartTypeChange('bar');
      
      setActiveVoiceNotice(commandText);
      setIsAiGlow(true);
      setTimeout(() => setIsAiGlow(false), 3000);
    }

    setTextVoicePrompt('');
    setShowTextInput(false);
  };

  // Web Speech Recognition Controller
  const toggleVoiceListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setInterimSpeech('');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setShowTextInput(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimSpeech('Listening... speak now (e.g. "Show revenue by product as bar chart")');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');
        setInterimSpeech(transcript);

        if (event.results[0].isFinal) {
          setIsListening(false);
          executeVoiceCommand(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Chart voice recognition error:', event);
        setIsListening(false);
        setInterimSpeech('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech recognition not available:', err);
      setShowTextInput(true);
    }
  };

  // Aggregate data by selected dimension & measure
  const aggregatedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0 || !activeDimension || !activeMeasure) return [];

    const map = data.reduce((acc: { [key: string]: number }, curr: DataItem) => {
      if (!curr) return acc;
      const dimKey = String(curr[activeDimension] ?? 'Unassigned');
      const measureValue = Number(curr[activeMeasure]) || 0;

      acc[dimKey] = (acc[dimKey] || 0) + measureValue;
      return acc;
    }, {});

    return Object.keys(map)
      .map((key: string) => ({
        dimension: key,
        value: map[key]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [data, activeDimension, activeMeasure]);

  const labelName = formatLabel(activeMeasure);
  const tooltipFormatter = (v: any) => [Number(v).toLocaleString(), labelName];

  const renderChart = () => {
    if (aggregatedData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
          No data available for the selected fields.
        </div>
      );
    }

    if (activeChartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="value" name={labelName} fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (activeChartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Line type="monotone" dataKey="value" name={labelName} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (activeChartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={aggregatedData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Area type="monotone" dataKey="value" name={labelName} fill="#818cf8" stroke="#6366f1" fillOpacity={0.4} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip formatter={tooltipFormatter} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Pie
            data={aggregatedData}
            dataKey="value"
            nameKey="dimension"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={(entry: { dimension: string }) => entry.dimension}
          >
            {aggregatedData.map((_, index: number) => (
              <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div 
      className={`bg-white p-6 rounded-2xl shadow-xs border transition-all duration-500 space-y-5 ${
        isAiGlow 
          ? 'border-indigo-500 ring-4 ring-indigo-100 shadow-lg' 
          : 'border-slate-200'
      }`}
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <span>Custom Chart Builder</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                AI Voice Enabled
              </span>
            </h3>

            {activeVoiceNotice && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium border border-indigo-200 flex items-center gap-1 animate-pulse">
                <Check className="w-3 h-3 text-indigo-600" />
                Voice Executed: "{activeVoiceNotice}"
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Control dimension, measure, and chart visualization manually or speak naturally to the AI.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Voice Command Button */}
          <button
            type="button"
            onClick={toggleVoiceListening}
            title={isListening ? "Stop listening" : "Speak a chart command"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isListening 
                ? 'bg-rose-500 text-white shadow-md shadow-rose-200 animate-pulse' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-100'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5 animate-bounce" />
                <span>Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Command</span>
              </>
            )}
          </button>

          {/* Quick Voice Text / Preset Toggle */}
          <button
            type="button"
            onClick={() => setShowVoiceGuide(!showVoiceGuide)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1"
            title="Voice Command Suggestions"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Voice Tips</span>
          </button>

          {/* Dimension Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500">Dim:</label>
            <select
              value={activeDimension}
              onChange={(e) => handleDimensionChange(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[110px]"
            >
              {dimensions.length === 0 ? (
                <option value="">No dimensions</option>
              ) : (
                dimensions.map((dim: string) => (
                  <option key={dim} value={dim}>
                    {formatLabel(dim)}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Measure Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500">Measure:</label>
            <select
              value={activeMeasure}
              onChange={(e) => handleMeasureChange(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[110px]"
            >
              {measures.length === 0 ? (
                <option value="">No measures</option>
              ) : (
                measures.map((meas: string) => (
                  <option key={meas} value={meas}>
                    {formatLabel(meas)}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Chart Type Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            {(['bar', 'line', 'area', 'pie'] as ChartType[]).map((type: ChartType) => (
              <button
                key={type}
                type="button"
                onClick={() => handleChartTypeChange(type)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                  activeChartType === type
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Listening Real-time Banner */}
      {isListening && (
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-indigo-900 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-semibold">Microphone Live:</span>
            <span className="italic">{interimSpeech || "Say a command like: 'Show revenue by product in a pie chart'"}</span>
          </div>
          <button 
            onClick={toggleVoiceListening}
            className="text-[11px] bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Voice Guide & Preset Suggestions Bar */}
      {showVoiceGuide && (
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Try saying any of these voice commands:
            </span>
            <button 
              onClick={() => setShowVoiceGuide(false)} 
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {dynamicVoiceCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => executeVoiceCommand(cmd.prompt)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-[11px] font-medium text-slate-700 transition-all shadow-2xs group"
                >
                  <Icon className="w-3 h-3 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span>{cmd.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Voice Prompt Input Fallback Modal/Drawer */}
      {showTextInput && (
        <div className="bg-slate-50 p-3 rounded-xl border border-indigo-200 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
          <input
            type="text"
            value={textVoicePrompt}
            onChange={(e) => setTextVoicePrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') executeVoiceCommand(textVoicePrompt);
            }}
            placeholder="Type voice instruction (e.g. 'Show revenue by product in a bar chart')..."
            className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => executeVoiceCommand(textVoicePrompt)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1"
          >
            <span>Apply</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setShowTextInput(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Chart Visualization */}
      <div className="h-72 w-full">
        {renderChart()}
      </div>

      {/* Footer Info Banner */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-600">Active View:</span>
          <span>{formatLabel(activeMeasure)} aggregated by {formatLabel(activeDimension)}</span>
          <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
            {activeChartType}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="italic">
            {propExplanation || "AI analyzes voice instructions in real-time to adjust dimension and measure."}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CustomChartBuilder;
