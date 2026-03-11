## 23. EARLY-STAGE SaaS FOUNDER

### Core Workflows
- Validate idea (landing page + waitlist)
- Collect email signups, gauge demand
- Build MVP (core feature only)
- Launch to waitlist
- Collect feedback, iterate
- Add billing, convert free to paid
- Track metrics (signups, activation, retention, revenue)

### Must-Have Features
- **Landing page** with waitlist capture
- **Waitlist management** with position, referral program
- **Email campaigns** (launch announcement, updates)
- **User authentication** (sign up, login, password reset)
- **Billing/subscription** management
- **Feature flags** for controlled rollout
- **User feedback collection** (in-app, surveys)
- **Analytics dashboard** (MRR, churn, activation, DAU/MAU)
- **Changelog** (public product updates)
- **Status page** (uptime monitoring)

### Database Schema
```
waitlist (id, email, name, referral_code, referred_by, position, source, signed_up_at, invited_at, converted_at)
users (id, email, name, password_hash, role[USER|ADMIN], status[ACTIVE|TRIAL|CHURNED|BANNED], signed_up_at, last_login, trial_ends_at)
subscriptions (id, user_id, plan_id, stripe_subscription_id, status[TRIALING|ACTIVE|PAST_DUE|CANCELLED], started_at, cancelled_at)
plans (id, name, price_monthly, price_annual, features[], limits_json, stripe_price_id)
feature_flags (id, key, description, enabled_for[ALL|PERCENTAGE|USER_IDS|PLAN], percentage, user_ids[])
feedback (id, user_id, type[BUG|FEATURE_REQUEST|GENERAL], title, description, status[NEW|PLANNED|IN_PROGRESS|DONE|DECLINED], votes_count, created_at)
feedback_votes (id, feedback_id, user_id)
changelog_entries (id, title, content, type[FEATURE|IMPROVEMENT|FIX], published_at)
metrics_daily (id, date, total_users, new_signups, active_users, mrr, churn_rate, trial_conversions)
```

### API Routes
```
POST   /api/waitlist                         — join waitlist
GET    /api/waitlist/position/:email         — check position
POST   /api/auth/register                    — sign up
POST   /api/auth/login                       — log in
POST   /api/subscriptions                    — start subscription
PATCH  /api/subscriptions/:id               — change/cancel plan
GET    /api/features/:key                    — check feature flag
POST   /api/feedback                         — submit feedback
POST   /api/feedback/:id/vote               — upvote feedback
GET    /api/changelog                        — public changelog
GET    /api/admin/metrics                    — metrics dashboard
POST   /api/admin/invite-batch              — invite from waitlist
```

### Payment Patterns
Free tier/trial (14-30 days). Monthly subscription ($9-299/mo). Annual discount (20%). Usage-based pricing for some SaaS. Lifetime deals during launch (controversial but common).

### Client Interaction Model
Find early users via Product Hunt, Hacker News, Twitter/X, Reddit, cold outreach. Waitlist builds pre-launch excitement. Email is the launch channel. In-app feedback creates product direction. Community (Discord/Slack) for early adopters.

### Industry-Specific Nuances
- **Waitlist with referral** -- position improves when you refer others
- **Feature flags** essential for controlled rollout
- **MRR/churn tracking** from day one
- **Trial-to-paid conversion** is the make-or-break metric
- **Public roadmap/feedback board** builds trust

### What They Currently Cobble Together (and Cost)
- Carrd for landing page: $9-49/year
- Webflow for better landing page: $14-39/mo
- Mailchimp/ConvertKit for email: $13-199/mo
- Stripe for billing: 2.9%
- Canny for feedback: $79-359/mo
- Vercel/Railway for hosting: $0-20/mo
- **Total monthly SaaS spend: $30-500/mo before writing any product code**

---