## 15. WEB AGENCY/FREELANCE DEVELOPER

### Core Workflows
- Lead qualification (budget, timeline, scope)
- Discovery and requirements gathering
- Proposal with scope, phases, tech stack
- Contract, deposit, project kickoff
- Sprint-based development (design -> dev -> review -> deploy)
- Client feedback rounds per phase
- QA, staging, launch
- Hosting/maintenance handoff or retainer

### Must-Have Features
- **Project management** with phases, tasks, subtasks
- **Client portal** (progress visibility, feedback, documents)
- **Proposal + SOW builder** with scope, phases, pricing
- **Time tracking** per project per team member
- **Invoicing** (milestone-based, hourly, or retainer)
- **Staging/preview links** for client review
- **Bug/issue tracker** (client-facing)
- **Hosting management** for client sites (recurring revenue)
- **Contracts with SOW** and change order process

### Database Schema
```
clients (id, name, company, email, phone, status[PROSPECT|ACTIVE|MAINTENANCE|PAST])
projects (id, client_id, name, type[WEBSITE|WEB_APP|MOBILE|ECOMMERCE], status[DISCOVERY|PROPOSAL|ACTIVE|REVIEW|LAUNCHED|MAINTENANCE], tech_stack[], start_date, deadline, budget, hosting_plan_id)
phases (id, project_id, name[DISCOVERY|DESIGN|DEVELOPMENT|QA|LAUNCH], status, start_date, end_date)
tasks (id, phase_id, project_id, title, description, assigned_to, status[TODO|IN_PROGRESS|REVIEW|DONE], priority, estimated_hours, actual_hours)
proposals (id, client_id, scope_document, phases_json[], total_price, payment_schedule[], status)
change_orders (id, project_id, description, additional_cost, additional_time, status[REQUESTED|APPROVED|DECLINED], approved_at)
feedback (id, project_id, phase_id, client_comment, screenshot_url, page_url, status[OPEN|IN_PROGRESS|RESOLVED], created_at)
invoices (id, project_id, phase_id, type[DEPOSIT|MILESTONE|RETAINER|HOSTING], amount, status, paid_at)
hosting_plans (id, client_id, project_id, domain, type[MANAGED|MAINTENANCE], monthly_fee, includes[], stripe_subscription_id)
time_entries (id, task_id, user_id, hours, date, billable, notes)
```

### API Routes
```
POST   /api/proposals                        — create proposal/SOW
POST   /api/projects                         — create project
GET    /api/projects/:id/board               — kanban board view
PATCH  /api/tasks/:id                        — update task
POST   /api/change-orders                    — submit change order
POST   /api/feedback                         — client submits feedback
GET    /api/projects/:id/client-portal       — client view
POST   /api/time                             — log time
POST   /api/invoices/from-milestone          — generate invoice from milestone
GET    /api/hosting                          — all managed hosting clients
GET    /api/reports/profitability             — project profitability
GET    /api/reports/utilization               — team utilization
```

### Payment Patterns
Project-based (30/30/30/10 milestone splits common). Retainer for ongoing work ($1,000-10,000/mo). Hosting/maintenance subscriptions ($50-500/mo per client, high margin). Hourly for ad-hoc work. Change order process for scope additions.

### Client Interaction Model
Find via referral, portfolio, Clutch/Upwork, Google. Long sales cycle for larger projects. Sprint-based check-ins during development. Staging previews for feedback. Launch is a big moment. Hosting retainer creates recurring relationship.

### Industry-Specific Nuances
- **Scope creep management** via change orders
- **Hosting retainers** are the recurring revenue play
- **Tech stack selection** impacts project timeline and cost
- **Client feedback on staging** must be structured (not random emails)
- **Handoff documentation** if client takes over maintenance

### What They Currently Cobble Together (and Cost)
- Bonsai/Plutio: $19-52/mo
- ClickUp/Asana/Monday: $10-30/user/mo
- Harvest for time tracking: $11/user/mo
- Stripe for payments: 2.9%
- GitHub: $4-21/user/mo
- Vercel/Netlify for hosting: $20+/mo
- **Total monthly SaaS spend: $100-400/mo for solo, $500-2,000/mo for agency**

---