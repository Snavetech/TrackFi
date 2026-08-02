import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import {
  parseTransactionsFile,
  getSpreadsheetSheets,
  getWorksheetRawRows,
  autoDetectColumns,
  downloadSampleCSVTemplate,
  ParsedImportRow,
  ColumnMapping
} from '../../lib/importUtils';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ImportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportTransactionsModal: React.FC<ImportTransactionsModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, addTransactionsBulk } = useFinancial();
  const { currencySymbol } = useAuth();

  const [parsedRows, setParsedRows] = useState<ParsedImportRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [showMappingConfig, setShowMappingConfig] = useState<boolean>(false);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [excludeSweeps, setExcludeSweeps] = useState<boolean>(false);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const maxCols = useMemo(() => {
    if (!rawRows || rawRows.length === 0) return 0;
    return Math.max(...rawRows.slice(0, 30).map(r => (Array.isArray(r) ? r.length : 0)));
  }, [rawRows]);

  const columnOptions = useMemo(() => {
    const options: { index: number; label: string }[] = [{ index: -1, label: '-- Not Mapped / Auto --' }];
    for (let c = 0; c < maxCols; c++) {
      let sampleVal = '';
      const startRow = (columnMapping?.headerRowIndex ?? -1) >= 0 ? (columnMapping?.headerRowIndex ?? 0) + 1 : 0;
      for (let r = startRow; r < Math.min(startRow + 5, rawRows.length); r++) {
        if (rawRows[r] && rawRows[r][c] !== undefined && rawRows[r][c] !== '') {
          sampleVal = String(rawRows[r][c]).trim();
          break;
        }
      }
      const headerName = (columnMapping?.headerRowIndex ?? -1) >= 0 && rawRows[columnMapping!.headerRowIndex]?.[c]
        ? String(rawRows[columnMapping!.headerRowIndex][c]).trim()
        : '';
      const nameTag = headerName ? `"${headerName}"` : `Col ${c + 1}`;
      const valTag = sampleVal ? ` (${sampleVal.substring(0, 15)})` : '';
      options.push({ index: c, label: `${nameTag}${valTag}` });
    }
    return options;
  }, [rawRows, maxCols, columnMapping?.headerRowIndex]);

  if (!isOpen) return null;

  const processFileBuffer = (buffer: ArrayBuffer, sheetName: string, sweeps: boolean, mappingOverride?: ColumnMapping) => {
    const { rawRows: extractedRows, sheetNames } = getWorksheetRawRows(buffer, sheetName);
    setRawRows(extractedRows);

    const activeMapping = mappingOverride || autoDetectColumns(extractedRows);
    setColumnMapping(activeMapping);

    const rows = parseTransactionsFile(buffer, sheetName, sweeps, activeMapping);
    setParsedRows(rows);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setImportSuccessCount(null);
    setShowMappingConfig(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        setFileBuffer(buffer);
        const sheets = getSpreadsheetSheets(buffer);
        setAvailableSheets(sheets);
        const initialSheet = sheets.length > 0 ? sheets[0] : '';
        setSelectedSheet(initialSheet);

        processFileBuffer(buffer, initialSheet, excludeSweeps);
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (fileBuffer) {
      setIsProcessing(true);
      setTimeout(() => {
        processFileBuffer(fileBuffer, sheetName, excludeSweeps);
        setIsProcessing(false);
      }, 50);
    }
  };

  const handleToggleSweeps = (checked: boolean) => {
    setExcludeSweeps(checked);
    if (fileBuffer && columnMapping) {
      setIsProcessing(true);
      setTimeout(() => {
        const rows = parseTransactionsFile(fileBuffer, selectedSheet, checked, columnMapping);
        setParsedRows(rows);
        setIsProcessing(false);
      }, 50);
    }
  };

  const handleUpdateMappingField = <K extends keyof ColumnMapping>(field: K, value: ColumnMapping[K]) => {
    if (!columnMapping || !fileBuffer) return;
    const updated: ColumnMapping = { ...columnMapping, [field]: value };
    setColumnMapping(updated);
    const rows = parseTransactionsFile(fileBuffer, selectedSheet, excludeSweeps, updated);
    setParsedRows(rows);
  };

  const validRows = parsedRows.filter(r => r.isValid);

  const handleConfirmImport = () => {
    if (validRows.length === 0) return;

    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase().trim(), c.id]));
    const colorPalette = ['#6e44ff', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#3b82f6', '#14b8a6', '#ef4444'];
    let colorIdx = 0;

    const pickIconForCategory = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('saving') || n.includes('invest') || n.includes('owealth')) return 'PiggyBank';
      if (n.includes('transfer') || n.includes('bank')) return 'Repeat';
      if (n.includes('food') || n.includes('grocer') || n.includes('eat')) return 'Utensils';
      if (n.includes('transport') || n.includes('ride') || n.includes('fuel')) return 'Car';
      if (n.includes('utility') || n.includes('power') || n.includes('data') || n.includes('bill')) return 'Zap';
      if (n.includes('salary') || n.includes('income') || n.includes('pay')) return 'Briefcase';
      if (n.includes('shop') || n.includes('store')) return 'ShoppingBag';
      if (n.includes('health') || n.includes('medical')) return 'Activity';
      return 'Tag';
    };

    validRows.forEach(r => {
      const rawCatName = r.category_name?.trim();
      if (rawCatName && !categoryMap.has(rawCatName.toLowerCase())) {
        const catKey = rawCatName.toLowerCase();
        const icon = pickIconForCategory(rawCatName);
        const color = colorPalette[colorIdx % colorPalette.length];
        colorIdx++;

        addCategory({
          name: rawCatName,
          type: r.type || 'expense',
          icon: icon,
          color: color,
        });

        const generatedId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        categoryMap.set(catKey, generatedId);
      }
    });

    const formattedForContext = validRows.map(r => {
      const rawCatName = r.category_name?.trim().toLowerCase();
      const matchedCatId = rawCatName ? categoryMap.get(rawCatName) : null;
      return {
        type: r.type,
        amount: r.amount,
        category_id: matchedCatId || null,
        date: r.date,
        description: r.description,
        payment_method: r.payment_method || 'Bank Transfer',
        is_recurring: r.is_recurring || false,
        recurrence_interval: r.recurrence_interval || null,
      };
    });

    addTransactionsBulk(formattedForContext, replaceExisting);
    setImportSuccessCount(validRows.length);

    setTimeout(() => {
      setParsedRows([]);
      setFileName('');
      setImportSuccessCount(null);
      onClose();
    }, 1200);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#332a54]/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white border border-purple-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-50 bg-[#f4f0f8]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-50 text-[#6e44ff] border border-purple-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#332a54]">Import Transactions</h2>
              <p className="text-[11px] text-[#8b849c]">Upload any Excel statement (.xlsx, .xls) or CSV file</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#8b849c] hover:text-[#332a54] hover:bg-purple-50 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* File Upload Zone & Template Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
            <div className="flex items-center gap-3">
              <UploadCloud className="w-8 h-8 text-[#6e44ff] shrink-0" />
              <div>
                <p className="font-bold text-[#332a54]">Select CSV or Excel File</p>
                <p className="text-[11px] text-[#8b849c]">Works with GTBank, Zenith, OPay, Kuda, Moniepoint, FirstBank, UBA, & custom spreadsheets</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadSampleCSVTemplate}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-purple-50 text-[#6e44ff] rounded-xl text-xs font-semibold border border-purple-100 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sample CSV</span>
              </button>

              <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/20 transition active:scale-95">
                <span>Browse File</span>
                <input
                  type="file"
                  accept=".csv, .tsv, .txt, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Success Banner */}
          {importSuccessCount !== null && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm">Successfully imported {importSuccessCount} transactions!</span>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="py-12 text-center text-[#8b849c] space-y-2">
              <div className="w-6 h-6 border-2 border-[#6e44ff] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-medium text-xs">Parsing spreadsheet content & detecting columns...</p>
            </div>
          )}

          {/* Sheet Selector Bar for Multi-sheet Excel Files */}
          {!isProcessing && availableSheets.length > 1 && (
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#332a54] font-semibold">
                <Layers className="w-4 h-4 text-[#6e44ff]" />
                <span>Workbook contains {availableSheets.length} sheets:</span>
              </div>
              <select
                value={selectedSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
                className="px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-[#332a54] font-bold focus:outline-none focus:border-[#6e44ff] shadow-sm"
              >
                {availableSheets.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
                <option value="all">All Sheets Combined</option>
              </select>
            </div>
          )}

          {/* Interactive Column Mapping Panel Toggle */}
          {!isProcessing && columnMapping && (
            <div className="rounded-2xl border border-purple-100 bg-purple-50/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowMappingConfig(!showMappingConfig)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-purple-100/40 transition text-xs font-bold text-[#332a54]"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#6e44ff]" />
                  <span>Configure Column Mapping</span>
                  <span className="text-[10px] font-normal text-[#8b849c] bg-white px-2 py-0.5 rounded-full border border-purple-100">
                    {columnMapping.headerRowIndex >= 0 ? `Header on Row ${columnMapping.headerRowIndex + 1}` : 'Headerless Format'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#6e44ff]">
                  <span className="text-[11px] font-semibold">{showMappingConfig ? 'Hide Mapping' : 'Adjust Mapping'}</span>
                  {showMappingConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showMappingConfig && (
                <div className="p-4 pt-2 border-t border-purple-100/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Header Row Selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8b849c]">Table Header Row</label>
                    <select
                      value={columnMapping.headerRowIndex}
                      onChange={(e) => handleUpdateMappingField('headerRowIndex', Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-[#332a54] font-medium focus:outline-none focus:border-[#6e44ff]"
                    >
                      <option value={-1}>Headerless (Data starts on Row 1)</option>
                      {rawRows.slice(0, 30).map((r, rIdx) => {
                        const preview = r.filter(Boolean).map(c => String(c).trim()).join(' | ').substring(0, 35);
                        return (
                          <option key={rIdx} value={rIdx}>
                            Row {rIdx + 1}: {preview || 'Blank Row'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Date Column */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8b849c]">Transaction Date Column</label>
                    <select
                      value={columnMapping.dateCol}
                      onChange={(e) => handleUpdateMappingField('dateCol', Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-[#332a54] font-medium focus:outline-none focus:border-[#6e44ff]"
                    >
                      {columnOptions.map(opt => (
                        <option key={opt.index} value={opt.index}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description Column */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8b849c]">Description / Narration Column</label>
                    <select
                      value={columnMapping.descriptionCol}
                      onChange={(e) => handleUpdateMappingField('descriptionCol', Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-[#332a54] font-medium focus:outline-none focus:border-[#6e44ff]"
                    >
                      {columnOptions.map(opt => (
                        <option key={opt.index} value={opt.index}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Format Mode */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8b849c]">Amount Layout</label>
                    <select
                      value={columnMapping.amountMode}
                      onChange={(e) => handleUpdateMappingField('amountMode', e.target.value as 'single' | 'dual')}
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-[#332a54] font-bold focus:outline-none focus:border-[#6e44ff]"
                    >
                      <option value="dual">Dual Debit & Credit Columns (Money Out / Money In)</option>
                      <option value="single">Single Amount Column (+/- or Type)</option>
                    </select>
                  </div>

                  {columnMapping.amountMode === 'dual' ? (
                    <>
                      {/* Debit Column */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#8b849c]">Debit Column (Money Out / Expense)</label>
                        <select
                          value={columnMapping.debitCol}
                          onChange={(e) => handleUpdateMappingField('debitCol', Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-[#332a54] font-medium focus:outline-none focus:border-[#6e44ff]"
                        >
                          {columnOptions.map(opt => (
                            <option key={opt.index} value={opt.index}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Credit Column */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#8b849c]">Credit Column (Money In / Income)</label>
                        <select
                          value={columnMapping.creditCol}
                          onChange={(e) => handleUpdateMappingField('creditCol', Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-[#332a54] font-medium focus:outline-none focus:border-[#6e44ff]"
                        >
                          {columnOptions.map(opt => (
                            <option key={opt.index} value={opt.index}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Single Amount Column */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#8b849c]">Amount Column</label>
                        <select
                          value={columnMapping.amountCol}
                          onChange={(e) => handleUpdateMappingField('amountCol', Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-[#332a54] font-medium focus:outline-none focus:border-[#6e44ff]"
                        >
                          {columnOptions.map(opt => (
                            <option key={opt.index} value={opt.index}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Type Column */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#8b849c]">Type Column (CR/DR or Income/Expense)</label>
                        <select
                          value={columnMapping.typeCol}
                          onChange={(e) => handleUpdateMappingField('typeCol', Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-[#332a54] font-medium focus:outline-none focus:border-[#6e44ff]"
                        >
                          {columnOptions.map(opt => (
                            <option key={opt.index} value={opt.index}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Category Column */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#8b849c]">Category Column (Optional)</label>
                    <select
                      value={columnMapping.categoryCol}
                      onChange={(e) => handleUpdateMappingField('categoryCol', Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-[#332a54] font-medium focus:outline-none focus:border-[#6e44ff]"
                    >
                      {columnOptions.map(opt => (
                        <option key={opt.index} value={opt.index}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Options Checkboxes */}
          {!isProcessing && parsedRows.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-purple-100/80 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#332a54] font-medium">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded border-purple-300 text-[#6e44ff] focus:ring-[#6e44ff]"
                />
                <span>Replace existing ledger entries with this import</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#332a54] font-medium">
                <input
                  type="checkbox"
                  checked={excludeSweeps}
                  onChange={(e) => handleToggleSweeps(e.target.checked)}
                  className="rounded border-purple-300 text-[#6e44ff] focus:ring-[#6e44ff]"
                />
                <span>Exclude internal OPay/Bank wallet sweeps</span>
              </label>
            </div>
          )}

          {/* Preview Table */}
          {!isProcessing && parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#332a54]">
                  Preview ({validRows.length} valid / {parsedRows.length} total rows found)
                </span>
                {fileName && <span className="text-[11px] text-[#8b849c] font-mono">{fileName}</span>}
              </div>

              <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-xs">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs text-[#332a54]">
                    <thead className="bg-[#f4f0f8]/70 border-b border-purple-50 sticky top-0 uppercase text-[10px] font-bold text-[#8b849c]">
                      <tr>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Description</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50">
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} className={row.isValid ? 'hover:bg-purple-50/30' : 'bg-rose-50/30'}>
                          <td className="px-4 py-2.5 font-mono text-[#8b849c]">{row.date}</td>
                          <td className="px-4 py-2.5 font-bold">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${row.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {row.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {row.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-medium">{row.description}</td>
                          <td className="px-4 py-2.5 text-[#8b849c]">{row.category_name || 'General'}</td>
                          <td className={`px-4 py-2.5 text-right font-mono font-bold ${row.type === 'income' ? 'text-emerald-600' : 'text-[#332a54]'}`}>
                            {currencySymbol}{row.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-purple-50 bg-[#f4f0f8]/30 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#8b849c]">
            {validRows.length > 0 ? `Ready to import ${validRows.length} entries` : 'No file selected yet'}
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#8b849c] hover:text-[#332a54] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={validRows.length === 0 || importSuccessCount !== null}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#6e44ff] hover:bg-[#5b32e0] text-white rounded-2xl text-xs font-bold shadow-md shadow-purple-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import {validRows.length} Entries</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

