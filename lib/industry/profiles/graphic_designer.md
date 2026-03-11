## 14. GRAPHIC DESIGNER/BRAND DESIGNER

### Core Workflows
- Client inquiry, discovery call
- Proposal with scope, timeline, deliverables
- Contract signed, deposit paid
- Creative brief/questionnaire
- Concept development, present options
- Revision rounds (tracked and limited)
- Final delivery (file package with all formats)
- Brand guidelines document

### Must-Have Features
- **Proposal builder** with scope, timeline, and revision limits
- **Project management** with phases and milestones
- **Revision tracking** (round 1, 2, 3 -- with contractual limits)
- **File delivery** (organized by format: print, web, social)
- **Client feedback/approval** system (comment on specific deliverables)
- **Contract + e-signature**
- **Time tracking** (for hourly projects or internal profitability)
- **Invoicing with milestones** (50% upfront, 50% on delivery)
- **Portfolio/case study pages**

### Database Schema
```
clients (id, name, email, company, industry, status[LEAD|ACTIVE|PAST])
projects (id, client_id, name, type[LOGO|BRAND_IDENTITY|WEBSITE|PACKAGING|SOCIAL], status[BRIEF|CONCEPT|REVISION|FINAL|DELIVERED], proposal_id, start_date, deadline, budget)
proposals (id, client_id, scope_text, deliverables[], timeline_weeks, price, revision_rounds_included, status[DRAFT|SENT|ACCEPTED|DECLINED])
milestones (id, project_id, name, phase[DISCOVERY|CONCEPT|REVISION_1|REVISION_2|FINAL|DELIVERY], due_date, status, payment_due)
revisions (id, project_id, round_number, feedback_text, files_updated[], status[REQUESTED|IN_PROGRESS|DELIVERED], requested_at)
deliverables (id, project_id, name, type[LOGO|ICON|GUIDELINE|SOCIAL_TEMPLATE|PRINT_FILE], files_json[{format, url, dimensions}], version, approved)
contracts (id, project_id, terms, revision_limit, kill_fee_percent, signed_at)
invoices (id, project_id, milestone_id, amount, status, paid_at)
time_entries (id, project_id, description, duration_min, date)
```

### API Routes
```
POST   /api/proposals                        — create proposal
POST   /api/projects                         — start project from accepted proposal
POST   /api/projects/:id/brief               — submit creative brief
POST   /api/revisions                        — submit revision request
PATCH  /api/revisions/:id                    — deliver revision
POST   /api/deliverables/:id/approve         — client approves deliverable
POST   /api/deliverables/:id/files           — upload final files
GET    /api/projects/:id/status              — project timeline view
POST   /api/time                             — log time
GET    /api/reports/profitability             — project profitability
```

### Payment Patterns
Project-based (50% deposit, 50% on delivery). Milestone payments for larger projects. Retainer for ongoing design work ($500-5,000/mo). Hourly for overflow/ad-hoc. Rush fees (25-50% surcharge). Kill fee in contract (25-50% if cancelled).

### Client Interaction Model
Find via portfolio, Dribbble, referral, social media. Discovery call to understand brand. Revision process is the core interaction. File delivery closes the project. Ongoing retainers for repeat clients. Case studies attract similar clients.

### Industry-Specific Nuances
- **Revision tracking and limits** -- scope creep is the #1 profitability killer
- **File delivery organization** (AI, EPS, SVG, PNG, JPG in various sizes)
- **Brand guidelines** as a standard deliverable
- **Kill fee** in contract for cancelled projects
- **Time tracking for internal profitability** even on fixed-price projects

### What They Currently Cobble Together (and Cost)
- Bonsai: $17-52/mo
- Plutio: $19/mo
- HoneyBook: $36-109/mo
- Notion for project management: free-$10/mo
- Dropbox/Google Drive for file delivery: free-$20/mo
- **Total monthly SaaS spend: $40-200/mo**

---