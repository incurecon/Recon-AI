import * as XLSX from 'xlsx';
import { ReconciliationSession } from '../src/types.js';

export function generateMultiSheetExcelReport(session: ReconciliationSession): Buffer {
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
      p.aiExplanation?.cause || 'Under investigation',
      p.aiExplanation?.resolution || 'Review voucher',
      p.aiExplanation?.journalEntry || 'Debit/Credit pending',
    ]),
  ];
  const discrepancySheet = XLSX.utils.aoa_to_sheet(discrepancyRows);
  discrepancySheet['!cols'] = [
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 },
    { wch: 35 },
    { wch: 35 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, discrepancySheet, 'Discrepancies & Adjustments');

  // Sheet 4: Fraud & Anomaly Audit Log
  const fraudRows = [
    [
      'Alert ID',
      'Ref Number',
      'Date',
      'Amount ($)',
      'Fraud Category',
      'Risk Level',
      'Fraud Score (0-100)',
      'Detailed Explanation',
      'Recommended Audit Action',
    ],
    ...session.fraudAlerts.map((f) => [
      f.id,
      f.reference,
      f.date,
      f.amount,
      f.fraudType.replace(/_/g, ' ').toUpperCase(),
      f.riskLevel,
      f.fraudScore,
      f.explanation,
      f.recommendedAction,
    ]),
  ];
  const fraudSheet = XLSX.utils.aoa_to_sheet(fraudRows);
  fraudSheet['!cols'] = [
    { wch: 18 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 22 },
    { wch: 12 },
    { wch: 18 },
    { wch: 40 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, fraudSheet, 'Fraud Risk Audit Log');

  // Return buffer
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
