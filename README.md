# IncuRecon AI

**The AI reconciliation layer that Excel can't be, and legacy accounting suites weren't built to be.**

IncuRecon AI is a self-hosted, AI-powered financial reconciliation platform that automates the comparison of bank statements against accounting ledgers, catches fraud that manual review misses, explains every discrepancy in plain English, and produces an audit-ready report — without sending a single row of financial data to a third-party cloud.

🔗 **Live demo:** [incurecon-ai.ai.studio](https://incurecon-ai.ai.studio/)

---

## Table of Contents

- [The Opportunity](#the-opportunity)
- [Why Not Excel?](#why-not-excel)
- [Why Not QuickBooks, Xero, or Sage?](#why-not-quickbooks-xero-or-sage)
- [Competitive Snapshot](#competitive-snapshot)
- [Investor FAQ: Security, Safety & Accuracy](#investor-faq-security-safety--accuracy)
- [How It Works: Five Layers of Intelligence](#how-it-works-five-layers-of-intelligence)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Status & Roadmap](#status--roadmap)
- [Getting Started (Technical)](#getting-started-technical)
- [Contact](#contact)

---

## The Opportunity

Every business that touches money reconciles accounts — and almost all of them still do it by hand, in a spreadsheet, once a week or once a month. That workflow has three structural problems:

1. **It doesn't scale.** More transactions means more analyst-hours, linearly, forever.
2. **It doesn't catch fraud.** Duplicate payments, round-number anomalies, and split transactions are invisible to a human scanning rows.
3. **It doesn't produce evidence.** When an auditor asks "why was this flagged?", a spreadsheet has no answer beyond a colored cell.

IncuRecon AI was built to remove all three constraints — as a **self-hosted product**, not another subscription SaaS that requires handing sensitive financial data to a third party.

---

## Why Not Excel?

Excel is the incumbent because it's free, flexible, and universal — not because it's good at this job. Under the hood, reconciliation in Excel is VLOOKUP/formula-based pattern matching performed and re-verified by a human, every cycle, for every file.

| | Excel / Spreadsheets | IncuRecon AI |
|---|---|---|
| Matching logic | Manual formulas, exact-text lookups | Automated fuzzy + rule-based matching (RapidFuzz), tolerant of formatting differences |
| Fraud detection | None — relies entirely on the reviewer noticing | 6 rule-based detectors + unsupervised ML anomaly detection (Isolation Forest), running on every transaction, every time |
| Explanation of discrepancies | None | Plain-English cause, recommended journal entry, and preventive measure for every flagged item |
| Audit trail | Ad hoc, whatever the analyst remembers to document | Structured, timestamped, stored in the database and exported to the report automatically |
| Scaling with transaction volume | Linear increase in analyst time | Near-constant time per reconciliation cycle (O(n) bucket-indexed matching) |
| Human error risk | High — one bad formula or overwritten cell silently breaks the sheet | Validated inputs, deterministic rules, versioned logic |

Excel doesn't fail because it's a bad tool — it fails because reconciliation was never its job. It's a canvas, not a control system.

---

## Why Not QuickBooks, Xero, or Sage?

This is the question investors ask first, and it's the right one. Established accounting suites are **bookkeeping systems of record** — they're excellent at invoicing, ledgers, payroll, and basic bank feeds. Reconciliation inside them is typically a simple 1:1 transaction match against a live bank feed, not a fraud-aware, explainable, cross-file reconciliation engine. IncuRecon AI is not trying to replace the ledger of record — it's the **specialized reconciliation and fraud-detection layer** that sits on top of whatever accounting system a business already uses.

Key differences:

- **Data residency:** QuickBooks, Xero, and Sage are cloud-hosted — your transaction data lives on their servers. IncuRecon AI is self-hosted; the reconciliation engine, the ML models, and even the AI chat assistant (via a local LLM) can run entirely inside your own infrastructure, with nothing sent to a third party.
- **Fraud-first design:** Incumbent suites focus on categorization and bookkeeping accuracy, not fraud pattern detection. IncuRecon AI was built around six dedicated fraud detectors plus ML anomaly scoring as a first-class feature, not an add-on.
- **Explainability:** Reconciliation mismatches in most accounting software surface as a raw diff. IncuRecon AI's Explanation Engine gives the human a cause, a recommended journal entry, and a confidence score — turning a data problem into a decision-ready answer.
- **Cost structure:** Incumbent suites charge recurring per-seat or per-company subscription fees indefinitely. IncuRecon AI is built entirely on free, open-source components — there is no underlying licensing cost to pass on, which materially changes the margin profile of any commercial offering built on it.
- **File-format agnostic:** IncuRecon AI reconciles CSV, Excel, and PDF bank statements against a ledger from any source — it doesn't require both sides to already live inside the same walled-garden platform.

---

## Competitive Snapshot

| Capability | Excel | QuickBooks / Xero / Sage | IncuRecon AI |
|---|---|---|---|
| Cross-file bank-to-ledger reconciliation | Manual | Basic bank-feed matching | AI-powered fuzzy + rule matching |
| Dedicated fraud detection | ✗ | Limited | ✓ 6 rule-based detectors + ML anomaly detection |
| Plain-English explanations w/ journal entries | ✗ | ✗ | ✓ |
| Built-in AI financial assistant | ✗ | Premium add-on in some tiers | ✓ Included, runs locally |
| Self-hosted / data stays on-premises | Local file, no structured backend | ✗ (cloud-hosted by vendor) | ✓ |
| Recurring per-seat SaaS cost | None (but high labor cost) | Yes | No underlying licensing cost |
| Audit-ready structured report | ✗ | Partial | ✓ 6-sheet exportable workbook |

---

## Investor FAQ: Security, Safety & Accuracy

### Is our financial data safe with this system?
IncuRecon AI is architected to be **self-hosted by default** — the backend, database, ML models, and even the AI chat assistant (via Ollama, a local LLM runtime) run on infrastructure you control. Unlike cloud-native competitors, no transaction data is required to leave your servers to use any feature, including the AI assistant. This is a structural, not a policy-based, privacy guarantee.

### What security controls are actually in place?
- **Authentication:** JWT-based sessions with expiry, plus bcrypt password hashing (industry-standard, salted, computationally expensive to brute-force)
- **Injection protection:** All database access goes through an ORM (SQLAlchemy) — no raw SQL is ever constructed from user input
- **XSS protection:** The frontend is built in React, which escapes rendered output by default
- **Input validation:** Every API endpoint validates incoming data with Pydantic schemas before it touches business logic
- **Audit trail:** Every reconciliation action is logged to the database and included in the exported report, so activity is reconstructable after the fact

### Has it been through a formal security audit or certification (SOC 2, ISO 27001, etc.)?
Not yet — the platform is at prototype/early-pilot stage. A third-party penetration test and formal security certification are on the roadmap ahead of any enterprise or regulated-industry rollout, and we view that as a near-term use-of-funds priority rather than a nice-to-have.

### How accurate is the fraud detection and matching?
Accuracy comes from layering multiple independent methods rather than trusting a single model:
- **Deterministic rule-based detectors** (duplicate payment, round-number, split payment, ghost payment, abnormal frequency) catch known fraud patterns with no false-positive ambiguity — the logic is fully inspectable, not a black box.
- **Isolation Forest ML detection** adds unsupervised anomaly scoring on top, catching patterns the fixed rules don't anticipate, trained fresh on each dataset rather than relying on a stale, generic model.
- **Every match and every fraud alert carries a confidence score** (0–1) and a risk level (HIGH/MEDIUM/LOW) — nothing is presented as a silent, unexplained decision. A human always sees *why* the system flagged something.
- **Formal accuracy benchmarking** (precision/recall against labeled historical fraud datasets, across pilot customers) is the next validation milestone we're prioritizing — we want investors and customers to see measured numbers, not just architectural claims.

### What happens if the AI is wrong?
Every AI-driven output — a match, a fraud flag, an explanation — is a *recommendation with a confidence score*, not an automatic ledger write. A human reviews and approves before anything is finalized, and the rule-based detectors (which are deterministic and fully auditable) are never dependent on the LLM being available or correct. If the local LLM is absent or wrong, the rule-based fallback and explanation templates keep the system functional and consistent.

### Is this dependent on a third-party AI API (OpenAI, Anthropic, etc.) that could change pricing or availability?
No. The conversational AI assistant runs on a local, open-weight model (Llama 3.1 8B by default, swappable for Qwen2.5, DeepSeek-R1, Gemma, Mistral, or Phi) via Ollama. There is no external API dependency, no per-token cost, and no vendor lock-in on the AI layer. This is both a cost advantage and a resilience advantage — the core reconciliation and fraud detection functionality doesn't depend on the LLM at all.

### Why should a business trust an AI-flagged discrepancy over their own accountant?
The system isn't positioned to replace the accountant — it's positioned to make the accountant faster and harder to fool. The explanation engine's output (cause, recommended resolution, journal entry, preventive measure) is designed to be checked in seconds rather than derived from scratch in minutes, and the fraud detectors catch patterns that are genuinely difficult for a human to notice at scale (e.g., 5 similar sub-threshold transactions split across 3 days to a new payee).

---

## How It Works: Five Layers of Intelligence

1. **Local LLM Chat Assistant** (Ollama, Llama 3.1 8B) — context-aware AI assistant for natural-language questions about the reconciliation, running entirely on local infrastructure
2. **ML Fraud Detection** (scikit-learn Isolation Forest) — unsupervised anomaly detection trained fresh per dataset
3. **Fuzzy Matching** (RapidFuzz) — links transactions that are worded differently but represent the same event, with confidence scoring
4. **Rule-Based Fraud Detectors** — 6 deterministic, fully auditable detectors: Duplicate Payment, Round Number Fraud, Split Payment, Ghost Payment, Abnormal Frequency, Statistical Anomaly
5. **Explanation Engine** — instant, template-based, plain-English narratives with recommended journal entries — runs with zero model inference required

If Ollama isn't installed, the system falls back automatically to a built-in rule-based knowledge base — every core feature keeps working.

---

## Core Features

- Authentication (JWT, register/login, password reset, protected routes)
- Professional landing page and dashboard with 6 live KPIs
- Drag-and-drop upload for CSV / Excel / PDF, with validation and row-count extraction
- Intelligent file processing — auto-detects and normalizes 9 field types, handles messy column naming via alias mapping
- AI reconciliation engine — O(n) bucket-indexed matching, fuzzy matching, 5 match categories
- Fraud detection — 6 detectors + ML anomaly scoring, per-alert remediation guidance
- AI explanation engine — plain-English cause and journal entry for every discrepancy
- AI financial assistant — persistent, context-aware chat, local-first with rule-based fallback
- 6-sheet, color-coded, downloadable Excel report (Summary, Matched, Unmatched, Fraud, AI Recommendations, Audit Trail)
- Dark/light mode, responsive design, auto-generated Swagger API docs
- Ready-to-use sample datasets with deliberate discrepancies for demos

---

## Tech Stack

**Backend:** FastAPI, Python 3.11, Pandas/NumPy, SQLAlchemy, SQLite (swappable for PostgreSQL), Passlib/bcrypt, python-jose (JWT), pdfplumber, openpyxl, RapidFuzz, scikit-learn, XlsxWriter, httpx, LangChain

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Zustand, Axios, Recharts, React Dropzone

**AI/ML:** Ollama (Llama 3.1 8B and alternatives), scikit-learn Isolation Forest, RapidFuzz, rule-based NLG

Built entirely on free, open-source components — no underlying per-seat licensing cost baked into the product's cost structure.

---

## Status & Roadmap

**Current status:** Working prototype (bootcamp capstone build), functional end-to-end from upload through audit-ready report, available as a live demo.

**Near-term roadmap:**
- Formal accuracy benchmarking against labeled fraud datasets
- Third-party security audit / penetration testing
- PostgreSQL-backed production deployment and Docker packaging
- Pilot deployments with early accounting/finance teams
- Email notifications and role-based multi-user access
- Expanded AI orchestration (LangChain layer) for deeper financial workflows

---

## Getting Started (Technical)

> For engineering evaluation. See the sections above for the product and business case.

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- [Ollama](https://ollama.com) (optional — required only for the local LLM chat assistant; the app runs without it via the rule-based fallback)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API: `http://localhost:8000` · Docs: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App: `http://localhost:5173`

### Optional: enable the local LLM assistant
```bash
ollama pull llama3.1:8b
ollama serve
```

---

## Contact

Interested in a pilot, a technical deep-dive, or discussing investment? Reach out via [state preferred contact method — email / calendar link] or try the live demo at [incurecon-ai.ai.studio](https://incurecon-ai.ai.studio/).

---

## License

Add your chosen license here (e.g. MIT, Apache 2.0).
