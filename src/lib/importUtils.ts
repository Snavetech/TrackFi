import { TransactionType, RecurrenceInterval, Transaction } from '../types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export interface ParsedImportRow {
  date: string;
  type: TransactionType;
  category_name?: string;
  description: string;
  amount: number;
  payment_method?: string;
  is_recurring?: boolean;
  recurrence_interval?: RecurrenceInterval | null;
  isValid: boolean;
  error?: string;
}

export interface ColumnMapping {
  headerRowIndex: number; // -1 for headerless
  dateCol: number;
  typeCol: number;
  categoryCol: number;
  descriptionCol: number;
  amountMode: 'single' | 'dual';
  amountCol: number;
  debitCol: number;
  creditCol: number;
  methodCol: number;
  refCol: number;
}

/**
 * Downloads a sample CSV template for transaction imports
 */
export function downloadSampleCSVTemplate() {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method'];
  const sampleRows = [
    ['2026-08-01', 'income', 'Monthly Household Salary', 'Monthly Salary Payment', '77000.00', 'Bank Transfer'],
    ['2026-08-02', 'expense', 'Food & Groceries', 'Supermarket Supplies', '12500.00', 'Debit Card'],
    ['2026-08-03', 'expense', 'Transportation', 'Commercial Bus Fare', '2500.00', 'Cash'],
    ['2026-08-04', 'expense', 'Utilities & Data', 'Prepaid Electricity Token', '5000.00', 'Mobile App']
  ];

  const csvContent = [headers.join(','), ...sampleRows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sample_transaction_import_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper to clean binary or control characters from text strings
 */
export function sanitizeText(str: any): string {
  if (str === null || str === undefined) return '';
  const text = String(str);
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/g, '').trim();
}

/**
 * Checks if a description text is blank, dashes, or uninformative placeholder
 */
export function isBlankOrDash(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  return trimmed === '' || /^[-_\s\.\/]+$/.test(trimmed) || /^(n\/a|null|undefined|none|--|-)$/i.test(trimmed);
}

/**
 * Checks if a transaction is corrupted or blank from a previous invalid import
 */
export function isCorruptedTransaction(t: Transaction): boolean {
  if (!t) return false;
  const desc = t.description || '';
  if (isBlankOrDash(desc)) return true;
  
  const hasBinaryChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/.test(desc);
  const hasZipMarkers = /xl\/workbook|workbook\.xml|PK\x03\x04/i.test(desc);
  const isAbsurdAmount = t.amount > 100_000_000_000;

  return hasBinaryChars || hasZipMarkers || isAbsurdAmount;
}

/**
 * Infer smart category from transaction description keywords
 */
export function inferCategory(description: string): string {
  const desc = description.toLowerCase();
  if (/owealth|spend & save|savings|vault|auto-save|deposit to savings|interest|investment|fixed deposit/i.test(desc)) {
    return 'Savings & Investments';
  }
  if (/transfer|monie point|opay|palmpay|kuda|zenith|gtb|first bank|uba|access|sterling|wema|fcmb|stanbic|fidelity|union bank|bank|nip/i.test(desc)) {
    return 'Transfers & Banking';
  }
  if (/airtime|data|recharge|vtu|electricity|aedc|ikedc|ekedc|dstv|gotv|cable|internet|spectranet|smile|nepa|phcn/i.test(desc)) {
    return 'Utilities & Data';
  }
  if (/food|suya|supermarket|eatery|restaurant|groceries|chicken|bukka|pizza|buka|kitchen|market|fast food/i.test(desc)) {
    return 'Food & Groceries';
  }
  if (/fuel|gas|filling station|transport|uber|bolt|ride|bus|fare|flight|airline|pos/i.test(desc)) {
    return 'Transportation';
  }
  if (/salary|payday|payroll|stipend|allowance|wage|bonus/i.test(desc)) {
    return 'Salary & Income';
  }
  return 'General';
}

/**
 * Parse date strings into standard YYYY-MM-DD format with support for various date representations
 */
export function parseDateStr(rawDate: any): string {
  if (rawDate === null || rawDate === undefined) return format(new Date(), 'yyyy-MM-DD');

  // If XLSX parsed cell as Date object
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    return format(rawDate, 'yyyy-MM-dd');
  }

  // Handle Excel serial date numbers (e.g. 45432)
  if (typeof rawDate === 'number' && rawDate > 20000 && rawDate < 60000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + rawDate * 86400 * 1000);
    if (!isNaN(jsDate.getTime())) {
      return format(jsDate, 'yyyy-MM-dd');
    }
  }

  const str = sanitizeText(rawDate);
  if (isBlankOrDash(str)) return format(new Date(), 'yyyy-MM-dd');

  // Match ISO YYYY-MM-DD
  const isoMatch = str.match(/(\d{4})[-/\.](\d{1,2})[-/\.](\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const pad = (n: string) => n.padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  // Match DD Mon YYYY (e.g. 01 Jul 2026 or 01-Jul-2026)
  const textDateMatch = str.match(/(\d{1,2})[-/\s]+([A-Za-z]{3,9})[-/\s]+(\d{4})/);
  if (textDateMatch) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return format(d, 'yyyy-MM-dd');
    }
  }

  // Match Mon DD, YYYY (e.g. Jul 1, 2026)
  const textDateMatch2 = str.match(/([A-Za-z]{3,9})[-/\s]+(\d{1,2}),?[-/\s]+(\d{4})/);
  if (textDateMatch2) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return format(d, 'yyyy-MM-dd');
    }
  }

  // Match DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = str.match(/(\d{1,2})[-/\.](\d{1,2})[-/\.](\d{4})/);
  if (slashMatch) {
    const [, p1, p2, year] = slashMatch;
    const n1 = parseInt(p1, 10);
    const n2 = parseInt(p2, 10);
    const pad = (n: number) => String(n).padStart(2, '0');

    // If first part > 12, it must be DD/MM/YYYY
    if (n1 > 12) {
      return `${year}-${pad(n2)}-${pad(n1)}`;
    }
    // Default assume DD/MM/YYYY for UK/Nigerian statements unless unambiguous
    return `${year}-${pad(n2)}-${pad(n1)}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return format(d, 'yyyy-MM-dd');
  }

  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Parses numeric monetary values with currency symbol cleaning and negative format handling
 */
export function parseNum(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Math.abs(val);
  }

  const str = sanitizeText(val);
  if (isBlankOrDash(str)) return 0;

  // Clean currency symbols, commas, words
  const isNegative = str.startsWith('-') || str.endsWith('-') || /\(.*\)/.test(str) || /dr/i.test(str);
  const cleaned = str.replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  if (isNaN(n)) return 0;

  return Math.abs(n);
}

/**
 * Returns list of sheet names from an uploaded spreadsheet file
 */
export function getSpreadsheetSheets(data: ArrayBuffer | string): string[] {
  try {
    let workbook: XLSX.WorkBook;
    if (data instanceof ArrayBuffer) {
      workbook = XLSX.read(data, { type: 'array' });
    } else {
      workbook = XLSX.read(data, { type: 'string' });
    }
    return workbook.SheetNames || [];
  } catch {
    return [];
  }
}

/**
 * Get raw 2D array representation of a worksheet
 */
export function getWorksheetRawRows(data: ArrayBuffer | string, targetSheetName?: string): { rawRows: any[][]; sheetNames: string[] } {
  try {
    let workbook: XLSX.WorkBook;
    if (data instanceof ArrayBuffer) {
      workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
    } else {
      workbook = XLSX.read(data, { type: 'string', cellDates: true, dateNF: 'yyyy-mm-dd' });
    }

    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { rawRows: [], sheetNames: [] };
    }

    const sheetName = targetSheetName && workbook.SheetNames.includes(targetSheetName)
      ? targetSheetName
      : workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

    return { rawRows, sheetNames: workbook.SheetNames };
  } catch (err) {
    console.error('Error reading worksheet:', err);
    return { rawRows: [], sheetNames: [] };
  }
}

/**
 * Auto-detect column mapping by scoring top 50 rows against financial header keywords
 */
export function autoDetectColumns(rawRows: any[][]): ColumnMapping {
  const defaultMapping: ColumnMapping = {
    headerRowIndex: -1,
    dateCol: 0,
    typeCol: -1,
    categoryCol: -1,
    descriptionCol: 2,
    amountMode: 'dual',
    amountCol: -1,
    debitCol: 3,
    creditCol: 4,
    methodCol: -1,
    refCol: -1,
  };

  if (!rawRows || rawRows.length === 0) return defaultMapping;

  let bestHeaderIndex = -1;
  let maxScore = 0;
  let bestMap: ColumnMapping = { ...defaultMapping };

  // Search top 50 rows for header row candidates
  const searchLimit = Math.min(50, rawRows.length);
  for (let r = 0; r < searchLimit; r++) {
    const row = rawRows[r];
    if (!row || !Array.isArray(row)) continue;

    const rowStrings = row.map(cell => sanitizeText(cell).toLowerCase().trim());
    
    // Ignore metadata title rows (e.g. "Account Name:", "Statement Period:")
    const isMetadataRow = rowStrings.some(cell => /^account\s*name|^account\s*number|^statement\s*period|^opening\s*balance|^closing\s*balance/i.test(cell));
    if (isMetadataRow) continue;

    let score = 0;
    const mapping: ColumnMapping = {
      headerRowIndex: r,
      dateCol: -1,
      typeCol: -1,
      categoryCol: -1,
      descriptionCol: -1,
      amountMode: 'single',
      amountCol: -1,
      debitCol: -1,
      creditCol: -1,
      methodCol: -1,
      refCol: -1,
    };

    rowStrings.forEach((cell, colIdx) => {
      if (!cell) return;

      if (mapping.dateCol === -1 && /date|time|day|txn date|value date|posting date|trans date|entry date|statement date/i.test(cell)) {
        mapping.dateCol = colIdx;
        score += 3;
      } else if (mapping.debitCol === -1 && /debit|withdrawal|outflow|paid out|expense|dr|money out|withdraw|out/i.test(cell) && !/credit/i.test(cell)) {
        mapping.debitCol = colIdx;
        score += 3;
      } else if (mapping.creditCol === -1 && /credit|deposit|inflow|paid in|income|cr|money in|lodgement|in/i.test(cell) && !/debit/i.test(cell)) {
        mapping.creditCol = colIdx;
        score += 3;
      } else if (mapping.amountCol === -1 && /amount|amt|val|price|sum|total|figure/i.test(cell) && !/debit|credit|balance/i.test(cell)) {
        mapping.amountCol = colIdx;
        score += 3;
      } else if (mapping.descriptionCol === -1 && /desc|narrative|narration|details|merchant|payee|memo|particulars|remarks|title|name|reference|reason|text|summary|party|trans|note/i.test(cell)) {
        mapping.descriptionCol = colIdx;
        score += 3;
      } else if (mapping.typeCol === -1 && /type|kind|flow|transaction type|dr\/cr|c\/d|mode/i.test(cell)) {
        mapping.typeCol = colIdx;
        score += 2;
      } else if (mapping.categoryCol === -1 && /category|cat|classification|tag/i.test(cell)) {
        mapping.categoryCol = colIdx;
        score += 2;
      } else if (mapping.methodCol === -1 && /method|channel|payment|via/i.test(cell)) {
        mapping.methodCol = colIdx;
        score += 1;
      } else if (mapping.refCol === -1 && /ref|reference|txn id|transaction id|id|chq|cheque|rrn/i.test(cell)) {
        mapping.refCol = colIdx;
        score += 1;
      }
    });

    if (mapping.debitCol !== -1 || mapping.creditCol !== -1) {
      mapping.amountMode = 'dual';
    }

    if (score > maxScore) {
      maxScore = score;
      bestHeaderIndex = r;
      bestMap = mapping;
    }
  }

  if (bestHeaderIndex !== -1 && maxScore >= 4) {
    bestMap.headerRowIndex = bestHeaderIndex;
    return bestMap;
  }

  // Headerless bank statement auto-detection heuristic (e.g. OPay / Moniepoint / PalmPay formats)
  const sampleRow = rawRows.find(r => r && Array.isArray(r) && r.length >= 3);
  if (sampleRow) {
    let dateIndex = -1;
    let descIndex = -1;
    let debitIndex = -1;
    let creditIndex = -1;
    let amountIndex = -1;

    sampleRow.forEach((cell, idx) => {
      const text = sanitizeText(cell);
      if (dateIndex === -1 && /\d{2,4}[-/\s][A-Za-z0-9]{2,9}[-/\s]\d{2,4}/.test(text)) {
        dateIndex = idx;
      } else if (descIndex === -1 && isNaN(Number(text.replace(/[^0-9.-]/g, ''))) && text.length > 3) {
        descIndex = idx;
      }
    });

    if (sampleRow.length >= 6 && sampleRow[3] !== undefined && sampleRow[4] !== undefined) {
      // Standard OPay 8-column headerless format: Col 0 Date, Col 2 Narration, Col 3 Debit, Col 4 Credit
      return {
        headerRowIndex: -1,
        dateCol: dateIndex >= 0 ? dateIndex : 0,
        typeCol: -1,
        categoryCol: -1,
        descriptionCol: descIndex >= 0 ? descIndex : 2,
        amountMode: 'dual',
        amountCol: -1,
        debitCol: 3,
        creditCol: 4,
        methodCol: 6,
        refCol: 7,
      };
    }
  }

  return defaultMapping;
}

/**
 * Parses uploaded spreadsheet file (Excel .xlsx, .xls, CSV, TSV) using auto-detected or custom column mapping
 */
export function parseTransactionsFile(
  data: ArrayBuffer | string,
  targetSheetName?: string,
  excludeInternalSweeps: boolean = false,
  customMapping?: ColumnMapping
): ParsedImportRow[] {
  try {
    let workbook: XLSX.WorkBook;

    if (data instanceof ArrayBuffer) {
      workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
    } else {
      workbook = XLSX.read(data, { type: 'string', cellDates: true, dateNF: 'yyyy-mm-dd' });
    }

    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      return [];
    }

    let sheetsToParse: string[] = [];
    if (targetSheetName === 'all') {
      sheetsToParse = workbook.SheetNames;
    } else if (targetSheetName && workbook.SheetNames.includes(targetSheetName)) {
      sheetsToParse = [targetSheetName];
    } else {
      sheetsToParse = [workbook.SheetNames[0]];
    }

    const parsedRows: ParsedImportRow[] = [];
    const seenKeys = new Set<string>();

    for (const sheetName of sheetsToParse) {
      const worksheet = workbook.Sheets[sheetName];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });

      if (!rawRows || rawRows.length === 0) continue;

      const mapping = customMapping || autoDetectColumns(rawRows);
      const dataRows = mapping.headerRowIndex >= 0 ? rawRows.slice(mapping.headerRowIndex + 1) : rawRows;

      for (const row of dataRows) {
        if (!row || !Array.isArray(row) || row.every(cell => sanitizeText(cell) === '')) continue;

        const rawDate = mapping.dateCol >= 0 ? row[mapping.dateCol] : row[0];
        const rawType = mapping.typeCol >= 0 ? sanitizeText(row[mapping.typeCol]) : '';
        const rawCategory = mapping.categoryCol >= 0 ? sanitizeText(row[mapping.categoryCol]) : '';
        
        let description = mapping.descriptionCol >= 0 ? sanitizeText(row[mapping.descriptionCol]) : '';
        if (isBlankOrDash(description)) {
          // Look for best non-numeric text candidate in row
          for (let i = 0; i < row.length; i++) {
            if (i === mapping.dateCol || i === mapping.amountCol || i === mapping.debitCol || i === mapping.creditCol) continue;
            const cand = sanitizeText(row[i]);
            if (!isBlankOrDash(cand) && isNaN(Number(cand.replace(/[^0-9.-]/g, '')))) {
              description = cand;
              break;
            }
          }
        }
        if (isBlankOrDash(description)) description = 'Imported Transaction';

        if (excludeInternalSweeps) {
          const lowerDesc = description.toLowerCase();
          if (/owealth withdrawal|spend & save deposit|auto-save to owealth/i.test(lowerDesc)) {
            continue;
          }
        }

        const rawAmount = mapping.amountCol >= 0 ? sanitizeText(row[mapping.amountCol]) : '';
        const rawDebit = mapping.debitCol >= 0 ? row[mapping.debitCol] : null;
        const rawCredit = mapping.creditCol >= 0 ? row[mapping.creditCol] : null;
        const rawMethod = mapping.methodCol >= 0 ? sanitizeText(row[mapping.methodCol]) : 'Bank Transfer';
        const rawRef = mapping.refCol >= 0 ? sanitizeText(row[mapping.refCol]) : '';

        const debitVal = parseNum(rawDebit);
        const creditVal = parseNum(rawCredit);

        let numAmount = 0;
        let type: TransactionType = 'expense';

        if (mapping.amountMode === 'dual') {
          // Dual Debit / Credit column mode
          if (debitVal > 0 && creditVal === 0) {
            type = 'expense';
            numAmount = debitVal;
          } else if (creditVal > 0 && debitVal === 0) {
            type = 'income';
            numAmount = creditVal;
          } else if (debitVal > 0 && creditVal > 0) {
            if (rawType && /income|credit|deposit|inflow|\+/i.test(rawType)) {
              type = 'income';
              numAmount = creditVal;
            } else {
              type = 'expense';
              numAmount = debitVal;
            }
          } else if (rawAmount) {
            numAmount = parseNum(rawAmount);
            if (rawType && /income|credit|deposit|inflow|\+/i.test(rawType)) type = 'income';
          }
        } else {
          // Single Amount column mode
          const cleanAmountStr = (rawAmount || '').replace(/[^0-9.-]/g, '');
          numAmount = parseNum(cleanAmountStr);
          const isNegativeSign = (rawAmount || '').startsWith('-') || /\(.*\)/.test(rawAmount || '');

          if (rawType) {
            if (/income|credit|deposit|inflow|\+|cr/i.test(rawType)) {
              type = 'income';
            } else if (/expense|debit|withdrawal|outflow|-|dr/i.test(rawType)) {
              type = 'expense';
            }
          } else if (isNegativeSign) {
            type = 'expense';
          } else if (creditVal > 0) {
            type = 'income';
            numAmount = creditVal;
          } else if (debitVal > 0) {
            type = 'expense';
            numAmount = debitVal;
          }
        }

        const parsedDate = parseDateStr(rawDate);
        const categoryName = rawCategory || inferCategory(description);
        const isValid = !isNaN(numAmount) && numAmount > 0 && description.length > 0;

        if (isValid) {
          const dedupKey = `${parsedDate}_${type}_${numAmount.toFixed(2)}_${description.toLowerCase().trim()}_${rawRef}`;
          if (seenKeys.has(dedupKey)) continue;
          seenKeys.add(dedupKey);

          parsedRows.push({
            date: parsedDate,
            type,
            category_name: categoryName,
            description,
            amount: numAmount,
            payment_method: rawMethod || 'Bank Transfer',
            is_recurring: false,
            isValid: true,
          });
        }
      }
    }

    return parsedRows;
  } catch (err) {
    console.error('Failed to parse spreadsheet file:', err);
    return [];
  }
}




