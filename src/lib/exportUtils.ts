import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Budget, Category, FinancialPrediction, SavingsGoal } from '../types';
import { format, parseISO } from 'date-fns';

// Helper to format currency values safely without missing ASCII glyph boxes in jsPDF
function formatPdfCurrency(amount: number, symbol: string = '₦'): string {
  const formattedNum = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Map non-ASCII currency symbols to clean PDF-safe labels
  let safeSymbol = symbol;
  if (symbol === '₦') safeSymbol = 'NGN ';
  else if (symbol === '₹') safeSymbol = 'INR ';
  else if (symbol === 'R') safeSymbol = 'ZAR ';
  else if (symbol === '₵') safeSymbol = 'GHS ';
  else if (symbol === 'KSh') safeSymbol = 'KES ';

  return `${amount < 0 ? '-' : ''}${safeSymbol}${formattedNum}`;
}

function sanitizePdfText(text: string, symbol: string = '₦'): string {
  if (!text) return '';
  let safeSymbol = symbol;
  if (symbol === '₦') safeSymbol = 'NGN ';
  else if (symbol === '₹') safeSymbol = 'INR ';
  else if (symbol === 'R') safeSymbol = 'ZAR ';
  else if (symbol === '₵') safeSymbol = 'GHS ';
  else if (symbol === 'KSh') safeSymbol = 'KES ';

  return text
    .replace(/₦/g, safeSymbol)
    .replace(/¦/g, safeSymbol)
    .replace(/₹/g, 'INR ')
    .replace(/₵/g, 'GHS ');
}

export function exportTransactionsCSV(transactions: Transaction[], categories: Category[], currencySymbol: string = '₦') {
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Recurring'];
  const rows = transactions.map(t => [
    t.date,
    t.type.toUpperCase(),
    t.category_id ? (categoryMap.get(t.category_id) || 'Uncategorized') : 'General',
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `${t.type === 'expense' ? '-' : '+'}${t.amount.toFixed(2)}`,
    t.payment_method || 'N/A',
    t.is_recurring ? (t.recurrence_interval || 'Yes') : 'No'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `financial_transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportFinancialReportPDF({
  userName,
  currencySymbol = '₦',
  transactions,
  categories,
  budgets,
  savingsGoals,
  prediction,
  startDate,
  endDate,
}: {
  userName: string;
  currencySymbol?: string;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  prediction?: FinancialPrediction | null;
  startDate?: string;
  endDate?: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const formattedStartDate = startDate ? format(parseISO(startDate), 'dd MMM yyyy') : 'All Time';
  const formattedEndDate = endDate ? format(parseISO(endDate), 'dd MMM yyyy') : 'Present';

  // 1. Executive Brand Header Banner (#332a54)
  doc.setFillColor(51, 42, 84);
  doc.rect(0, 0, 210, 40, 'F');

  // Accent Line under header (#6e44ff)
  doc.setFillColor(110, 68, 255);
  doc.rect(0, 40, 210, 2, 'F');

  // Brand Name & Document Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('TrackFi', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(215, 200, 245);
  doc.text('EXECUTIVE FINANCIAL STATEMENT & ANALYTICS REPORT', 14, 25);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(232, 226, 242);
  doc.text(`Prepared for: ${userName}`, 14, 33);

  // Top Right Report Metadata
  doc.setFontSize(8);
  doc.text(`Statement Period: ${formattedStartDate} - ${formattedEndDate}`, 196, 22, { align: 'right' });
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 196, 28, { align: 'right' });
  doc.text(`Ref: TRK-${Date.now().toString().slice(-6)}`, 196, 34, { align: 'right' });

  let currentY = 50;

  // 2. Executive Summary Metric Cards Grid
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Card Container Box Widths
  const cardW = 58;
  const cardH = 24;
  const gap = 4;

  // Card 1: Total Inflow (Income)
  doc.setFillColor(240, 253, 244); // light green bg
  doc.rect(14, currentY, cardW, cardH, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.rect(14, currentY, cardW, cardH, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL INFLOW (INCOME)', 18, currentY + 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPdfCurrency(totalIncome, currencySymbol), 18, currentY + 17);

  // Card 2: Total Outflow (Expense)
  doc.setFillColor(254, 242, 242); // light rose bg
  doc.rect(14 + cardW + gap, currentY, cardW, cardH, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.rect(14 + cardW + gap, currentY, cardW, cardH, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL OUTFLOW (EXPENSES)', 18 + cardW + gap, currentY + 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatPdfCurrency(totalExpense, currencySymbol), 18 + cardW + gap, currentY + 17);

  // Card 3: Net Cash Flow
  const netIsPositive = netBalance >= 0;
  doc.setFillColor(245, 243, 255); // light purple bg
  doc.rect(14 + (cardW + gap) * 2, currentY, cardW, cardH, 'F');
  doc.setDrawColor(221, 214, 254);
  doc.rect(14 + (cardW + gap) * 2, currentY, cardW, cardH, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(91, 33, 182);
  doc.text('NET CASH SURPLUS / DEFICIT', 18 + (cardW + gap) * 2, currentY + 7);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(netIsPositive ? 22 : 153, netIsPositive ? 101 : 27, netIsPositive ? 52 : 27);
  doc.text(formatPdfCurrency(netBalance, currencySymbol), 18 + (cardW + gap) * 2, currentY + 17);

  currentY += 32;

  // 3. Predictive Sustainability Section (if present)
  if (prediction) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 42, 84);
    doc.text('Predictive Sustainability & Risk Assessment', 14, currentY);
    currentY += 5;

    const isLowRisk = prediction.risk_level === 'low';
    const isModRisk = prediction.risk_level === 'moderate';

    // Set Helvetica font explicitly before text measurement & splitting
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 42, 84);

    // Sanitize currency symbol in explanation text
    const cleanExplanation = sanitizePdfText(prediction.explanation_text, currencySymbol);

    // Calculate split lines with 110mm max width (leaves 14mm inner padding before right edge at 196mm)
    const maxTextWidth = 110;
    const explanationLines = doc.splitTextToSize(cleanExplanation, maxTextWidth);

    // Compute dynamic container height based on lines
    const textBlockHeight = explanationLines.length * 4.2;
    const boxHeight = Math.max(26, textBlockHeight + 10);

    // Container box
    doc.setFillColor(248, 245, 252);
    doc.rect(14, currentY, 182, boxHeight, 'F');
    doc.setDrawColor(232, 226, 242);
    doc.rect(14, currentY, 182, boxHeight, 'S');

    // Score Badge Box on Left
    const badgeColor = isLowRisk ? [16, 185, 129] : isModRisk ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.rect(18, currentY + 4, 48, boxHeight - 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`SCORE: ${prediction.sustainability_score} / 100`, 42, currentY + (boxHeight / 2) - 1, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text(`RISK: ${prediction.risk_level.toUpperCase()}`, 42, currentY + (boxHeight / 2) + 4, { align: 'center' });

    // Explanation text inside container with proper padding & Helvetica font
    doc.setTextColor(51, 42, 84);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(explanationLines, 72, currentY + 8, { lineHeightFactor: 1.35 });

    currentY += boxHeight + 8;
  }

  // 4. Category Breakdown Summary Table (Top 5 expense categories)
  const expenseCatTotals = new Map<string, number>();
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const catName = t.category_id ? (categoryMap.get(t.category_id) || 'General') : 'General';
      expenseCatTotals.set(catName, (expenseCatTotals.get(catName) || 0) + t.amount);
    });

  const sortedCatSummary = Array.from(expenseCatTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([catName, amt]) => [
      catName,
      formatPdfCurrency(amt, currencySymbol),
      totalExpense > 0 ? `${((amt / totalExpense) * 100).toFixed(1)}%` : '0%'
    ]);

  if (sortedCatSummary.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 42, 84);
    doc.text('Top Expense Categories Breakdown', 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [['Category', 'Total Spent', '% of Total Expenses']],
      body: sortedCatSummary,
      theme: 'grid',
      headStyles: {
        fillColor: [51, 42, 84],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      styles: { fontSize: 8, cellPadding: 2, textColor: [51, 42, 84] },
      alternateRowStyles: { fillColor: [248, 245, 252] },
      margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 5. Itemized Transaction Ledger Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 42, 84);
  doc.text(`Itemized Transaction Ledger (${transactions.length} Records)`, 14, currentY);
  currentY += 4;

  const transactionRows = transactions.map(t => [
    t.date,
    t.type.toUpperCase(),
    t.category_id ? (categoryMap.get(t.category_id) || 'General') : 'General',
    t.description || 'Transaction entry',
    t.payment_method || 'Bank Transfer',
    formatPdfCurrency(t.type === 'expense' ? -t.amount : t.amount, currencySymbol)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Date', 'Type', 'Category', 'Description', 'Method', 'Amount']],
    body: transactionRows.length > 0 ? transactionRows : [['-', '-', 'No records found for selected period', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [110, 68, 255],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    alternateRowStyles: { fillColor: [250, 248, 254] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 55 },
      4: { cellWidth: 26 },
      5: { cellWidth: 27, halign: 'right', fontStyle: 'bold' }
    },
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [51, 42, 84] },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 5) {
        const text = data.cell.raw as string;
        if (text.startsWith('-')) {
          data.cell.styles.textColor = [225, 29, 72]; // Rose color for expenses
        } else {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald color for income
        }
      }
    },
    margin: { left: 14, right: 14 }
  });

  // 6. Page Footers (Page X of Y + Decorative Footer Bar)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Bottom border line
    doc.setDrawColor(232, 226, 242);
    doc.line(14, 282, 196, 282);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(139, 132, 156);
    doc.text('TrackFi Financial Management Platform  •  Confidential Statement', 14, 287);
    doc.text(`Page ${i} of ${totalPages}`, 196, 287, { align: 'right' });
  }

  doc.save(`TrackFi_Financial_Statement_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
