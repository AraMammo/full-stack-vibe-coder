## 10. LAWYER/LEGAL SERVICES

### Core Workflows
- Client intake (conflict check, matter type, urgency)
- Engagement letter sent, signed, retainer collected
- Matter opened, tasks assigned
- Work performed (research, drafting, court filings, calls)
- Time tracked per matter (6-minute increments)
- Invoice generated from time entries
- Trust/retainer account management (IOLTA compliance)

### Must-Have Features
- **Conflict of interest check** (search across all matters and parties)
- **Matter management** (case details, parties, documents, deadlines)
- **Time tracking** in 6-minute (0.1 hour) increments
- **Trust accounting** (IOLTA/escrow, separate from operating -- compliance requirement)
- **Document management** with version control
- **Court deadline tracking** (with rules-based calculation)
- **Billing** (hourly, flat fee, contingency, hybrid)
- **Client portal** (case status, documents, invoices)
- **E-signature** for engagement letters
- **Calendar integration** with court dates

### Database Schema
```
clients (id, name, email, phone, company, type[INDIVIDUAL|BUSINESS], conflict_parties[], status)
matters (id, client_id, case_number, matter_type[LITIGATION|TRANSACTIONAL|ESTATE|FAMILY|CRIMINAL|IP|CORPORATE], status[ACTIVE|CLOSED|ON_HOLD], assigned_attorneys[], practice_area, court, judge, opposing_counsel, opened_at, closed_at)
parties (id, matter_id, name, role[PLAINTIFF|DEFENDANT|WITNESS|OPPOSING_PARTY], contact_info)
time_entries (id, matter_id, attorney_id, date, duration_hours, description, rate, billable, billed_invoice_id)
invoices (id, matter_id, client_id, time_entries[], expenses[], subtotal, payments_applied, balance, status[DRAFT|SENT|PAID|OVERDUE], payment_terms)
trust_accounts (id, client_id, matter_id, ledger_entries[], balance)
trust_ledger (id, trust_account_id, type[DEPOSIT|DISBURSEMENT|INTEREST|FEE], amount, description, reference, date)
documents (id, matter_id, title, type[PLEADING|CONTRACT|CORRESPONDENCE|EVIDENCE|FILING], version, url, uploaded_by, filed_date)
deadlines (id, matter_id, type[FILING|HEARING|DISCOVERY|STATUTE_OF_LIMITATIONS], date, description, status, reminder_days[])
expenses (id, matter_id, description, amount, billable, category[FILING_FEE|TRAVEL|COPY|EXPERT|COURT_REPORTER])
conflict_checks (id, searched_name, results[], checked_by, checked_at, cleared)
```

### API Routes
```
POST   /api/conflicts/check               — run conflict check
POST   /api/matters                        — open new matter
GET    /api/matters/:id                    — matter detail with all related
POST   /api/time                           — log time entry
GET    /api/time?matter=&attorney=&period= — time report
POST   /api/invoices/generate              — generate invoice from unbilled time
GET    /api/trust/:client_id/ledger        — trust account ledger
POST   /api/trust/transaction              — record trust deposit/disbursement
GET    /api/deadlines?upcoming=30          — upcoming deadlines
POST   /api/documents                      — upload document to matter
GET    /api/reports/billable-hours         — utilization report
GET    /api/reports/ar-aging               — accounts receivable aging
```

### Payment Patterns
Hourly billing (6-minute increments, $200-1,000/hr). Flat fee for routine matters. Retainer (trust deposit, drawn against). Contingency (% of recovery). Hybrid (flat + hourly overage). IOLTA trust accounting required by bar associations.

### Client Interaction Model
Find via referral, Google, directory (Avvo, Martindale). Intake with conflict check. Communication via secure portal (privileged). Matter may last weeks (transaction) to years (litigation). Billing is monthly, payment often slow.

### Industry-Specific Nuances
- **Trust accounting (IOLTA) compliance is mandatory** -- commingling funds = disbarment
- **Conflict checks** must search every matter, party, and related entity
- **6-minute billing increment** is the industry standard
- **Court rules-based deadline calculation** (e.g., 30 days from service for answer)
- **Ethical walls** -- certain attorneys blocked from certain matters
- **Document retention periods** mandated by bar rules

### What They Currently Cobble Together (and Cost)
- Clio: $49-149/user/mo
- MyCase: $49-109/user/mo
- PracticePanther: $49-89/user/mo
- LawPay for trust accounting: $20+/mo + 2.9% processing
- Dropbox/Google Drive for documents
- **Total monthly SaaS spend: $100-400/mo per attorney (5-attorney firm: $500-2,000/mo)**

---