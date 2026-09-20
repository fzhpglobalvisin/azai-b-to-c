import React from 'react';
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  HelpCircle,
  FileCode,
  Layers,
  ArrowRight
} from 'lucide-react';
import { exportTemplateSpecToPdf } from '../services/pdfReportGenerator';

interface FormatGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
}

const FormatGuideModal: React.FC<FormatGuideModalProps> = ({
  isOpen,
  onClose,
  onDownloadTemplate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Supported Data Formats & Upload Guide</h3>
              <p className="text-xs text-slate-500">Learn what datasets can be analyzed and how to format them</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-sm text-slate-600">
          
          {/* Clear Distinction: PDF Intelligence vs Tabular Dataset */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-5">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-base">
                    Need AI insights from a PDF document?
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    No Table Conversion Needed
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  <strong>Yes!</strong> You can analyze any PDF document (board reports, financial summaries, audit memos, vendor contracts) without forcing it into tabular sales records:
                </p>
                <div className="pt-2 text-xs text-slate-600 space-y-2 border-t border-indigo-200/60 mt-2">
                  <p>
                    • <strong>PDF Insights (Zero Dataset Impact):</strong> Switch to the <strong>"PDF Insights"</strong> tab in the navigation bar. Gemini 3.8 Flash will directly read and analyze the PDF, producing an executive briefing, quantitative KPIs, governance risks, and leadership action items.
                  </p>
                  <p>
                    • <strong>Dashboard Dataset Records:</strong> The core charts and calculators strictly require tabular rows (CSV, TSV, JSON, Excel) with columns like <code>Revenue</code>, <code>Product</code>, and <code>Customer</code> to calculate sums and render visual breakdowns.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Formats */}
          <div>
            <h4 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Supported Tabular Formats
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>CSV (.csv)</span>
                </div>
                <p className="text-xs text-slate-500">Comma-separated values exported from Excel, QuickBooks, SAP, NetSuite, or Google Sheets.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1">
                  <FileText className="w-4 h-4" />
                  <span>TSV / TXT (.tsv, .txt)</span>
                </div>
                <p className="text-xs text-slate-500">Tab-delimited or comma-formatted plain text transaction tables.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-1">
                  <FileCode className="w-4 h-4" />
                  <span>JSON (.json)</span>
                </div>
                <p className="text-xs text-slate-500">JSON array containing sales record objects matching the column schema.</p>
              </div>
            </div>
          </div>

          {/* Expected Columns Schema */}
          <div>
            <h4 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Expected Data Columns
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Column Header</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Example / Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="px-3 py-1.5 font-bold text-indigo-600">date</td>
                    <td className="px-3 py-1.5 text-slate-500">YYYY-MM-DD</td>
                    <td className="px-3 py-1.5 text-slate-600">2024-03-15 (Transaction date)</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="px-3 py-1.5 font-bold text-indigo-600">invoiceNo</td>
                    <td className="px-3 py-1.5 text-slate-500">String</td>
                    <td className="px-3 py-1.5 text-slate-600">INV-1042 (Unique reference)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 font-bold text-indigo-600">customerName</td>
                    <td className="px-3 py-1.5 text-slate-500">String</td>
                    <td className="px-3 py-1.5 text-slate-600">Acme Corporation (Client name)</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="px-3 py-1.5 font-bold text-indigo-600">distributor</td>
                    <td className="px-3 py-1.5 text-slate-500">String</td>
                    <td className="px-3 py-1.5 text-slate-600">Distro West (Channel partner)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 font-bold text-indigo-600">product</td>
                    <td className="px-3 py-1.5 text-slate-500">String</td>
                    <td className="px-3 py-1.5 text-slate-600">Smart Sensor / Standard Gear</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="px-3 py-1.5 font-bold text-indigo-600">quantity</td>
                    <td className="px-3 py-1.5 text-slate-500">Number</td>
                    <td className="px-3 py-1.5 text-slate-600">45 (Units sold)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 font-bold text-indigo-600">revenue</td>
                    <td className="px-3 py-1.5 text-slate-500">Number ($)</td>
                    <td className="px-3 py-1.5 text-slate-600">4250.00 (Gross billed amount)</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="px-3 py-1.5 font-bold text-indigo-600">cost</td>
                    <td className="px-3 py-1.5 text-slate-500">Number ($)</td>
                    <td className="px-3 py-1.5 text-slate-600">1200.00 (COGS / product cost)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 font-bold text-indigo-600">discount</td>
                    <td className="px-3 py-1.5 text-slate-500">Number ($)</td>
                    <td className="px-3 py-1.5 text-slate-600">150.00 (Deduction granted)</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="px-3 py-1.5 font-bold text-indigo-600">outstandingAmount</td>
                    <td className="px-3 py-1.5 text-slate-500">Number ($)</td>
                    <td className="px-3 py-1.5 text-slate-600">800.00 (Unpaid debt / receivable)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 font-bold text-indigo-600">region</td>
                    <td className="px-3 py-1.5 text-slate-500">String</td>
                    <td className="px-3 py-1.5 text-slate-600">North, South, East, West</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              * Headers are matched flexibly (e.g., "customer" or "client" maps to customerName; "amount" or "sales" maps to revenue).
            </p>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/80 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={exportTemplateSpecToPdf}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Download full specification manual in PDF format"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Download Spec (PDF)</span>
            </button>
            <button
              onClick={onDownloadTemplate}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download CSV Template</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormatGuideModal;
