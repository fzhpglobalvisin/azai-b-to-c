import React, { useState, useMemo } from 'react';
import { SalesRecord, DatasetInfo } from '../types';
import { 
  FileSpreadsheet, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  RotateCcw, 
  Upload, 
  CheckCircle2, 
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { exportDatasetToPdf } from '../services/pdfReportGenerator';

interface DatasetExplorerProps {
  data: any[];
  datasetInfo: DatasetInfo;
  onResetToSample: () => void;
  onOpenUpload: () => void;
  onOpenFormatGuide: () => void;
}

const formatLabel = (str: string): string => 
  str ? str.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()) : '';

const DatasetExplorer: React.FC<DatasetExplorerProps> = ({
  data,
  datasetInfo,
  onResetToSample,
  onOpenUpload,
  onOpenFormatGuide
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter1, setCategoryFilter1] = useState<string>('ALL');
  const [categoryFilter2, setCategoryFilter2] = useState<string>('ALL');
  
  // Extract all columns dynamically from schema or dataset
  const allColumns = useMemo<string[]>(() => {
    if (datasetInfo.schema?.columns && datasetInfo.schema.columns.length > 0) {
      return datasetInfo.schema.columns;
    }
    if (data.length > 0) {
      return Object.keys(data[0]);
    }
    return [];
  }, [datasetInfo.schema, data]);

  // Extract numeric columns dynamically
  const numericColsSet = useMemo<Set<string>>(() => {
    if (datasetInfo.schema?.numericColumns && datasetInfo.schema.numericColumns.length > 0) {
      return new Set(datasetInfo.schema.numericColumns);
    }
    const set = new Set<string>();
    allColumns.forEach(col => {
      const isNum = data.some(row => {
        const val = row[col];
        return val !== null && val !== undefined && val !== '' && !isNaN(Number(val));
      });
      if (isNum) set.add(col);
    });
    return set;
  }, [datasetInfo.schema, allColumns, data]);

  // Extract categorical columns dynamically
  const categoricalCols = useMemo<string[]>(() => {
    if (datasetInfo.schema?.categoricalColumns && datasetInfo.schema.categoricalColumns.length > 0) {
      return datasetInfo.schema.categoricalColumns;
    }
    return allColumns.filter(c => !numericColsSet.has(c));
  }, [datasetInfo.schema, allColumns, numericColsSet]);

  const catCol1 = categoricalCols[0] || null;
  const catCol2 = categoricalCols.length > 1 ? categoricalCols[1] : null;

  const catOptions1 = useMemo(() => {
    if (!catCol1) return [];
    return Array.from(new Set(data.map(r => String(r[catCol1] || '')).filter(Boolean))).slice(0, 30);
  }, [data, catCol1]);

  const catOptions2 = useMemo(() => {
    if (!catCol2) return [];
    return Array.from(new Set(data.map(r => String(r[catCol2] || '')).filter(Boolean))).slice(0, 30);
  }, [data, catCol2]);

  // Sorting state
  const [sortField, setSortField] = useState<string>(allColumns[0] || '');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Real-time dynamic column sums across full dataset for summary cards
  const columnSumsFull = useMemo(() => {
    const sums: Record<string, number> = {};
    numericColsSet.forEach(col => {
      sums[col] = data.reduce((acc, row) => acc + (Number(row[col]) || 0), 0);
    });
    return sums;
  }, [data, numericColsSet]);

  // Check if active filters exist
  const isFiltered = Boolean(
    searchTerm.trim() ||
    (catCol1 && categoryFilter1 !== 'ALL') ||
    (catCol2 && categoryFilter2 !== 'ALL')
  );

  // Filtered and Sorted Records
  const filteredData = useMemo(() => {
    return data.filter(row => {
      if (catCol1 && categoryFilter1 !== 'ALL' && String(row[catCol1]) !== categoryFilter1) {
        return false;
      }
      if (catCol2 && categoryFilter2 !== 'ALL' && String(row[catCol2]) !== categoryFilter2) {
        return false;
      }

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return allColumns.some(col => {
        const val = row[col];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
      });
    }).sort((a, b) => {
      if (!sortField) return 0;
      const valA = a[sortField];
      const valB = b[sortField];
      if (numericColsSet.has(sortField)) {
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return sortAsc ? numA - numB : numB - numA;
      }
      return sortAsc 
        ? String(valA ?? '').localeCompare(String(valB ?? '')) 
        : String(valB ?? '').localeCompare(String(valA ?? ''));
    });
  }, [data, searchTerm, catCol1, categoryFilter1, catCol2, categoryFilter2, allColumns, sortField, sortAsc, numericColsSet]);

  // Real-time sum of EVERY numeric column for filtered dataset (shown on top of relevant column)
  const filteredSums = useMemo(() => {
    const sums: Record<string, number> = {};
    numericColsSet.forEach(col => {
      sums[col] = filteredData.reduce((acc, r) => acc + (Number(r[col]) || 0), 0);
    });
    return sums;
  }, [filteredData, numericColsSet]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0 || allColumns.length === 0) return;
    const headers = allColumns.map(c => `"${formatLabel(c).replace(/"/g, '""')}"`);
    const rows = filteredData.map(r => 
      allColumns.map(c => {
        const val = r[c];
        if (typeof val === 'number') return val;
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${(datasetInfo.name || 'dataset').replace(/\s+/g, '_')}_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with Real Dataset Identity */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{datasetInfo.name}</h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  datasetInfo.sourceType === 'uploaded' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  {datasetInfo.sourceType === 'uploaded' ? 'User Uploaded Dataset' : 'Sample Dataset'}
                </span>
                {datasetInfo.fileSize && (
                  <span className="text-xs text-slate-400 font-mono">({datasetInfo.fileSize})</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                <span>Loaded: <strong className="text-slate-700">{datasetInfo.uploadedAt}</strong></span>
                <span>•</span>
                <span>Total Records: <strong className="text-slate-700">{data.length.toLocaleString()} rows</strong></span>
                <span>•</span>
                <span>Detected Columns: <strong className="text-slate-700">{allColumns.length} fields</strong> ({numericColsSet.size} numeric)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenFormatGuide}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Learn what file formats can be uploaded"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Format Guide</span>
            </button>
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload New Dataset</span>
            </button>
            <button
              onClick={() => exportDatasetToPdf(filteredData, datasetInfo, allColumns)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download structured dataset report as PDF"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download filtered records as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            {datasetInfo.sourceType === 'uploaded' && (
              <button
                onClick={onResetToSample}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Reset to default sample dataset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Sample</span>
              </button>
            )}
          </div>
        </div>

        {/* Dataset Summary Cards — dynamically generated from real numeric columns */}
        {numericColsSet.size > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
            {Array.from(numericColsSet).slice(0, 6).map((col) => {
              const totalVal = columnSumsFull[col] || 0;
              const isMoney = col.toLowerCase().includes('rev') || col.toLowerCase().includes('cost') || col.toLowerCase().includes('price') || col.toLowerCase().includes('amount') || col.toLowerCase().includes('disc') || col.toLowerCase().includes('profit');
              return (
                <div key={col} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider truncate" title={formatLabel(col)}>
                    {formatLabel(col)}
                  </p>
                  <p className="text-base font-bold text-slate-800 mt-0.5 truncate font-mono">
                    {isMoney ? `$${Math.round(totalVal).toLocaleString()}` : totalVal.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Search & Dynamic Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search across ${allColumns.length} columns...`}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {catCol1 && catOptions1.length > 0 && (
              <select
                value={categoryFilter1}
                onChange={(e) => { setCategoryFilter1(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="ALL">All {formatLabel(catCol1)} ({catOptions1.length})</option>
                {catOptions1.map(val => <option key={val} value={val}>{val}</option>)}
              </select>
            )}

            {catCol2 && catOptions2.length > 0 && (
              <select
                value={categoryFilter2}
                onChange={(e) => { setCategoryFilter2(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="ALL">All {formatLabel(catCol2)} ({catOptions2.length})</option>
                {catOptions2.map(val => <option key={val} value={val}>{val}</option>)}
              </select>
            )}

            {isFiltered && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter1('ALL');
                  setCategoryFilter2('ALL');
                  setCurrentPage(1);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Showing <strong>{filteredData.length}</strong> of <strong>{data.length}</strong> records</span>
            {isFiltered && numericColsSet.size > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-medium">
                <span className="font-semibold text-indigo-900">Filtered Sums:</span>
                {Array.from(numericColsSet).slice(0, 3).map((col, idx) => (
                  <React.Fragment key={col}>
                    {idx > 0 && <span className="text-slate-300">·</span>}
                    <strong className="text-slate-900">
                      {Math.round(filteredSums[col] || 0).toLocaleString()} {formatLabel(col)}
                    </strong>
                  </React.Fragment>
                ))}
              </span>
            )}
          </div>
          <span className="text-slate-400">Click table headers to sort</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 select-none">
              <tr>
                {allColumns.map((col, index) => {
                  const isNumeric = numericColsSet.has(col);
                  const isSorted = sortField === col;
                  const isMoney = col.toLowerCase().includes('rev') || col.toLowerCase().includes('cost') || col.toLowerCase().includes('price') || col.toLowerCase().includes('amount') || col.toLowerCase().includes('disc') || col.toLowerCase().includes('profit');
                  const colSum = isNumeric ? (filteredSums[col] ?? 0) : null;

                  return (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className={`px-4 py-2.5 cursor-pointer hover:bg-slate-100 transition-colors ${
                        isNumeric ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div className={`flex flex-col gap-1 ${isNumeric ? 'items-end' : 'items-start'}`}>
                        {/* Top sum / label pill according to user requirement */}
                        {index === 0 ? (
                          <span
                            id={`col-sum-badge-${col}`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                              isFiltered 
                                ? 'bg-indigo-600 text-white shadow-2xs' 
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isFiltered ? 'Filtered Sum' : 'Total Sum'}
                          </span>
                        ) : isNumeric ? (
                          <div 
                            id={`col-sum-${col}`}
                            className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold transition-all whitespace-nowrap ${
                              isFiltered 
                                ? 'bg-indigo-100 text-indigo-950 border border-indigo-200 ring-1 ring-indigo-200/50 shadow-2xs' 
                                : 'bg-slate-100 text-slate-800 border border-slate-200/80'
                            }`}
                            title={`Sum of ${formatLabel(col)}: ${isMoney ? '$' : ''}${Math.round(colSum || 0).toLocaleString()}`}
                          >
                            <span className="text-[9px] text-slate-400 font-sans font-normal uppercase mr-1">Σ</span>
                            {isMoney ? `$${Math.round(colSum || 0).toLocaleString()}` : (colSum !== null ? Math.round(colSum).toLocaleString() : '0')}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 font-normal py-0.5 select-none leading-tight">—</span>
                        )}

                        <div className={`flex items-center gap-1 ${isNumeric ? 'justify-end' : 'justify-start'}`}>
                          <span className="truncate max-w-[140px]" title={col}>{formatLabel(col)}</span>
                          {isSorted ? (
                            sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600 shrink-0" /> : <ArrowDown className="w-3 h-3 text-indigo-600 shrink-0" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {allColumns.map((col) => {
                      const val = row[col];
                      const isNumeric = numericColsSet.has(col);
                      const isMoney = isNumeric && (col.toLowerCase().includes('rev') || col.toLowerCase().includes('cost') || col.toLowerCase().includes('price') || col.toLowerCase().includes('amount') || col.toLowerCase().includes('disc') || col.toLowerCase().includes('profit'));

                      return (
                        <td 
                          key={col} 
                          className={`px-4 py-3 whitespace-nowrap text-xs ${
                            isNumeric 
                              ? 'text-right font-mono font-semibold text-slate-800' 
                              : 'text-left text-slate-700'
                          }`}
                        >
                          {isNumeric && typeof val === 'number'
                            ? (isMoney ? `$${val.toLocaleString()}` : val.toLocaleString())
                            : (val !== null && val !== undefined ? String(val) : '—')}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Math.max(1, allColumns.length)} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-base font-semibold text-slate-600">No matching records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search terms or filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer — "page < > bring on left" explicitly implemented on left side */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          {/* Left: Page < > controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <span>Page</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs shadow-2xs">
                {currentPage}
              </span>
              <span>of</span>
              <span className="font-bold text-slate-900">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                id="dataset-pagination-prev-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer text-slate-700 shadow-2xs"
                title="Previous Page"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="dataset-pagination-next-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer text-slate-700 shadow-2xs"
                title="Next Page"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-slate-400 text-xs ml-1">
              ({filteredData.length} records)
            </span>
          </div>

          {/* Right: Showing row range */}
          <div className="text-slate-500 text-xs font-mono">
            {filteredData.length > 0 
              ? `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filteredData.length)} of ${filteredData.length} items`
              : '0 items'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetExplorer;
