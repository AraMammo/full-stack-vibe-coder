## 24. AGENCY SaaS (White-Label Tools for Clients)

### Core Workflows
- Agency signs up, configures white-label branding
- Agency creates sub-accounts per client
- Client uses platform under agency's brand
- Agency manages permissions, features per client
- Agency bills clients (markup on base platform cost)
- Agency monitors all client accounts from single dashboard

### Must-Have Features
- **White-label branding** (custom domain, logo, colors, email from)
- **Multi-tenant architecture** (agency -> client sub-accounts)
- **Per-client feature toggles**
- **Agency dashboard** (bird's-eye view of all clients)
- **Client billing** (agency marks up and resells)
- **Reporting** (per-client + agency-wide)
- **Template/asset sharing** (create once, deploy to many clients)
- **Role-based access** (agency admin, agency staff, client admin, client user)
- **API access** for custom integrations

### Database Schema
```
agencies (id, name, domain, logo_url, brand_colors_json, email_from, plan_id, stripe_customer_id)
agency_users (id, agency_id, name, email, role[OWNER|ADMIN|STAFF], permissions[])
client_accounts (id, agency_id, name, domain, settings_json, features_enabled[], status[ACTIVE|SUSPENDED|CANCELLED], created_at)
client_users (id, client_account_id, name, email, role[ADMIN|USER], permissions[])
client_billing (id, agency_id, client_account_id, amount, frequency[MONTHLY|ANNUAL], stripe_subscription_id, status)
templates (id, agency_id, type[EMAIL|LANDING_PAGE|WORKFLOW|REPORT], name, content, shared_with_clients[])
activity_log (id, agency_id, client_account_id, user_id, action, details, timestamp)
agency_plans (id, name, max_clients, features[], price_monthly)
reports (id, client_account_id, type, period, data_json, generated_at)
```

### API Routes
```
POST   /api/agencies                         — register agency
POST   /api/agencies/:id/brand               — configure branding
POST   /api/clients                          — create client account
GET    /api/clients                          — agency dashboard (all clients)
PATCH  /api/clients/:id/features             — toggle features
POST   /api/clients/:id/billing              — set client billing
POST   /api/templates                        — create shared template
POST   /api/templates/:id/deploy             — deploy to client accounts
GET    /api/reports/agency-overview           — agency-wide metrics
POST   /api/api-keys                         — generate API key
GET    /api/activity-log                     — audit trail
```

### Payment Patterns
Platform charges agency per month ($97-497/mo base). Agency charges clients monthly ($200-2,000/mo). Agency markup is the profit margin. Per-client or per-user pricing models. Annual contracts with clients.

### Client Interaction Model
Agency sells to local businesses. White-label = client never knows the underlying platform. Agency provides setup, training, support. Client interacts with their own branded portal. Agency retains client even if they switch platforms.

### Industry-Specific Nuances
- **Multi-tenancy** is the core architecture challenge
- **White-label depth** -- custom domain, custom emails, custom login pages
- **Agency markup economics** -- buy for $5/client, sell for $200/client
- **Client isolation** -- data must never leak between clients
- **Template proliferation** -- create once, deploy to hundreds

### What They Currently Cobble Together (and Cost)
- GoHighLevel: $97-497/mo
- Vendasta: $79-1,099/mo
- DashClicks: varies
- SuiteDash: $19-99/mo
- **Total monthly SaaS spend: $100-500/mo for the agency platform**

---