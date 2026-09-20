// components/ValidationReport.tsx — Layer 2: Validation UI Report
import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Wrench, ChevronDown, ChevronUp, X, ArrowRight } from 'lucide-react';
import { ValidationResult } from '../types';

interface ValidationReportProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: ValidationResult;
  onProceed: (validRowsOnly: boolean) => void;
  fileName: string;
}

const ValidationReport: React.FC<ValidationReportProps> = ({
  isOpen,
  onClose,
  validationResult,
  onProceed,
  fileName,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'errors' | 'warnings' | 'fixed'>('all');
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);

  if (!isOpen) return null;

  const { valid, warnings, errors, summary } = validationResult;
  const autoFixed = warnings.filter(w => w.autoFixed);
  const hasErrors = errors.length > 0;

  const filteredIssues = activeTab === 'errors'
    ? errors
    : activeTab === 'warnings'
    ? warnings.filter(w => !w.autoFixed)
    : activeTab === 'fixed'
    ? autoFixed
    : [...errors, ...warnings];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>Data Validation Pipeline Report</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-200 text-slate-700">
                {fileName}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified dataset schema compliance, type conversions, and business rules
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Metric Strip */}
        <div className="grid grid-cols-4 gap-2 p-4 bg-slate-50 border-b border-slate-100 text-center">
          <div className="bg-white p-3 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold">Valid Rows</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{summary.validRows.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">Ready to ingest</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1">
              <Wrench className="w-4 h-4" />
              <span className="text-xs font-bold">Auto-Fixed</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{summary.autoFixedFields.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">Coerced & cleaned</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-center gap-1.5 text-amber-600 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold">Warnings</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{summary.warningRows.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">Non-fatal flags</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/70">
            <div className="flex items-center justify-center gap-1.5 text-rose-600 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs font-bold">Errors</span>
            </div>
            <p className="text-lg font-bold text-slate-800">{summary.errorRows.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">Rejected rows</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 text-xs font-semibold bg-white">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Items ({errors.length + warnings.length})
          </button>
          {errors.length > 0 && (
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'errors' ? 'bg-rose-600 text-white' : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Errors ({errors.length})
            </button>
          )}
          {warnings.length > 0 && (
            <button
              onClick={() => setActiveTab('warnings')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'warnings' ? 'bg-amber-600 text-white' : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Warnings ({warnings.length - autoFixed.length})
            </button>
          )}
          {autoFixed.length > 0 && (
            <button
              onClick={() => setActiveTab('fixed')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'fixed' ? 'bg-blue-600 text-white' : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Auto-Fixed ({autoFixed.length})
            </button>
          )}
        </div>

        {/* Issue Details List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 min-h-[160px]">
          {filteredIssues.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No issues found in this category</p>
              <p className="text-xs text-slate-400">All data in this segment passes validation criteria</p>
            </div>
          ) : (
            filteredIssues.slice(0, 100).map((issue, idx) => {
              const isErr = issue.severity === 'error';
              const isFixed = issue.autoFixed;
              const isExpanded = expandedIssue === idx;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isErr
                      ? 'bg-rose-50/80 border-rose-200/80 text-rose-900'
                      : isFixed
                      ? 'bg-blue-50/80 border-blue-200/80 text-blue-900'
                      : 'bg-amber-50/80 border-amber-200/80 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isErr ? (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : isFixed ? (
                        <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span className="font-bold">Row {issue.row}:</span>
                      <span className="font-mono bg-white/70 px-1.5 py-0.5 rounded border border-black/5">
                        {issue.field}
                      </span>
                      <span>{issue.message}</span>
                    </div>

                    {(issue.value !== undefined || isFixed) && (
                      <button
                        onClick={() => setExpandedIssue(isExpanded ? null : idx)}
                        className="text-slate-500 hover:text-slate-800 p-0.5"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-black/5 flex flex-wrap gap-4 text-[11px] text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-500">Original Value: </span>
                        <code className="bg-white/80 px-1 py-0.5 rounded text-slate-800">
                          {String(issue.value)}
                        </code>
                      </div>
                      {isFixed && (
                        <div>
                          <span className="font-semibold text-blue-700">Auto-Coerced To: </span>
                          <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-bold">
                            {String(issue.fixedValue)}
                          </code>
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-500">Rule Triggered: </span>
                        <span className="text-slate-700">{issue.rule}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {filteredIssues.length > 100 && (
            <p className="text-center text-xs text-slate-400 py-2">
              Showing first 100 issues of {filteredIssues.length}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel Import
          </button>

          <div className="flex items-center gap-2">
            {hasErrors && valid.length > 0 ? (
              <button
                onClick={() => onProceed(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <span>Import {valid.length} Valid Records (Skip {summary.errorRows} Errors)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : valid.length > 0 ? (
              <button
                onClick={() => onProceed(false)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <span>Proceed with Dataset ({valid.length} Records)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-xs text-rose-600 font-semibold">
                Cannot import: No valid records found.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationReport;
