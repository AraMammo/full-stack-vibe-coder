## 26. NONPROFIT/CHARITY

### Core Workflows
- Donor acquisition (events, campaigns, grants, online)
- Donation processing (one-time, recurring, pledges)
- Donor communication (thank you, updates, impact reports)
- Grant management (applications, reporting, compliance)
- Volunteer coordination
- Program/impact tracking
- Financial reporting (for board, IRS, donors)
- Annual campaign / fundraising drives

### Must-Have Features
- **Donor CRM** with giving history, engagement level, communication preferences
- **Online donation forms** (one-time, recurring, tribute/memorial)
- **Campaign management** (fundraising goals, progress tracking)
- **Acknowledgment/receipt automation** (tax receipts, thank you letters)
- **Grant tracking** (application status, reporting deadlines, deliverables)
- **Volunteer management** (sign-up, scheduling, hours tracking)
- **Email communications** (newsletters, appeals, impact updates)
- **Reporting** (donor retention, LYBUNT/SYBUNT, giving trends)
- **Event management** (galas, runs, auctions)
- **Peer-to-peer fundraising** (supporters create personal fundraising pages)

### Database Schema
```
donors (id, name, email, phone, address, type[INDIVIDUAL|CORPORATE|FOUNDATION], giving_level[MAJOR|MID|GRASSROOTS], total_lifetime_giving, last_gift_date, last_gift_amount, status[ACTIVE|LAPSED|PROSPECT])
donations (id, donor_id, amount, type[ONE_TIME|RECURRING|PLEDGE|IN_KIND], campaign_id, payment_method, stripe_payment_id, date, acknowledged, tax_receipt_sent, tribute_json)
recurring_gifts (id, donor_id, amount, frequency[MONTHLY|QUARTERLY|ANNUAL], stripe_subscription_id, status, started_at, cancelled_at)
campaigns (id, name, type[ANNUAL|CAPITAL|EVENT|EMERGENCY|PEER_TO_PEER], goal_amount, raised_amount, start_date, end_date, status)
grants (id, funder_name, amount, status[PROSPECT|APPLIED|AWARDED|REPORTING|CLOSED], application_deadline, reporting_deadlines[], deliverables[], contact_name)
volunteers (id, name, email, phone, skills[], availability_json, total_hours, status[ACTIVE|INACTIVE])
volunteer_shifts (id, volunteer_id, event_id, date, hours, role, checked_in)
events (id, name, type[GALA|RUN|AUCTION|VOLUNTEER_DAY], date, venue, ticket_price, goal, raised, attendees_count)
programs (id, name, description, budget, outcomes_tracked[])
impact_metrics (id, program_id, metric_name, period, value, target)
acknowledgments (id, donation_id, type[RECEIPT|THANK_YOU|IMPACT_REPORT], sent_at, document_url)
```

### API Routes
```
POST   /api/donations                        — process donation
POST   /api/donations/recurring              — start recurring gift
GET    /api/donors/:id                       — donor profile with history
POST   /api/donors/:id/acknowledge           — send acknowledgment
POST   /api/campaigns                        — create campaign
GET    /api/campaigns/:id/progress           — campaign thermometer
POST   /api/grants                           — track grant
GET    /api/grants/deadlines                 — upcoming grant deadlines
POST   /api/volunteers                       — register volunteer
POST   /api/volunteers/:id/log-hours         — log volunteer hours
GET    /api/reports/donor-retention           — retention analysis
GET    /api/reports/giving-trends            — giving trends report
POST   /api/events                           — create event
GET    /api/impact                           — impact dashboard
```

### Payment Patterns
One-time donations (any amount). Monthly recurring ($5-500/mo). Annual giving. Pledges (promise to give over time). In-kind donations. Event ticket sales. Auction proceeds. Corporate sponsorships. Grants (awarded, not purchased). Peer-to-peer fundraising pages.

### Client Interaction Model
Donors find via events, website, social media, email, peer referral. Relationship is cultivation-based. Regular communication about impact. Annual ask (year-end giving). Major donors get personal attention. Volunteer events build community. Board members are also donors.

### Industry-Specific Nuances
- **Tax receipts** -- IRS-compliant donation receipts are mandatory
- **LYBUNT/SYBUNT reports** (Last/Some Year But Unfortunately Not This) for lapsed donor recovery
- **Grant reporting** deadlines are as critical as tax deadlines
- **Donor segmentation** by giving level determines cultivation strategy
- **Peer-to-peer fundraising** -- supporters creating their own fundraising pages
- **In-kind donation tracking** with fair market value

### What They Currently Cobble Together (and Cost)
- Bloomerang: $125-175/mo
- Little Green Light: $45-135/mo
- Kindful: $119/mo
- Mailchimp for email: $13-350/mo
- GoFundMe/Classy for campaigns: % fee
- SignUpGenius for volunteers: $0-99/mo
- QuickBooks for finances: $30-200/mo
- **Total monthly SaaS spend: $200-600/mo**

---