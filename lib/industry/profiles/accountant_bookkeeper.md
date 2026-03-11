## 9. ACCOUNTANT/BOOKKEEPER

### Core Workflows
- Client onboarded (business type, entity, fiscal year, access credentials)
- Recurring work: monthly bookkeeping, quarterly reviews, annual tax prep
- Document collection (bank statements, receipts, 1099s, W-2s)
- Work performed (categorization, reconciliation, return preparation)
- Review and approval cycle
- Deliverables sent to client (financials, returns)
- Filing deadlines tracked

### Must-Have Features
- **Client portal** with secure document upload/download
- **Workflow management** with task templates per engagement type
- **Deadline tracking** (tax filing dates, extensions, quarterly estimates)
- **Document management** (organize by client, year, document type)
- **Time tracking** per client/project
- **Recurring task automation** (monthly close checklist)
- **E-signature** for engagement letters and returns
- **Client communication** (secure messaging, not email)
- **Billing** (fixed fee, hourly, or value pricing)
- **Staff workload management** (capacity planning)

### Database Schema
```
clients (id, business_name, entity_type[SOLE_PROP|LLC|S_CORP|C_CORP|PARTNERSHIP|NONPROFIT], fiscal_year_end, tax_id_encrypted, contact_name, email, phone, assigned_staff_id, status, monthly_fee)
engagements (id, client_id, type[BOOKKEEPING|TAX_PREP|ADVISORY|PAYROLL|AUDIT], frequency[MONTHLY|QUARTERLY|ANNUAL|ONE_TIME], fee_type[FIXED|HOURLY|VALUE], fee_amount, status)
tasks (id, engagement_id, template_id, title, assigned_to, status[TODO|IN_PROGRESS|REVIEW|COMPLETE|BLOCKED], due_date, priority, time_tracked_min)
task_templates (id, engagement_type, tasks_json[{title, default_assignee_role, relative_due_days}])
deadlines (id, client_id, type[TAX_FILING|EXTENSION|QUARTERLY_ESTIMATE|PAYROLL], due_date, status[UPCOMING|FILED|EXTENDED|OVERDUE], filed_date)
documents (id, client_id, name, type[BANK_STATEMENT|RECEIPT|TAX_RETURN|FINANCIAL_STATEMENT|ENGAGEMENT_LETTER], year, url, uploaded_by, uploaded_at)
time_entries (id, task_id, staff_id, duration_min, date, billable, notes)
invoices (id, client_id, line_items[{description, hours, rate, amount}], total, status, sent_at, paid_at)
staff (id, name, role[PARTNER|MANAGER|SENIOR|STAFF|INTERN], hourly_cost, billable_rate, capacity_hours_week)
messages (id, client_id, sender_id, content, attachments[], read_at)
```

### API Routes
```
POST   /api/clients                          — onboard client
GET    /api/workflow?staff=&status=          — task board
PATCH  /api/tasks/:id                        — update task status
POST   /api/time                             — log time entry
GET    /api/deadlines?upcoming=30            — upcoming deadlines
POST   /api/documents/upload                 — secure document upload
GET    /api/clients/:id/portal              — client portal
POST   /api/invoices                         — generate invoice
GET    /api/reports/utilization              — staff utilization report
GET    /api/reports/wip                      — work in progress report
```

### Payment Patterns
Monthly fixed fee for bookkeeping ($200-2,000/mo). Annual fixed fee for tax prep ($500-5,000). Hourly for advisory ($150-500/hr). Retainer + overage model. Annual fee increases common. Payment plans for tax prep.

### Client Interaction Model
Find via referral (dominant), Google, networking. Long relationships (years). Communication cycles peak around deadlines. Document collection is the biggest friction point. Client expects deliverables on time without being asked.

### Industry-Specific Nuances
- **Deadline management is mission-critical** -- missed tax deadline = malpractice
- **Document collection** is the #1 bottleneck (chasing clients for bank statements)
- **Multi-year document retention** required
- **Staff utilization/capacity planning** directly impacts profitability
- **Seasonal workload** (Jan-Apr is 2-3x normal volume for tax firms)

### What They Currently Cobble Together (and Cost)
- TaxDome: $50-66/user/mo
- Karbon: $59-79/user/mo
- Canopy: $45-66/user/mo + modules
- QuickBooks/Xero for client books: $30-200/mo per client
- Loom for client videos
- Dropbox for documents: $20/mo
- **Total monthly SaaS spend: $200-500/mo for a solo, $500-2,000/mo for a firm**

---