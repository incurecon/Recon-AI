import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { DB } from './server/db.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  authMiddleware,
  AuthRequest,
} from './server/auth.js';
import {
  parseFinancialFile,
  runReconciliation,
} from './server/reconciliationEngine.js';
import {
  generateDiscrepancyExplanation,
  generateChatAssistantResponse,
} from './server/aiService.js';
import { generateMultiSheetExcelReport } from './server/excelGenerator.js';
import { ReconciliationSession, TransactionItem } from './src/types.js';

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'IncuRecon AI', timestamp: new Date().toISOString() });
  });

  // Ensure seed default user exists for quick login
  if (!DB.findUserByEmail('auditor@incurecon.ai')) {
    DB.createUser(
      {
        id: 'usr-demo-001',
        email: 'auditor@incurecon.ai',
        fullName: 'Jane Doe, CPA',
        companyName: 'Apex Financial Services',
        createdAt: new Date().toISOString(),
      },
      hashPassword('password123')
    );
  }

  // --- AUTH ROUTES ---
  app.post('/api/auth/guest-login', (req, res) => {
    const guestUser = {
      id: 'usr-guest-' + Date.now(),
      email: 'guest@incurecon.ai',
      fullName: 'Demo Accountant',
      companyName: 'Apex Demo Org',
      createdAt: new Date().toISOString(),
    };
    const token = generateToken(guestUser, false);
    res.json({ token, user: guestUser });
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, password, fullName, companyName } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    const existing = DB.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Account with this email already exists.' });
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      email,
      fullName,
      companyName: companyName || 'Finance Org',
      createdAt: new Date().toISOString(),
    };

    const passwordHash = hashPassword(password);
    DB.createUser(newUser, passwordHash);

    const token = generateToken(newUser, false);
    res.json({ token, user: newUser });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = DB.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password credentials.' });
    }

    const passwordHash = DB.getUserPasswordHash(user.id);
    if (!passwordHash || !comparePassword(password, passwordHash)) {
      return res.status(400).json({ error: 'Invalid email or password credentials.' });
    }

    const token = generateToken(user, !!rememberMe);
    res.json({ token, user });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    const user = DB.findUserByEmail(email);
    if (!user) {
      // Return success to avoid email enumeration
      return res.json({ message: 'If that email exists, a password reset link has been dispatched.' });
    }

    const resetToken = `reset-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    DB.createResetToken(resetToken, user.id);

    // In production this sends email, for demo we return the reset token directly
    res.json({
      message: 'Password reset link generated successfully.',
      resetToken,
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }

    const userId = DB.verifyResetToken(resetToken);
    if (!userId) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const newHash = hashPassword(newPassword);
    DB.updatePasswordHash(userId, newHash);
    DB.deleteResetToken(resetToken);

    res.json({ message: 'Password has been successfully reset. You can now login.' });
  });

  app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  // --- RECONCILIATION & FILE UPLOAD ROUTE ---
  app.post(
    '/api/upload-and-reconcile',
    authMiddleware,
    upload.fields([
      { name: 'internalFile', maxCount: 1 },
      { name: 'externalFile', maxCount: 1 },
    ]),
    async (req: AuthRequest, res) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        let internalItems: TransactionItem[] = [];
        let externalItems: TransactionItem[] = [];
        let internalFileName = 'Internal_Ledger.csv';
        let externalFileName = 'Bank_Statement.pdf';

        if (files?.internalFile?.[0] && files?.externalFile?.[0]) {
          const intFile = files.internalFile[0];
          const extFile = files.externalFile[0];
          internalFileName = intFile.originalname;
          externalFileName = extFile.originalname;

          internalItems = parseFinancialFile(intFile.buffer, intFile.originalname, 'internal');
          externalItems = parseFinancialFile(extFile.buffer, extFile.originalname, 'external');
        } else if (req.body.useSampleData === 'true' || req.body.useSampleData === true) {
          // Demo Sample Data Generation
          internalItems = getSampleInternalLedger();
          externalItems = getSampleBankStatement();
          internalFileName = 'Company_Ledger_Q1_Sample.csv';
          externalFileName = 'Chase_Bank_Statement_Q1.pdf';
        } else {
          return res.status(400).json({
            error: 'Please upload both Internal Ledger and Bank Statement files, or use sample demo data.',
          });
        }

        if (internalItems.length === 0 || externalItems.length === 0) {
          return res.status(400).json({
            error: 'Could not extract valid transaction rows from one or both uploaded files.',
          });
        }

        // Run Matching Engine & Fraud Radar
        const { pairs, fraudAlerts } = runReconciliation(internalItems, externalItems);

        // Fetch AI Explanations for non-perfect matches asynchronously
        const updatedPairs = await Promise.all(
          pairs.map(async (pair) => {
            if (pair.status !== 'perfect') {
              const aiExplanation = await generateDiscrepancyExplanation(pair);
              return { ...pair, aiExplanation };
            }
            return pair;
          })
        );

        const matchedCount = updatedPairs.filter(
          (p) => p.status === 'perfect' || p.status === 'near'
        ).length;
        const unmatchedCount = updatedPairs.length - matchedCount;
        const totalDiscrepancyAmount = updatedPairs
          .filter((p) => p.status !== 'perfect')
          .reduce((sum, p) => sum + Math.abs(p.amountDiff), 0);
        const matchRate = (matchedCount / Math.max(updatedPairs.length, 1)) * 100;

        const newSession: ReconciliationSession = {
          id: `rec-${Date.now()}`,
          userId: req.user?.id || 'guest',
          createdAt: new Date().toISOString(),
          internalFileName,
          externalFileName,
          totalInternalCount: internalItems.length,
          totalExternalCount: externalItems.length,
          matchedCount,
          unmatchedCount,
          fraudCount: fraudAlerts.length,
          matchRate,
          totalDiscrepancyAmount,
          pairs: updatedPairs,
          fraudAlerts,
          summaryNote: `Reconciliation run completed. ${matchedCount} matched, ${unmatchedCount} discrepancies, ${fraudAlerts.length} fraud risk flags detected.`,
        };

        DB.saveSession(newSession);

        res.json({ session: newSession });
      } catch (err: any) {
        console.error('Error during upload and reconcile:', err);
        res.status(500).json({ error: err.message || 'Server error processing financial reconciliation.' });
      }
    }
  );

  // --- SESSIONS HISTORY ROUTE ---
  app.get('/api/sessions', authMiddleware, (req: AuthRequest, res) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const sessions = DB.getSessionsByUser(req.user.id);
    res.json({ sessions });
  });

  app.get('/api/sessions/:id', authMiddleware, (req: AuthRequest, res) => {
    const session = DB.getSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Reconciliation session not found.' });
    }
    if (session.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this reconciliation session.' });
    }
    res.json({ session });
  });

  // --- AI CHATBOT ASSISTANT ROUTE ---
  app.post('/api/ai/chat', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { message, sessionId } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message query is required.' });
      }

      let sessionContext = sessionId ? DB.getSessionById(sessionId) : null;
      if (sessionContext && sessionContext.userId !== req.user?.id) {
        sessionContext = null;
      }

      const assistantReply = await generateChatAssistantResponse(message, sessionContext);

      res.json({
        reply: assistantReply,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error in /api/ai/chat route:', err);
      res.status(500).json({ error: err.message || 'Error processing AI chat response.' });
    }
  });

  // --- DOWNLOAD EXCEL REPORT ROUTE ---
  app.get('/api/reports/excel/:sessionId', authMiddleware, (req: AuthRequest, res) => {
    try {
      const session = DB.getSessionById(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Reconciliation session not found.' });
      }

      if (session.userId !== req.user?.id) {
        return res.status(403).json({ error: 'Access denied: You do not own this reconciliation session.' });
      }

      const excelBuffer = generateMultiSheetExcelReport(session);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=IncuRecon_Audit_Report_${session.id}.xlsx`
      );
      res.send(excelBuffer);
    } catch (err: any) {
      console.error('Error generating Excel report:', err);
      res.status(500).json({ error: 'Error generating Excel report spreadsheet.' });
    }
  });

  // --- CATCH-ALL FOR UNMATCHED /api/* ROUTES ---
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // --- GLOBAL ERROR HANDLER FOR EXPRESS ---
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: err?.message || 'Internal server error occurred.' });
  });

  // --- VITE / STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IncuRecon AI Server running on http://0.0.0.0:${PORT}`);
  });
}

// Sample Data Generator for 1-Click Demo
function getSampleInternalLedger(): TransactionItem[] {
  return [
    {
      id: 'int-1',
      date: '2026-03-01',
      description: 'Vendor Settlement - Apex Global Logistics',
      reference: 'INV-88201',
      debit: 12500.0,
      credit: 0,
      amount: -12500.0,
      source: 'internal',
    },
    {
      id: 'int-2',
      date: '2026-03-03',
      description: 'Client Wire Deposit - Horizon Tech Solutions',
      reference: 'DEP-90412',
      debit: 0,
      credit: 45000.0,
      amount: 45000.0,
      source: 'internal',
    },
    {
      id: 'int-3',
      date: '2026-03-05',
      description: 'Monthly SaaS Cloud Subscriptions',
      reference: 'SUB-20419',
      debit: 2450.5,
      credit: 0,
      amount: -2450.5,
      source: 'internal',
    },
    {
      id: 'int-4',
      date: '2026-03-08',
      description: 'Office Equipment Purchase - Ergonomic Chairs',
      reference: 'PO-33201',
      debit: 5000.0,
      credit: 0,
      amount: -5000.0,
      source: 'internal',
    },
    {
      id: 'int-5',
      date: '2026-03-10',
      description: 'Executive Travel Reimbursement - Jane Smith',
      reference: 'EXP-10928',
      debit: 1240.0,
      credit: 0,
      amount: -1240.0,
      source: 'internal',
    },
    {
      id: 'int-6',
      date: '2026-03-12',
      description: 'Consulting Fee Payment - Vanguard Legal',
      reference: 'INV-44012',
      debit: 8500.0,
      credit: 0,
      amount: -8500.0,
      source: 'internal',
    },
    {
      id: 'int-7',
      date: '2026-03-14',
      description: 'Consulting Fee Payment - Vanguard Legal',
      reference: 'INV-44012', // Intentional Duplicate Payment
      debit: 8500.0,
      credit: 0,
      amount: -8500.0,
      source: 'internal',
    },
    {
      id: 'int-8',
      date: '2026-03-15',
      description: 'Quarterly Audit Fee - Deloitte Advisory',
      reference: 'AUD-99120',
      debit: 15000.0,
      credit: 0,
      amount: -15000.0,
      source: 'internal',
    },
  ];
}

function getSampleBankStatement(): TransactionItem[] {
  return [
    {
      id: 'ext-1',
      date: '2026-03-01',
      description: 'APEX GLOBAL LOGISTICS WIRE OUT',
      reference: 'INV-88201',
      debit: 12500.0,
      credit: 0,
      amount: -12500.0,
      source: 'external',
    },
    {
      id: 'ext-2',
      date: '2026-03-03',
      description: 'INCOMING WIRE HORIZON TECH SOLUTIONS',
      reference: 'DEP-90412',
      debit: 0,
      credit: 45000.0,
      amount: 45000.0,
      source: 'external',
    },
    {
      id: 'ext-3',
      date: '2026-03-05',
      description: 'AWS CLOUD SERVICES RECURRING',
      reference: 'SUB-20419',
      debit: 2475.5, // Amount Mismatch: Bank charged $2475.50 instead of $2450.50 ($25 bank fee)
      credit: 0,
      amount: -2475.5,
      source: 'external',
    },
    {
      id: 'ext-4',
      date: '2026-03-08',
      description: 'OFFICE DEPOT DISBURSEMENT',
      reference: 'PO-33201',
      debit: 5000.0,
      credit: 0,
      amount: -5000.0,
      source: 'external',
    },
    {
      id: 'ext-5',
      date: '2026-03-10',
      description: 'REIMBURSEMENT JANE SMITH',
      reference: 'EXP-10928',
      debit: 1240.0,
      credit: 0,
      amount: -1240.0,
      source: 'external',
    },
    {
      id: 'ext-6',
      date: '2026-03-12',
      description: 'VANGUARD LEGAL WIRE TRANSFER',
      reference: 'INV-44012',
      debit: 8500.0,
      credit: 0,
      amount: -8500.0,
      source: 'external',
    },
    {
      id: 'ext-7',
      date: '2026-03-16',
      description: 'UNRECORDED DIRECT DEBIT - GLOBAL MARKETING CORP', // Missing from ledger (Ghost Payment alert)
      reference: 'DIRECT-DEBIT-7712',
      debit: 3200.0,
      credit: 0,
      amount: -3200.0,
      source: 'external',
    },
  ];
}

startServer();
