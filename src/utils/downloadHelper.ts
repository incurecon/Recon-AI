import * as XLSX from 'xlsx';
import { ReconciliationSession } from '../types.js';

/**
 * Downloads the multi-sheet Excel reconciliation report.
 * Uses fetch blob download first, falling back to client-side XLSX workbook generation.
 */
export async function downloadExcelReport(session: ReconciliationSession): Promise<void> {
  const filename = `IncuRecon_Audit_Report_${session.id}.xlsx`;

  try {
    // Attempt 1: Fetch binary blob from server endpoint
    const token = localStorage.getItem('incurecon_token');
    const response = await fetch(`/api/reports/excel/${session.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      // Ensure we received actual binary spreadsheet and not _cookie_check HTML
      if (!contentType.includes('html')) {
        const blob = await response.blob();
        if (blob.size > 0 && blob.type !== 'text/html') {
          triggerBlobDownload(blob, filename);
          return;
        }
      }
    }
  } catch (err) {
    console.warn('Server download endpoint warning, falling back to client-side generation:', err);
  }

  // Fallback: Generate full multi-sheet Excel file directly in browser
  generateClientSideExcelReport(session, filename);
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    window.URL.revokeObjectURL(url);
  }, 200);
}

export function generateClientSideExcelReport(session: ReconciliationSession, filename: string) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive Summary
  const summaryData = [
    ['INCURECON AI - FINANCIAL RECONCILIATION AUDIT REPORT'],
    ['Generated On:', new Date().toLocaleString()],
    ['Session ID:', session.id],
    [''],
    ['METRIC', 'VALUE'],
    ['Internal Ledger File:', session.internalFileName],
    ['Bank Statement File:', session.externalFileName],
    ['Total Internal Records:', session.totalInternalCount],
    ['Total Bank Records:', session.totalExternalCount],
    ['Matched Transactions:', session.matchedCount],
    ['Unmatched / Discrepancies:', session.unmatchedCount],
    ['Fraud / Risk Alerts Flagged:', session.fraudCount],
    ['Match Rate (%):', `${session.matchRate.toFixed(2)}%`],
    ['Total Net Discrepancy Amount:', `$${session.totalDiscrepancyAmount.toFixed(2)}`],
    [''],
    ['AUDIT CERTIFICATION'],
    [
      'Note:',
      'This reconciliation report was processed with IncuRecon AI Automated Matching Engine & Fraud Risk Radar.',
    ],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Executive Summary');

  // Sheet 2: Matched Transactions
  const matchedPairs = session.pairs.filter((p) => p.status === 'perfect' || p.status === 'near');
  const matchedRows = [
    [
      'Pair ID',
      'Date',
      'Internal Ref',
      'Internal Desc',
      'Bank Ref',
      'Bank Desc',
      'Amount ($)',
      'Match Status',
      'Confidence Score (%)',
    ],
    ...matchedPairs.map((p) => [
      p.id,
      p.internalTxn?.date || p.externalTxn?.date || '',
      p.internalTxn?.reference || 'N/A',
      p.internalTxn?.description || 'N/A',
      p.externalTxn?.reference || 'N/A',
      p.externalTxn?.description || 'N/A',
      p.internalTxn?.amount || p.externalTxn?.amount || 0,
      p.status === 'perfect' ? 'Exact Match' : 'Near Match',
      `${p.confidence}%`,
    ]),
  ];
  const matchedSheet = XLSX.utils.aoa_to_sheet(matchedRows);
  matchedSheet['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 25 },
    { wch: 12 },
    { wch: 15 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, matchedSheet, 'Matched Transactions');

  // Sheet 3: Discrepancies & Unmatched
  const discrepancyPairs = session.pairs.filter(
    (p) => p.status !== 'perfect' && p.status !== 'near'
  );
  const discrepancyRows = [
    [
      'Pair ID',
      'Status',
      'Internal Ref',
      'Bank Ref',
      'Ledger Amt ($)',
      'Bank Amt ($)',
      'Difference ($)',
      'Rule Reason',
      'AI Root Cause',
      'AI Recommended Resolution',
      'Suggested Journal Entry',
    ],
    ...discrepancyPairs.map((p) => [
      p.id,
      p.status.toUpperCase(),
      p.internalTxn?.reference || 'N/A',
      p.externalTxn?.reference || 'N/A',
      p.internalTxn?.amount ?? 'N/A',
      p.externalTxn?.amount ?? 'N/A',
      p.amountDiff.toFixed(2),
      p.reason || '',
      p.aiExplanation?.cause || '',
      p.aiExplanation?.resolution || '',
      p.aiExplanation?.journalEntry || '',
    ]),
  ];
  const discrepancySheet = XLSX.utils.aoa_to_sheet(discrepancyRows);
  discrepancySheet['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 35 },
    { wch: 35 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, discrepancySheet, 'Discrepancies & AJEs');

  // Sheet 4: Fraud Risk Audit Log
  const fraudRows = [
    [
      'Alert ID',
      'Risk Level',
      'Fraud Type',
      'Fraud Score (%)',
      'Reference',
      'Amount ($)',
      'Date',
      'Description',
      'Explanation',
      'Recommended Action',
    ],
    ...session.fraudAlerts.map((f) => [
      f.id,
      f.riskLevel.toUpperCase(),
      f.fraudType,
      `${f.fraudScore}%`,
      f.reference,
      f.amount,
      f.date,
      f.description,
      f.explanation,
      f.recommendedAction,
    ]),
  ];
  const fraudSheet = XLSX.utils.aoa_to_sheet(fraudRows);
  fraudSheet['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
    { wch: 40 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, fraudSheet, 'Fraud Risk Audit Log');

  // Write file
  XLSX.writeFile(wb, filename);
}
