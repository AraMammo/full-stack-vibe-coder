## 7. CONSULTANT/COACH (Business, Life, Executive)

### Core Workflows
- Discovery call booked via calendar link
- Proposal/contract sent, signed
- Payment collected (upfront or recurring)
- Sessions delivered (1:1 video calls, group calls)
- Session notes, action items shared
- Resources/frameworks delivered between sessions
- Progress tracked, engagement assessed

### Must-Have Features
- **Scheduling/calendar integration** (discovery calls, sessions)
- **Proposal + contract builder** with e-signature
- **Payment processing** (packages, subscriptions, payment plans)
- **Client portal** (session notes, resources, action items, progress)
- **Session notes** with action item tracking
- **Group program management** (cohorts, group calls)
- **Content/resource library** (frameworks, worksheets, videos)
- **Pipeline/CRM** (leads -> discovery -> proposal -> client)
- **Intake forms/questionnaires**

### Database Schema
```
clients (id, name, email, phone, company, role, stage[LEAD|DISCOVERY|PROPOSAL|ACTIVE|PAUSED|COMPLETED], source, lifetime_value)
programs (id, name, type[ONE_ON_ONE|GROUP|HYBRID], duration_weeks, price, session_count, description)
engagements (id, client_id, program_id, status[ACTIVE|PAUSED|COMPLETED], start_date, end_date, sessions_used, sessions_total, stripe_subscription_id)
sessions (id, engagement_id, datetime, duration_min, type[DISCOVERY|COACHING|GROUP], status[SCHEDULED|COMPLETED|CANCELLED|RESCHEDULED], recording_url)
session_notes (id, session_id, coach_notes, client_visible_notes, action_items_json[{task, due_date, status}])
proposals (id, client_id, program_id, custom_price, status[DRAFT|SENT|VIEWED|SIGNED|DECLINED], contract_url, signed_at)
resources (id, title, type[PDF|VIDEO|LINK|WORKSHEET], url, program_ids[], tags[])
intake_forms (id, client_id, responses_json, submitted_at)
pipeline (id, client_id, stage, last_activity, next_follow_up, notes)
```

### API Routes
```
GET    /api/calendar/availability          — open slots
POST   /api/bookings/discovery             — book discovery call
POST   /api/proposals                      — create + send proposal
POST   /api/proposals/:id/sign             — e-sign contract
POST   /api/engagements                    — start engagement
POST   /api/sessions/:id/notes             — save session notes
GET    /api/clients/:id/portal             — client portal view
GET    /api/clients/:id/action-items       — outstanding action items
POST   /api/resources                      — upload resource
GET    /api/pipeline                       — CRM pipeline view
GET    /api/reports/revenue                — revenue dashboard
```

### Payment Patterns
Package pricing (6 sessions for $3,000). Monthly retainer ($500-5,000/mo). Payment plans (split across 3-6 months). Group programs (one-time or monthly). VIP days (full-day intensive, one-time). Discovery calls are free.

### Client Interaction Model
Find via LinkedIn, podcast appearances, speaking, referrals. Discovery call converts. Relationship-driven. Ongoing scheduling cadence. Email/text between sessions. Testimonials and case studies drive new leads.

### Industry-Specific Nuances
- **Discovery call conversion tracking** is the key metric
- **Client portal** must feel premium (not a generic dashboard)
- **Session note confidentiality** -- coach notes vs. client-visible notes
- **Intellectual property management** (frameworks, tools, worksheets)
- **Testimonial collection** workflow

### What They Currently Cobble Together (and Cost)
- Calendly: $10-16/mo
- HoneyBook or Dubsado: $20-109/mo
- Zoom: $13-22/mo
- Google Drive for resources
- Stripe for payments: 2.9%
- Notion for client portals
- Mailchimp for email: $13-350/mo
- **Total monthly SaaS spend: $80-500/mo across 5-7 tools**

---