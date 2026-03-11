## 21. NEWSLETTER/CONTENT CREATOR

### Core Workflows
- Write and publish content (on schedule)
- Grow subscriber list (lead magnets, landing pages, referral program)
- Segment audience for targeted content
- Monetize (paid subscriptions, sponsorships, affiliate links)
- Track performance (open rates, click rates, growth)
- Manage sponsor relationships

### Must-Have Features
- **Email editor** (rich text, images, embeds)
- **Subscriber management** (segments, tags, automation)
- **Landing pages** for opt-in
- **Paid subscription** management
- **Referral program** (subscriber brings subscriber)
- **Analytics** (open rate, click rate, growth, churn)
- **Sponsor management** (rate card, placement tracking, reporting)
- **Archive/blog** (web-readable versions of past emails)
- **Automation** (welcome sequence, re-engagement)

### Database Schema
```
subscribers (id, email, name, status[ACTIVE|UNSUBSCRIBED|BOUNCED], type[FREE|PAID], tags[], source, referrer_id, subscribed_at, stripe_subscription_id)
posts (id, title, slug, content_html, summary, status[DRAFT|SCHEDULED|PUBLISHED], type[FREE|PAID], published_at, scheduled_for, send_stats_json)
segments (id, name, rules_json[{field, operator, value}])
automations (id, name, trigger[SUBSCRIBE|TAG_ADDED|CUSTOM], emails_json[{delay, subject, body}], status[ACTIVE|PAUSED])
sponsors (id, company_name, contact_name, email, rate_card_json, status[PROSPECT|ACTIVE|PAST])
sponsorship_placements (id, sponsor_id, post_id, placement_type[BANNER|NATIVE|DEDICATED], price, clicks, impressions)
referral_program (id, subscriber_id, referral_code, referrals_count, rewards_earned[])
landing_pages (id, slug, title, content, form_fields, thank_you_redirect)
analytics_daily (id, date, total_subscribers, new_subscribers, unsubscribes, open_rate, click_rate)
```

### API Routes
```
POST   /api/posts                            — create/publish post
POST   /api/posts/:id/send                   — send to subscribers
GET    /api/subscribers?segment=             — subscriber list
POST   /api/subscribers/import               — import subscribers
GET    /api/analytics/growth                 — growth metrics
GET    /api/analytics/post/:id               — per-post performance
POST   /api/automations                      — create automation
POST   /api/sponsors                         — add sponsor
POST   /api/sponsorships                     — track sponsorship placement
GET    /api/referral/:code                   — referral tracking
POST   /api/landing-pages                    — create landing page
```

### Payment Patterns
Free tier with paid upgrade ($5-25/mo for subscribers). Sponsorship revenue ($50-5,000 per placement based on list size). Affiliate commissions. Paid newsletter subscriptions (Substack model). Annual discount.

### Client Interaction Model
Audience finds via social media, SEO, cross-promotions, referrals. Subscribe via landing page. Inbox relationship (weekly/daily). Paid conversion from free. Sponsorship sales outbound to brands. Referral program for viral growth.

### Industry-Specific Nuances
- **Deliverability** -- inbox placement is the existential threat
- **Referral programs** are the growth hack (beehiiv, SparkLoop model)
- **Sponsor management** -- tracking impressions, clicks, reporting to sponsors
- **Content archive** as SEO asset
- **Platform risk** -- owning your list vs. being on Substack

### What They Currently Cobble Together (and Cost)
- Substack: free but 10% revenue cut
- beehiiv: free-$169/mo
- ConvertKit/Kit: $29-199/mo
- Ghost: $9-199/mo (self-hosted free)
- SparkLoop for referrals: $100+/mo
- **Total monthly SaaS spend: $30-400/mo + revenue cuts**

---