import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { marked } from 'marked';

// Read markdown report
const mdPath = path.join(process.cwd(), 'FINAL_YEAR_PROJECT_REPORT.md');
let mdContent = fs.readFileSync(mdPath, 'utf8');

// Replace any legacy absolute image paths with relative screenshots/ paths if needed
mdContent = mdContent.replace(/C:\\Users\\Ismail\\\.gemini\\antigravity-ide\\brain\\e9806849-b8fa-4ccb-99e1-b73dd78a9426\\screenshot_00_login_.*\.png/g, './screenshots/screenshot_00_login.png');
mdContent = mdContent.replace(/C:\\Users\\Ismail\\\.gemini\\antigravity-ide\\brain\\e9806849-b8fa-4ccb-99e1-b73dd78a9426\\screenshot_01_dashboard_.*\.png/g, './screenshots/screenshot_01_dashboard.png');
mdContent = mdContent.replace(/C:\\Users\\Ismail\\\.gemini\\antigravity-ide\\brain\\e9806849-b8fa-4ccb-99e1-b73dd78a9426\\screenshot_02_transactions_.*\.png/g, './screenshots/screenshot_02_transactions.png');
mdContent = mdContent.replace(/C:\\Users\\Ismail\\\.gemini\\antigravity-ide\\brain\\e9806849-b8fa-4ccb-99e1-b73dd78a9426\\screenshot_03_budgets_.*\.png/g, './screenshots/screenshot_03_budgets.png');
mdContent = mdContent.replace(/C:\\Users\\Ismail\\\.gemini\\antigravity-ide\\brain\\e9806849-b8fa-4ccb-99e1-b73dd78a9426\\screenshot_04_savings_.*\.png/g, './screenshots/screenshot_04_savings.png');
mdContent = mdContent.replace(/C:\\Users\\Ismail\\\.gemini\\antigravity-ide\\brain\\e9806849-b8fa-4ccb-99e1-b73dd78a9426\\screenshot_05_predictions_.*\.png/g, './screenshots/screenshot_05_predictions.png');
mdContent = mdContent.replace(/C:\\Users\\Ismail\\\.gemini\\antigravity-ide\\brain\\e9806849-b8fa-4ccb-99e1-b73dd78a9426\\screenshot_06_reports_.*\.png/g, './screenshots/screenshot_06_reports.png');
mdContent = mdContent.replace(/C:\\Users\\Ismail\\\.gemini\\antigravity-ide\\brain\\e9806849-b8fa-4ccb-99e1-b73dd78a9426\\screenshot_07_categories_.*\.png/g, './screenshots/screenshot_07_categories.png');
mdContent = mdContent.replace(/C:\\Users\\Ismail\\\.gemini\\antigravity-ide\\brain\\e9806849-b8fa-4ccb-99e1-b73dd78a9426\\screenshot_08_analytics_.*\.png/g, './screenshots/screenshot_08_analytics.png');
mdContent = mdContent.replace(/C:\\Users\\Ismail\\\.gemini\\antigravity-ide\\brain\\e9806849-b8fa-4ccb-99e1-b73dd78a9426\\screenshot_09_transaction_modal_.*\.png/g, './screenshots/screenshot_09_transaction_modal.png');

// Update markdown file on disk with clean relative image paths
fs.writeFileSync(mdPath, mdContent, 'utf8');

// Custom renderer to convert PNG images to embedded Base64 Data URIs
const renderer = new marked.Renderer();

renderer.image = function ({ href, title, text }) {
  let resolvedPath = href;
  if (!path.isAbsolute(resolvedPath)) {
    resolvedPath = path.join(process.cwd(), href);
  }
  
  if (fs.existsSync(resolvedPath)) {
    const imgBuf = fs.readFileSync(resolvedPath);
    const base64Str = imgBuf.toString('base64');
    const dataUri = `data:image/png;base64,${base64Str}`;
    console.log(`Embedded base64 image: ${path.basename(resolvedPath)} (${(imgBuf.length / 1024).toFixed(1)} KB)`);
    return `
      <div class="figure-container">
        <img src="${dataUri}" alt="${text || 'Screenshot'}" />
        ${text ? `<div class="figure-caption">${text}</div>` : ''}
      </div>
    `;
  } else {
    console.warn(`Warning: Image not found at ${resolvedPath}`);
    return `<p><strong>[Image missing: ${href}]</strong></p>`;
  }
};

// Configure marked
marked.setOptions({
  renderer: renderer,
  gfm: true,
  breaks: false
});

let htmlBody = marked.parse(mdContent);

// Process GitHub alert callouts like > [!NOTE] or > [!IMPORTANT]
htmlBody = htmlBody.replace(/<blockquote>\s*<p>\s*\[!(NOTE|IMPORTANT|TIP|WARNING|CAUTION)\]\s*([\s\S]*?)<\/p>\s*<\/blockquote>/gi, (match, p1, p2) => {
  const type = p1.toUpperCase();
  return `
    <div class="callout callout-${type.toLowerCase()}">
      <div class="callout-title">${type}</div>
      <div class="callout-body">${p2}</div>
    </div>
  `;
});

// Full styled HTML wrapper for publication PDF print
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FINAL YEAR PROJECT REPORT - TRACKFI</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 15mm 20mm 15mm;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page-break {
        page-break-before: always;
      }
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 10.5pt;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1 {
      color: #1e1b4b;
      font-size: 20pt;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 10px;
      margin-top: 0;
      margin-bottom: 18px;
    }
    h2 {
      color: #312e81;
      font-size: 14pt;
      border-bottom: 1.5px solid #e0e7ff;
      padding-bottom: 6px;
      margin-top: 28px;
      margin-bottom: 14px;
      page-break-after: avoid;
    }
    h3 {
      color: #4338ca;
      font-size: 12pt;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    h4 {
      color: #475569;
      font-size: 10.5pt;
      margin-top: 16px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    p {
      margin-top: 0;
      margin-bottom: 12px;
      text-align: justify;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 14px;
      padding-left: 24px;
    }
    li {
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    th {
      background-color: #312e81;
      color: #ffffff;
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #312e81;
    }
    td {
      padding: 7px 10px;
      border: 1px solid #cbd5e1;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .figure-container {
      page-break-inside: avoid;
      text-align: center;
      margin: 22px 0;
    }
    img {
      max-width: 100%;
      max-height: 480px;
      height: auto;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      display: block;
      margin: 0 auto;
    }
    .figure-caption {
      font-size: 9pt;
      color: #475569;
      font-style: italic;
      margin-top: 8px;
      font-weight: 500;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 16px;
      border-radius: 6px;
      overflow-x: auto;
      font-family: 'Consolas', 'Cascadia Code', 'Courier New', monospace;
      font-size: 8.5pt;
      line-height: 1.45;
      page-break-inside: avoid;
      margin: 14px 0;
    }
    code {
      font-family: 'Consolas', 'Cascadia Code', 'Courier New', monospace;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 9pt;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    .callout {
      border-left: 4px solid #6366f1;
      background: #f5f3ff;
      padding: 10px 14px;
      margin: 16px 0;
      border-radius: 0 6px 6px 0;
      page-break-inside: avoid;
    }
    .callout-title {
      font-weight: 700;
      font-size: 9pt;
      color: #4338ca;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .callout-body {
      font-size: 9.5pt;
      color: #334155;
    }
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 24px 0;
    }
    strong {
      color: #0f172a;
    }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;

// Write compiled HTML
const htmlPath = path.join(process.cwd(), 'FINAL_YEAR_PROJECT_REPORT.html');
fs.writeFileSync(htmlPath, fullHtml, 'utf8');
console.log('Successfully generated FINAL_YEAR_PROJECT_REPORT.html with Base64 embedded screenshots!');

// Execute Edge or Chrome headless to compile PDF
const pdfPath = path.join(process.cwd(), 'FINAL_YEAR_PROJECT_REPORT.pdf');
const edgePath = `C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`;
const chromePath = `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`;

let browserExe = fs.existsSync(edgePath) ? edgePath : fs.existsSync(chromePath) ? chromePath : null;

if (!browserExe) {
  console.error('Neither Edge nor Chrome binary found on system.');
  process.exit(1);
}

const htmlFileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
const cmd = `"${browserExe}" --headless --disable-gpu --allow-file-access-from-files --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlFileUrl}"`;

console.log('Running browser headless PDF compilation...');
execSync(cmd);
console.log(`PDF successfully created at: ${pdfPath}`);
