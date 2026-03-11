## 28. PROPERTY MANAGER/LANDLORD

### Core Workflows
- Property acquisition/onboarding
- Tenant screening (credit, background, income verification)
- Lease creation and signing
- Rent collection (monthly automated)
- Maintenance request handling
- Property inspections
- Tenant communication
- Financial reporting (per property, portfolio-wide)
- Lease renewal or turnover management
- Vendor/contractor coordination for maintenance

### Must-Have Features
- **Property portfolio management** (units, leases, vacancy tracking)
- **Online rent collection** (ACH, credit card, auto-pay)
- **Tenant screening** (credit, criminal, eviction, income verification)
- **Lease management** with e-signature and document storage
- **Maintenance request portal** (tenant submits, manager assigns to vendor)
- **Accounting** (income, expenses, per-property P&L)
- **Tenant portal** (pay rent, submit requests, view lease)
- **Owner portal** (for property managers managing for others)
- **Vacancy marketing** (listing syndication to Zillow, Apartments.com)
- **Inspection reports** (photos, condition documentation)
- **1099 generation** for vendors

### Database Schema
```
properties (id, address, type[SINGLE_FAMILY|MULTI_FAMILY|CONDO|COMMERCIAL], owner_id, units_count, purchase_price, market_value)
units (id, property_id, unit_number, bedrooms, bathrooms, sqft, rent_amount, status[OCCUPIED|VACANT|MAINTENANCE|LISTED], current_lease_id)
owners (id, name, email, phone, properties[], payment_method, management_fee_percent)
tenants (id, name, email, phone, unit_id, lease_id, status[APPLICANT|ACTIVE|NOTICE|PAST], screening_report_id)
leases (id, unit_id, tenant_ids[], start_date, end_date, rent_amount, security_deposit, terms, status[DRAFT|ACTIVE|MONTH_TO_MONTH|EXPIRED|TERMINATED], document_url, signed_at)
rent_payments (id, lease_id, tenant_id, amount, due_date, paid_date, status[PENDING|PAID|LATE|PARTIAL|NSF], payment_method, late_fee_applied, stripe_payment_id)
maintenance_requests (id, unit_id, tenant_id, category[PLUMBING|ELECTRICAL|HVAC|APPLIANCE|STRUCTURAL|PEST|OTHER], description, photos[], priority[EMERGENCY|HIGH|NORMAL|LOW], status[SUBMITTED|ASSIGNED|IN_PROGRESS|COMPLETE], assigned_vendor_id, completed_at)
vendors (id, name, trade[PLUMBER|ELECTRICIAN|HVAC|GENERAL|CLEANER|LANDSCAPER], phone, email, hourly_rate, rating)
transactions (id, property_id, unit_id, type[RENT_INCOME|MAINTENANCE|INSURANCE|MORTGAGE|TAX|MANAGEMENT_FEE|UTILITY], amount, date, category, vendor_id, description)
screening_reports (id, tenant_id, credit_score, criminal_flag, eviction_history, income_verified, recommendation[APPROVE|CONDITIONAL|DENY])
inspections (id, unit_id, type[MOVE_IN|MOVE_OUT|ROUTINE], date, items_json[{area, condition, photo_url, notes}], completed_by)
listings (id, unit_id, rent_price, description, photos[], amenities[], available_date, syndicated_to[], status)
```

### API Routes
```
POST   /api/properties                       — add property
POST   /api/units                            — add unit
POST   /api/tenants/apply                    — tenant application
POST   /api/screening/:id                    — run tenant screening
POST   /api/leases                           — create lease
POST   /api/leases/:id/sign                  — e-sign lease
GET    /api/rent/due                         — rent roll (who owes what)
POST   /api/rent/collect                     — process rent payment
POST   /api/maintenance                      — submitmaintenance request
PATCH  /api/maintenance/:id/assign          — assign to vendor
GET    /api/properties/:id/financials       — property P&L
GET    /api/portfolio/overview              — portfolio dashboard
POST   /api/inspections                     — create inspection report
POST   /api/listings                        — list vacant unit
GET    /api/owners/:id/report               — owner statement
GET    /api/reports/rent-roll               — rent roll report
GET    /api/reports/1099                     — vendor 1099 generation
```

### Payment Patterns
Monthly rent (ACH auto-pay preferred). Security deposit (1-2 months rent). Late fees (flat or percentage). Application fees ($25-75). Pet deposits/pet rent. Lease break fees. Management fees (8-12% of collected rent for third-party managers). Owner distributions monthly.

### Client Interaction Model
Two client types: **tenants** (find via Zillow/Apartments.com, apply, lease, pay, submit requests) and **property owners** (hire manager, expect monthly reports and distributions). Tenant relationship is transactional. Owner relationship is fiduciary. Lease renewals are the retention mechanism.

### Industry-Specific Nuances
- **Two-portal model** -- tenant portal AND owner portal
- **Trust accounting** -- tenant deposits held in escrow, state-regulated
- **Late fee automation** -- must comply with state/local rent laws
- **Vacancy cost tracking** -- every vacant day is lost revenue
- **Maintenance triage** -- emergency (burst pipe) vs. routine (leaky faucet) determines response time
- **Move-in/move-out inspections** with photo documentation protect security deposit disputes
- **1099 generation** for vendors at year-end

### What They Currently Cobble Together (and Cost)
- Buildium: $62-400/mo
- Rentec Direct: $35-45/mo (small portfolios)
- AppFolio: $298+/mo (50+ units only)
- Zillow for listings: free-$30/listing
- QuickBooks for accounting: $30-200/mo
- Google Sheets for rent tracking
- **Total monthly SaaS spend: $100-700/mo depending on portfolio size**

---

## VALUE PROPOSITION SUMMARY

Here is the competitive displacement opportunity per vertical, showing what businesses currently pay versus what ShipKit Presence could offer as custom-owned software:

| Business Type | Current Monthly SaaS Spend | # Tools Cobbled | Displacement Value |
|---|---|---|---|
| Home Services | $150-800 | 4-6 | High |
| Personal Care | $50-300 | 3-5 | High |
| Pet Services | $85-200 | 3-5 | Medium |
| Fitness/Wellness | $100-500 | 3-5 | High |
| Cleaning Services | $60-350 | 3-5 | High |
| Auto Services | $250-800 | 4-6 | Very High |
| Consultant/Coach | $80-500 | 5-7 | Very High |
| Therapist/Counselor | $100-300/clinician | 3-4 | High (HIPAA barrier) |
| Accountant/Bookkeeper | $200-2,000 | 4-6 | Very High |
| Lawyer/Legal | $100-400/attorney | 3-5 | Very High (compliance) |
| Real Estate Agent | $400-2,000 | 5-7 | Very High |
| Financial Advisor | $400-1,000 | 4-6 | Very High (compliance) |
| Photographer/Videographer | $60-200 | 3-5 | Medium |
| Graphic Designer | $40-200 | 3-5 | Medium |
| Web Agency/Freelancer | $100-2,000 | 5-8 | High |
| Interior Designer | $150-500 | 4-6 | High |
| Wedding Planner | $80-300 | 3-5 | Medium |
| Music Teacher/Tutor | $15-50 | 3-5 | Low (low spend) |
| Course Creator | $100-700 | 3-5 | Very High |
| Membership Community | $100-500 | 3-4 | High |
| Newsletter Creator | $30-400 | 2-4 | Medium |
| Podcast Producer | $80-200 | 4-6 | Medium |
| Early-Stage SaaS | $30-500 | 4-7 | High |
| Agency SaaS | $100-500 | 1-2 | High (white-label) |
| Restaurant | $300-1,000 | 3-5 | Very High |
| Nonprofit | $200-600 | 4-6 | High |
| Church | $100-400 | 3-5 | High |
| Property Manager | $100-700 | 3-5 | Very High |

### Top-Tier Targets (Highest Displacement Value + Willingness to Pay)

1. **Home Services** -- high spend, fragmented tools, tech-unsavvy owners desperate for simplicity
2. **Consultant/Coach** -- cobbles 5-7 tools, premium pricing tolerance, brand-conscious
3. **Real Estate Agent** -- massive SaaS spend, commission-funded, always seeking edge
4. **Auto Services** -- high spend, still using paper, huge digitization gap
5. **Restaurant** -- $300-1,000/mo in POS + tools, locked into ecosystems they hate
6. **Accountant/Bookkeeper** -- per-user pricing kills them at scale, complex workflows
7. **Property Manager** -- clear ROI per unit, scales with portfolio
8. **Course Creator** -- overpaying Kajabi/Teachable, wants ownership and lower fees
9. **Fitness/Wellness** -- Mindbody is universally hated, overpriced, and lock-in heavy
10. **Cleaning Services** -- simple workflows, high volume, perfect for templated generation

### Lowest-Value Targets (Consider Deprioritizing)

- **Music Teacher/Tutor** -- spends $15-50/mo, hard to justify $497 build
- **Newsletter Creator** -- very tool-specific, deliverability is everything
- **Podcast Producer** -- hosting + distribution is the core need, hard to replicate

---

Sources:
- [HouseCall Pro vs Jobber vs ServiceTitan: Tested & Compared 2026](https://contractorplus.app/blog/housecall-pro-vs-jobber-vs-servicetitan)
- [Housecall Pro Pricing](https://www.housecallpro.com/pricing/)
- [ServiceTitan Review 2026](https://fieldcamp.ai/reviews/servicetitan/)
- [Best Salon Software 2026](https://thesalonbusiness.com/best-salon-software/)
- [Salon Booking App Cost Guide](https://webflow.glossgenius.com/blog/true-cost-most-salon-booking-apps)
- [Fresha Pricing](https://www.fresha.com/pricing)
- [PetExec Pricing 2026](https://www.capterra.com/p/92864/PetExec/)
- [Time To Pet 2026](https://www.capterra.com/p/144329/Time-To-Pet/)
- [Mindbody Fees](https://gymdesk.com/blog/mindbody-fees)
- [Trainerize Pricing](https://www.trainerize.com/pricing/)
- [Gymdesk vs Mindbody](https://gymdesk.com/blog/is-mindbody-worth-it)
- [ZenMaid Pricing 2026](https://www.g2.com/products/zenmaid-software/pricing)
- [Best Cleaning Business Software 2026](https://www.zenmaid.com/magazine/the-best-cleaning-business-software-in-2026/)
- [Shop-Ware Pricing](https://shop-ware.com/packages/)
- [Best Coaching Software 2026](https://www.capterra.com/coaching-software/)
- [SimplePractice vs TherapyNotes](https://www.choosingtherapy.com/therapynotes-vs-simplepractice/)
- [TherapyNotes vs SimplePractice](https://www.mentalyc.com/blog/simplepractice-vs-therapynotes)
- [Accounting Practice Management Software Cost](https://financial-cents.com/resources/articles/cost-of-accounting-practice-management-software/)
- [TaxDome Pricing](https://taxdome.com/pricing)
- [Karbon Pricing](https://karbonhq.com/pricing/)
- [Clio Pricing 2026](https://www.accountingatelier.com/blog/clio-pricing)
- [PracticePanther vs MyCase](https://www.practicepanther.com/comparison/mycase/)
- [Follow Up Boss Review 2026](https://www.realestateskills.com/blog/follow-up-boss-review)
- [kvCORE/BoldTrail Pricing](https://www.realtyjuggler.com/kvCORE)
- [Wealthbox CRM Review 2026](https://smartasset.com/advisor-resources/wealthbox-crm)
- [Redtail CRM Review 2026](https://smartasset.com/advisor-resources/redtail-crm)
- [RightCapital 2026](https://www.getapp.com/finance-accounting-software/a/rightcapital/)
- [Best CRMs for Photographers 2026](https://blog.bloom.io/best-crm-photographers/)
- [Plutio vs Bonsai 2026](https://www.plutio.com/compare/plutio-vs-bonsai)
- [Interior Design Software Comparison](https://www.studiodesigner.com/blog/the-best-interior-design-software/)
- [Houzz Pro Pricing 2026](https://www.g2.com/products/houzz-pro/pricing)
- [Aisle Planner vs HoneyBook 2026](https://www.eventcertificate.com/aisle-planner-vs-honeybook/)
- [Kajabi Pricing 2026](https://www.courseplatformsreview.com/blog/kajabi-pricing/)
- [Teachable vs Thinkific vs Kajabi 2026](https://www.courseplatformsreview.com/blog/teachable-vs-thinkific-vs-kajabi/)
- [Circle Pricing 2026](https://www.schoolmaker.com/blog/circle-so-pricing)
- [Skool Pricing 2026](https://www.courseplatformsreview.com/blog/skool-pricing/)
- [Mighty Networks Pricing 2026](https://www.courseplatformsreview.com/blog/mighty-networks-pricing/)
- [Substack Pricing 2026](https://www.schoolmaker.com/blog/substack-pricing)
- [Beehiiv vs Kit vs Mailchimp 2026](https://almcorp.com/blog/beehiiv-vs-kit-vs-mailchimp-comparison/)
- [Toast POS Pricing 2026](https://www.posusa.com/toast-pos-pricing/)
- [Square vs Toast vs Lightspeed](https://www.expertmarket.com/pos/square-vs-toast-vs-lightspeed)
- [Bloomerang Donor Management 2026](https://bloomerang.com/blog/donor-management-software/)
- [Little Green Light Review 2026](https://www.smartthoughts.net/post/the-little-green-light-crm-donor-management-software-review)
- [Planning Center vs Tithely 2026](https://www.churchmemberpro.com/blog/tithely-vs-planning-center/)
- [Buildium vs AppFolio 2026](https://www.buildium.com/blog/buildium-vs-appfolio/)
- [Rentec Direct Pricing](https://www.rentecdirect.com/blog/best-property-management-software-2026/)
- [GoHighLevel Pricing 2026](https://ghl-services-playbooks-automation-crm-marketing.ghost.io/gohighlevel-pricing-plans-2026/)
- [Buzzsprout Pricing 2026](https://podcastpontifications.com/helpful-info/buzzsprout-pricing/)
- [Transistor Podcast Hosting](https://transistor.fm/)
- [Carrd Pricing 2026](https://landingi.com/carrd/pricing/)
- [Best MVP Development Tools 2026](https://www.buildmvpfast.com/blog/best-mvp-development-tools-2026)
- [My Music Staff](https://www.mymusicstaff.com/)