## 1. HOME SERVICES (Plumber, Electrician, HVAC, Handyman)

### Core Workflows
- Receive service call (phone, web form, referral)
- Triage urgency, schedule dispatch
- Technician drives to location, diagnoses issue, provides estimate on-site
- Customer approves, work is performed
- Invoice generated, payment collected (often on-site)
- Follow-up for review request, maintenance reminders

### Must-Have Features
- **Job scheduling + dispatch board** with drag-drop calendar and tech assignment
- **Estimate/quote builder** with line items, materials markup, labor rates
- **Invoicing + on-site payment** (tap-to-pay, card reader, or payment link)
- **Customer database** with service history per address (not just per person)
- **GPS tracking** for tech fleet
- **Automated reminders** (appointment confirmation, maintenance due)
- **Before/after photo capture** attached to job record
- **Review request automation** (post-job SMS/email to Google/Yelp)

### Database Schema
```
customers (id, name, email, phone, address_id, notes, source, created_at)
addresses (id, customer_id, street, city, state, zip, lat, lng, access_notes)
jobs (id, customer_id, address_id, technician_id, status[REQUESTED|SCHEDULED|IN_PROGRESS|COMPLETE|INVOICED|PAID], scheduled_start, scheduled_end, actual_start, actual_end, job_type, description, internal_notes)
estimates (id, job_id, line_items_json, materials_total, labor_total, tax, total, status[DRAFT|SENT|APPROVED|DECLINED], sent_at, approved_at)
invoices (id, job_id, estimate_id, amount, tax, total, status[DRAFT|SENT|PAID|OVERDUE], due_date, paid_at, payment_method)
payments (id, invoice_id, amount, method[CARD|CASH|CHECK|ACH], stripe_payment_id, paid_at)
technicians (id, user_id, name, phone, skills[], hourly_rate, color_code)
job_photos (id, job_id, type[BEFORE|AFTER|DIAGNOSTIC], url, caption, created_at)
reviews (id, job_id, customer_id, rating, platform, review_url, requested_at, completed_at)
recurring_services (id, customer_id, address_id, service_type, frequency[MONTHLY|QUARTERLY|ANNUAL], next_due, last_completed)
```

### API Routes
```
POST   /api/jobs                    — create job/service request
GET    /api/jobs?status=&tech=&date= — filtered job list
PATCH  /api/jobs/:id                — update status, assign tech
POST   /api/jobs/:id/estimate       — generate estimate
POST   /api/jobs/:id/invoice        — generate invoice
POST   /api/jobs/:id/photos         — upload job photos
GET    /api/schedule?date=&tech=    — dispatch board view
POST   /api/payments                — process payment
GET    /api/customers/:id/history   — full service history at address
POST   /api/reviews/:id/request     — trigger review request
GET    /api/dashboard/metrics       — revenue, jobs completed, avg ticket
```

### Payment Patterns
One-time per job. Estimates approved before work begins. Deposits (25-50%) common for large jobs. Maintenance contracts = recurring monthly/quarterly. Payment on completion typical.

### Client Interaction Model
Clients find via Google Maps, Yelp, Nextdoor, yard signs, referrals. Book via phone call (still dominant) or web form. Communicate via text for scheduling. Return for recurring maintenance or new issues. Trust and speed of response are everything.

### Industry-Specific Nuances
- **Address-centric, not person-centric** -- service history lives at the property, not the person
- **Urgency tiers** -- emergency (today), priority (this week), scheduled (next available)
- **Permit tracking** for certain electrical/plumbing work
- **Parts/materials inventory** or at minimum cost tracking per job
- **Seasonal demand spikes** (HVAC in summer/winter, plumbing in winter)

### What They Currently Cobble Together (and Cost)
- Housecall Pro: $59-249/mo
- Jobber: $25-109/mo
- ServiceTitan: $245-500/mo/tech
- Google Calendar for scheduling
- QuickBooks for invoicing: $30-200/mo
- Thumbtack/Angi for leads: $15-50+ per lead
- **Total monthly SaaS spend: $150-800/mo**

---