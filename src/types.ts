export interface User {
  id: string;
  email: string;
  fullName: string;
  companyName?: string;
  role?: string;
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  amount: number; // Signed or net amount
  balance?: number;
  accountNumber?: string;
  currency?: string;
  source: 'internal' | 'external';
  rawLine?: string;
}

export type MatchStatus =
  | 'perfect'
  | 'near'
  | 'amount_mismatch'
  | 'date_mismatch'
  | 'ref_mismatch'
  | 'missing_ledger'
  | 'missing_bank'
  | 'duplicate'
  | 'fraud_flagged';

export interface AIExplanation {
  cause: string;
  resolution: string;
  journalEntry: string;
  preventiveMeasure: string;
  confidence: number;
}

export interface ReconciliationPair {
  id: string;
  internalTxn?: TransactionItem;
  externalTxn?: TransactionItem;
  status: MatchStatus;
  confidence: number; // 0 to 100
  amountDiff: number;
  reason?: string;
  aiExplanation?: AIExplanation;
}

export type FraudType =
  | 'duplicate_payment'
  | 'altered_amount'
  | 'missing_ledger_entry'
  | 'ghost_payment'
  | 'split_payment'
  | 'abnormal_frequency'
  | 'high_risk_vendor'
  | 'round_number_anomaly'
  | 'duplicate_invoice';

export interface FraudAlert {
  id: string;
  transactionId: string;
  reference: string;
  date: string;
  amount: number;
  description: string;
  fraudType: FraudType;
  fraudScore: number; // 0 - 100
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  explanation: string;
  recommendedAction: string;
}

export interface ReconciliationSession {
  id: string;
  userId: string;
  createdAt: string;
  internalFileName: string;
  externalFileName: string;
  totalInternalCount: number;
  totalExternalCount: number;
  matchedCount: number;
  unmatchedCount: number;
  fraudCount: number;
  matchRate: number; // Percentage
  totalDiscrepancyAmount: number;
  pairs: ReconciliationPair[];
  fraudAlerts: FraudAlert[];
  summaryNote?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
