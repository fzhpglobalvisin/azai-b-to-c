// components/DataUploader.tsx — Layer 1 & 2 UI Shell
import React, { useRef, useState } from 'react';
import { Upload, HelpCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { SalesRecord, DatasetInfo, ValidationResult, LoaderMetadata } from '../types';
import { loadFile } from '../services/dataLoader';
import { validateRows } from '../services/dataValidator';
import ValidationReport from './ValidationReport';

interface DataUploaderProps {
  onDataLoaded: (data: SalesRecord[], info: DatasetInfo) => void;
  onOpenFormatGuide: () => void;
  onOpenPdfInsights?: (file?: File) => void;
}

const DataUploader: React.FC<DataUploaderProps> = ({ 
  onDataLoaded, 
  onOpenFormatGuide,
  onOpenPdfInsights 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Pending validation state for the modal
  const [pendingValidation, setPendingValidation] = useState<{
    result: ValidationResult;
    metadata: LoaderMetadata;
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user uploaded a PDF or text file for document intelligence
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
      if (onOpenPdfInsights) {
        onOpenPdfInsights(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Reading & extracting file data...');

    try {
      // 1. Data Loader (Layer 1)
      const loaderResult = await loadFile(file);

      if (!loaderResult.rows || loaderResult.rows.length === 0) {
        throw new Error('No readable data records found in this file.');
      }

      setStatusMessage('Validating schema & business metrics...');

      // 2. Data Validation Engine (Layer 2)
      const validationResult = validateRows(loaderResult.rows);

      if (validationResult.valid.length === 0) {
        throw new Error(`Data validation failed: all ${validationResult.summary.totalRows} rows had unrecoverable errors.`);
      }

      // If there are warnings or errors or auto-fixed items, show the validation report for user awareness
      if (validationResult.errors.length > 0 || validationResult.warnings.length > 0) {
        setPendingValidation({
          result: validationResult,
          metadata: loaderResult.metadata,
        });
      } else {
        // Clean dataset: directly import
        finalizeImport(validationResult.valid, loaderResult.metadata, validationResult);
      }
    } catch (err: any) {
      console.error('File import error:', err);
      setErrorMessage(`Import error: ${err.message || 'Failed to process file'}`);
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const finalizeImport = (
    records: SalesRecord[],
    metadata: LoaderMetadata,
    validationResult: ValidationResult
  ) => {
    const info: DatasetInfo = {
      name: metadata.fileName,
      recordCount: records.length,
      uploadedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      }),
      sourceType: 'uploaded',
      fileSize: metadata.fileSize,
      validationSummary: validationResult.summary,
      schema: validationResult.schema,
    };

    onDataLoaded(records, info);
    setPendingValidation(null);
  };

  const handleValidationProceed = () => {
    if (!pendingValidation) return;
    finalizeImport(
      pendingValidation.result.valid,
      pendingValidation.metadata,
      pendingValidation.result
    );
  };

  return (
    <div className="flex items-center gap-2">
      {errorMessage && (
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[220px]">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-1 text-rose-400 hover:text-rose-600 font-bold"
          >
            ×
          </button>
        </div>
      )}

      <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all shadow-sm active:scale-95">
        {isProcessing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        <span>{isProcessing ? statusMessage || 'Loading...' : 'Import Data & Media'}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt,.json,.zip,.pdf,.png,.jpg,.jpeg,.xlsx,.xls"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isProcessing}
        />
      </label>

      <button
        onClick={onOpenFormatGuide}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        title="View supported data formats: Excel, SAP-CSV, CSV, JSON, PDF"
        aria-label="Format guide"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {onOpenPdfInsights && (
        <button
          onClick={() => onOpenPdfInsights()}
          className="hidden xl:flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          title="Analyze PDF documents for executive insights without modifying dataset"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          <span>PDF Insights (No DB impact)</span>
        </button>
      )}

      {/* Validation Report Modal */}
      {pendingValidation && (
        <ValidationReport
          isOpen={!!pendingValidation}
          onClose={() => setPendingValidation(null)}
          validationResult={pendingValidation.result}
          onProceed={handleValidationProceed}
          fileName={pendingValidation.metadata.fileName}
        />
      )}
    </div>
  );
};

export default DataUploader;