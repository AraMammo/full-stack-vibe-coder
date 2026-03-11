## 12. FINANCIAL ADVISOR/PLANNER

### Core Workflows
- Prospect discovery meeting
- Data gathering (financial accounts, goals, risk tolerance)
- Financial plan creation (retirement, estate, tax, insurance)
- Plan presentation meeting
- Implementation (account opening, transfers, insurance applications)
- Ongoing management (quarterly reviews, rebalancing, life event updates)
- Compliance documentation (suitability, fiduciary records)

### Must-Have Features
- **CRM** with household-level tracking (spouses, children, beneficiaries)
- **Financial planning tools** (projections, Monte Carlo, tax scenarios)
- **Account aggregation** (view client's full financial picture)
- **Compliance documentation** (meeting notes with regulatory requirements)
- **Client portal** (view accounts, plans, documents)
- **Workflow automation** (new client onboarding, annual review prep)
- **Calendar/scheduling**
- **Fee billing** (AUM-based, flat fee, or hourly)
- **Document vault** (secure storage for estate docs, insurance policies)
- **Risk assessment questionnaires**

### Database Schema
```
households (id, name, primary_contact_id, advisor_id, status[PROSPECT|ONBOARDING|ACTIVE|INACTIVE], aum, fee_schedule_id, annual_review_month)
contacts (id, household_id, name, email, phone, dob, ssn_encrypted, role[PRIMARY|SPOUSE|DEPENDENT|BENEFICIARY|TRUSTEE])
accounts (id, household_id, type[IRA|ROTH|401K|BROKERAGE|529|TRUST|INSURANCE|ANNUITY], custodian, account_number_encrypted, balance, last_updated)
financial_plans (id, household_id, version, goals_json[], projections_json, assumptions_json, status[DRAFT|PRESENTED|ACCEPTED], created_at)
meetings (id, household_id, datetime, type[DISCOVERY|PLAN_PRESENTATION|REVIEW|AD_HOC], notes, action_items[], compliance_documentation)
tasks (id, household_id, title, category[ONBOARDING|REVIEW|SERVICE|COMPLIANCE], assigned_to, due_date, status)
documents (id, household_id, type[PLAN|STATEMENT|ESTATE_DOC|INSURANCE_POLICY|TAX_RETURN], name, url, year)
fee_schedules (id, type[AUM_TIERED|FLAT|HOURLY|SUBSCRIPTION], tiers_json[], flat_amount, billing_frequency)
billing (id, household_id, period, aum_at_billing, fee_amount, status[CALCULATED|INVOICED|PAID])
compliance_records (id, household_id, type[SUITABILITY|ADV_DELIVERY|PRIVACY_NOTICE], date, document_url)
```

### API Routes
```
POST   /api/households                       — create household
GET    /api/households/:id                   — full household view
POST   /api/accounts/aggregate               — pull account data
POST   /api/plans                            — create financial plan
GET    /api/plans/:id/projections            — run projections
POST   /api/meetings/:id/notes               — save meeting notes + compliance
GET    /api/calendar/reviews-due             — upcoming annual reviews
POST   /api/billing/calculate                — calculate AUM fees
GET    /api/compliance/audit                 — compliance audit report
GET    /api/clients/:id/portal               — client portal
POST   /api/risk-assessment                  — risk tolerance questionnaire
```

### Payment Patterns
AUM-based (0.5-1.5% of assets, billed quarterly). Flat fee ($1,000-10,000/year). Hourly ($150-500/hr). Subscription model emerging ($100-300/mo). Fee calculated on account value, deducted directly from accounts.

### Client Interaction Model
Referral-driven. Long sales cycle for prospects. Quarterly review meetings. Annual plan update. Communication around market events, life changes. Relationship lasts decades. Trust and fiduciary duty are paramount.

### Industry-Specific Nuances
- **Household-level, not individual** -- married couples are one unit
- **Compliance/regulatory documentation** is mandatory (SEC/FINRA rules)
- **AUM fee calculation** must handle tiered breakpoints
- **Account aggregation** across custodians is critical for holistic view
- **Succession planning** for the advisor's own practice

### What They Currently Cobble Together (and Cost)
- Wealthbox: $39-59/user/mo
- Redtail: $99/mo (per database)
- RightCapital: $125/mo (planning software)
- Orion/Black Diamond (portfolio management): $200+/mo
- Riskalyze for risk assessment: $100+/mo
- **Total monthly SaaS spend: $400-1,000/mo per advisor**

---