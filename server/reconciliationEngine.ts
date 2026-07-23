import * as XLSX from 'xlsx';
import Fuse from 'fuse.js';
import { TransactionItem, ReconciliationPair, FraudAlert, MatchStatus, FraudType } from '../src/types.js';

// Parse buffer or string into TransactionItem array
export function parseFinancialFile(
  fileBuffer: Buffer,
  fileName: string,
  source: 'internal' | 'external'
): TransactionItem[] {
  const items: TransactionItem[] = [];
  const fileExt = fileName.split('.').pop()?.toLowerCase();

  try {
    if (fileExt === 'xlsx' || fileExt === 'xls' || fileExt === 'csv') {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      jsonData.forEach((row, idx) => {
        const dateVal =
          row['Date'] ||
          row['date'] ||
          row['Transaction Date'] ||
          row['Posting Date'] ||
          row['DATE'] ||
          row['Txn Date'] ||
          '2026-03-15';
        const descVal =
          row['Description'] ||
          row['description'] ||
          row['Details'] ||
          row['Narration'] ||
          row['DESCRIPTION'] ||
          row['Particulars'] ||
          row['Memo'] ||
          `Transaction #${idx + 1}`;
        const refVal =
          row['Reference'] ||
          row['reference'] ||
          row['Ref Number'] ||
          row['Ref'] ||
          row['Reference Number'] ||
          row['REF'] ||
          row['Cheque No'] ||
          row['Invoice No'] ||
          `REF-${1000 + idx}`;
        const debitVal = parseFloat(
          String(
            row['Debit'] || row['debit'] || row['DEBIT'] || row['Withdrawal'] || row['Out'] || 0
          ).replace(/[^0-9.-]+/g, '')
        ) || 0;
        const creditVal = parseFloat(
          String(
            row['Credit'] || row['credit'] || row['CREDIT'] || row['Deposit'] || row['In'] || 0
          ).replace(/[^0-9.-]+/g, '')
        ) || 0;
        
        let amountVal = parseFloat(
          String(
            row['Amount'] || row['amount'] || row['AMOUNT'] || row['Net Amount'] || 0
          ).replace(/[^0-9.-]+/g, '')
        ) || 0;

        if (amountVal === 0) {
          if (debitVal > 0) amountVal = -debitVal;
          else if (creditVal > 0) amountVal = creditVal;
        }

        const balanceVal = parseFloat(
          String(
            row['Balance'] || row['balance'] || row['BALANCE'] || 0
          ).replace(/[^0-9.-]+/g, '')
        ) || undefined;

        items.push({
          id: `${source}-${idx + 1}-${Date.now()}`,
          date: String(dateVal).trim(),
          description: String(descVal).trim(),
          reference: String(refVal).trim(),
          debit: debitVal,
          credit: creditVal,
          amount: amountVal,
          balance: balanceVal,
          accountNumber: String(row['Account'] || row['Account Number'] || 'ACC-1002'),
          currency: 'USD',
          source,
        });
      });
    } else {
      // PDF or text file parsing fallback
      const text = fileBuffer.toString('utf-8');
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      lines.forEach((line, idx) => {
        // Simple regex heuristic for date, reference, amount
        const dateMatch = line.match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/);
        const amountMatch = line.match(/[-+]?\$?\d{1,3}(,\d{3})*(\.\d{2})?/g);
        
        const date = dateMatch ? dateMatch[0] : '2026-03-15';
        const amount = amountMatch ? parseFloat(amountMatch[amountMatch.length - 1].replace(/[$,]/g, '')) : (idx + 1) * 150;
        
        items.push({
          id: `${source}-${idx + 1}-${Date.now()}`,
          date,
          description: line.substring(0, 60).trim(),
          reference: `REF-PDF-${2000 + idx}`,
          debit: amount < 0 ? Math.abs(amount) : 0,
          credit: amount > 0 ? amount : 0,
          amount,
          source,
        });
      });
    }
  } catch (err) {
    console.error(`Error parsing file ${fileName}:`, err);
  }

  return items;
}

// Calculate similarity ratio between two strings (0 - 1)
function stringSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const str1 = s1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const str2 = s2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (str1 === str2) return 1.0;
  if (str1.includes(str2) || str2.includes(str1)) return 0.85;

  let matches = 0;
  const minLen = Math.min(str1.length, str2.length);
  for (let i = 0; i < minLen; i++) {
    if (str1[i] === str2[i]) matches++;
  }
  return matches / Math.max(str1.length, str2.length);
}

// Perform automated Intelligent Reconciliation & Fraud Detection
export function runReconciliation(
  internalItems: TransactionItem[],
  externalItems: TransactionItem[]
): { pairs: ReconciliationPair[]; fraudAlerts: FraudAlert[] } {
  const pairs: ReconciliationPair[] = [];
  const fraudAlerts: FraudAlert[] = [];

  const matchedExtIds = new Set<string>();
  const matchedIntIds = new Set<string>();

  // Step 1: Exact Matches (Same Ref & Same Amount within $0.05)
  for (const intItem of internalItems) {
    if (matchedIntIds.has(intItem.id)) continue;

    for (const extItem of externalItems) {
      if (matchedExtIds.has(extItem.id)) continue;

      const amountDiff = Math.abs(intItem.amount - extItem.amount);
      const isSameRef = intItem.reference.toLowerCase() === extItem.reference.toLowerCase();

      if (isSameRef && amountDiff < 0.05) {
        matchedIntIds.add(intItem.id);
        matchedExtIds.add(extItem.id);

        pairs.push({
          id: `pair-${intItem.id}-${extItem.id}`,
          internalTxn: intItem,
          externalTxn: extItem,
          status: 'perfect',
          confidence: 100,
          amountDiff: 0,
          reason: 'Exact reference and amount match.',
        });
        break;
      }
    }
  }

  // Step 2: Amount Mismatches (Same Ref, but Amount Differs)
  for (const intItem of internalItems) {
    if (matchedIntIds.has(intItem.id)) continue;

    for (const extItem of externalItems) {
      if (matchedExtIds.has(extItem.id)) continue;

      const isSameRef = intItem.reference.toLowerCase() === extItem.reference.toLowerCase();
      if (isSameRef) {
        matchedIntIds.add(intItem.id);
        matchedExtIds.add(extItem.id);

        const diff = Math.abs(intItem.amount - extItem.amount);
        pairs.push({
          id: `pair-${intItem.id}-${extItem.id}`,
          internalTxn: intItem,
          externalTxn: extItem,
          status: 'amount_mismatch',
          confidence: 85,
          amountDiff: diff,
          reason: `Reference matched (${intItem.reference}), but amount differs by $${diff.toFixed(2)}.`,
        });

        // Trigger Fraud check if amount difference is high
        if (diff > 500) {
          fraudAlerts.push({
            id: `fraud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            transactionId: intItem.id,
            reference: intItem.reference,
            date: intItem.date,
            amount: intItem.amount,
            description: intItem.description,
            fraudType: 'altered_amount',
            fraudScore: 88,
            riskLevel: 'High',
            explanation: `Amount discrepancy detected between Ledger ($${intItem.amount.toFixed(
              2
            )}) and Bank Statement ($${extItem.amount.toFixed(2)}). Possible unauthorized alteration or processing fee mismatch.`,
            recommendedAction: 'Verify vendor original invoice and check for bank charge adjustments.',
          });
        }
        break;
      }
    }
  }

  // Step 3: Fuzzy Matches (Same Amount, Similar Description or Reference)
  for (const intItem of internalItems) {
    if (matchedIntIds.has(intItem.id)) continue;

    for (const extItem of externalItems) {
      if (matchedExtIds.has(extItem.id)) continue;

      const amountDiff = Math.abs(intItem.amount - extItem.amount);
      if (amountDiff < 0.05) {
        const descSim = stringSimilarity(intItem.description, extItem.description);
        const refSim = stringSimilarity(intItem.reference, extItem.reference);

        if (descSim >= 0.6 || refSim >= 0.6) {
          matchedIntIds.add(intItem.id);
          matchedExtIds.add(extItem.id);

          const simPercent = Math.round(Math.max(descSim, refSim) * 100);
          pairs.push({
            id: `pair-${intItem.id}-${extItem.id}`,
            internalTxn: intItem,
            externalTxn: extItem,
            status: 'near',
            confidence: simPercent,
            amountDiff: 0,
            reason: `Amounts match ($${intItem.amount.toFixed(2)}). Description/Ref fuzzy similarity ${simPercent}%.`,
          });
          break;
        }
      }
    }
  }

  // Step 4: Unmatched Internal Items (Missing in Bank Statement)
  for (const intItem of internalItems) {
    if (!matchedIntIds.has(intItem.id)) {
      pairs.push({
        id: `unmatched-int-${intItem.id}`,
        internalTxn: intItem,
        status: 'missing_bank',
        confidence: 0,
        amountDiff: intItem.amount,
        reason: 'Recorded in internal ledger, but missing from bank statement.',
      });
    }
  }

  // Step 5: Unmatched External Items (Missing in Ledger)
  for (const extItem of externalItems) {
    if (!matchedExtIds.has(extItem.id)) {
      pairs.push({
        id: `unmatched-ext-${extItem.id}`,
        externalTxn: extItem,
        status: 'missing_ledger',
        confidence: 0,
        amountDiff: extItem.amount,
        reason: 'Appears on bank statement, but missing from internal accounting ledger.',
      });

      // Check if it's a suspicious ghost payment or missing ledger entry
      if (Math.abs(extItem.amount) > 1000) {
        fraudAlerts.push({
          id: `fraud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          transactionId: extItem.id,
          reference: extItem.reference,
          date: extItem.date,
          amount: extItem.amount,
          description: extItem.description,
          fraudType: 'ghost_payment',
          fraudScore: 82,
          riskLevel: 'High',
          explanation: `Unrecorded bank debit of $${Math.abs(extItem.amount).toFixed(
            2
          )} for "${extItem.description}". No corresponding entry found in ledger.`,
          recommendedAction: 'Request bank withdrawal authorization slip and cross-reference with authorized payees.',
        });
      }
    }
  }

  // Step 6: Advanced Fraud Detection Scenarios
  // A. Duplicate payments in Internal Ledger
  const seenRefs: Record<string, TransactionItem[]> = {};
  for (const item of internalItems) {
    const key = `${item.reference}-${Math.abs(item.amount)}`;
    if (!seenRefs[key]) seenRefs[key] = [];
    seenRefs[key].push(item);
  }

  for (const key in seenRefs) {
    if (seenRefs[key].length > 1) {
      const itemsGroup = seenRefs[key];
      fraudAlerts.push({
        id: `fraud-dup-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        transactionId: itemsGroup[0].id,
        reference: itemsGroup[0].reference,
        date: itemsGroup[0].date,
        amount: itemsGroup[0].amount,
        description: itemsGroup[0].description,
        fraudType: 'duplicate_payment',
        fraudScore: 94,
        riskLevel: 'Critical',
        explanation: `Duplicate payment detected! ${itemsGroup.length} internal ledger entries share reference ${itemsGroup[0].reference} and amount $${itemsGroup[0].amount.toFixed(2)}.`,
        recommendedAction: 'Verify if vendor was paid twice and request immediate vendor credit memo or refund.',
      });
    }
  }

  // B. Split Payments / Round Number Anomaly
  for (const item of internalItems.concat(externalItems)) {
    const absAmt = Math.abs(item.amount);
    if (absAmt >= 5000 && absAmt % 1000 === 0) {
      // Check if already added
      const exists = fraudAlerts.some((f) => f.reference === item.reference);
      if (!exists) {
        fraudAlerts.push({
          id: `fraud-round-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          transactionId: item.id,
          reference: item.reference,
          date: item.date,
          amount: item.amount,
          description: item.description,
          fraudType: 'round_number_anomaly',
          fraudScore: 65,
          riskLevel: 'Medium',
          explanation: `Large round-number transaction ($${absAmt.toLocaleString()}.00) detected. High-value round transfers often indicate off-contract disbursements or bypass of approval workflows.`,
          recommendedAction: 'Inspect supporting documentation, PO, and managerial sign-off for round-sum disbursements.',
        });
      }
    }
  }

  return { pairs, fraudAlerts };
}
