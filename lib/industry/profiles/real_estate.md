## 11. REAL ESTATE AGENT/BROKER

### Core Workflows
- Lead generation (open houses, Zillow, social media, referrals)
- Lead nurture (drip emails, market updates, follow-up calls)
- Listing: photographer scheduled, listing created, syndicated to MLS
- Buyer: showings scheduled, offers drafted, negotiation
- Under contract: inspection, appraisal, title, mortgage milestones
- Closing coordination
- Post-close: anniversary drip, referral requests

### Must-Have Features
- **CRM with pipeline stages** (lead -> nurture -> active -> under contract -> closed)
- **Automated drip campaigns** (long nurture cycles, 6-18 months common)
- **Transaction management** (milestones, deadlines, documents per deal)
- **IDX integration** (property search on agent website)
- **Listing management** (photos, descriptions, MLS sync)
- **E-signature** for offers, contracts
- **Commission tracking** (splits, referral fees, broker share)
- **Open house lead capture**
- **Market reports** (CMA generation)

### Database Schema
```
contacts (id, name, email, phone, type[BUYER|SELLER|BOTH|INVESTOR|REFERRAL], source[ZILLOW|OPEN_HOUSE|REFERRAL|WEBSITE|SOCIAL], status[NEW|NURTURING|ACTIVE|CLOSED|INACTIVE], assigned_agent_id, last_contact, tags[])
properties (id, address, mls_number, type[SINGLE_FAMILY|CONDO|TOWNHOUSE|MULTI_FAMILY], bedrooms, bathrooms, sqft, price, status[COMING_SOON|ACTIVE|PENDING|SOLD|WITHDRAWN], listing_agent_id, photos[], description)
transactions (id, property_id, buyer_contact_id, seller_contact_id, type[BUY|SELL|DUAL], status[ACTIVE|UNDER_CONTRACT|CLOSED|FELL_THROUGH], contract_price, close_date, commission_rate, commission_amount, agent_split, broker_split)
transaction_milestones (id, transaction_id, milestone[OFFER_ACCEPTED|INSPECTION|APPRAISAL|TITLE|MORTGAGE_APPROVAL|FINAL_WALKTHROUGH|CLOSING], due_date, completed_date, status, notes)
drip_campaigns (id, name, trigger_event, emails_json[{delay_days, subject, body}], active)
contact_drips (id, contact_id, campaign_id, current_step, started_at, status)
showings (id, property_id, contact_id, datetime, feedback, agent_id)
open_houses (id, property_id, date, time_start, time_end, leads_captured[])
commission_ledger (id, transaction_id, gross_commission, broker_split, agent_net, referral_fee, date_paid)
```

### API Routes
```
POST   /api/contacts                         — add lead
GET    /api/contacts/pipeline                — pipeline view
POST   /api/contacts/:id/drip/start          — start drip campaign
POST   /api/properties/listing               — create listing
GET    /api/properties/search                — IDX search
POST   /api/transactions                     — start transaction
PATCH  /api/transactions/:id/milestone       — update milestone
POST   /api/showings                         — schedule showing
POST   /api/open-houses/:id/capture          — capture lead
GET    /api/reports/commission               — commission report
GET    /api/reports/pipeline-value           — pipeline value forecast
```

### Payment Patterns
Commission-based (2.5-3% of sale price). Split with broker (50-90% to agent). Referral fees (25% of commission to referrer). Team splits. Paid at closing (not recurring). Monthly desk fees or broker subscription.

### Client Interaction Model
Long sales cycles (3-18 months). Lead nurture is everything. Communication via text, call, email. Open houses for lead generation. Past clients = referral source (annual check-in). Social media/video for brand building.

### Industry-Specific Nuances
- **Commission math is complex** -- gross commission, broker split, team split, referral fees, franchise fees
- **MLS integration** -- syndication is essential
- **Transaction coordination** -- 20+ milestones with hard deadlines per deal
- **Drip campaigns** must run for months/years (not days)
- **Sphere of influence** management -- past clients, friends, family are the pipeline

### What They Currently Cobble Together (and Cost)
- Follow Up Boss: $69-499/mo
- kvCORE/BoldTrail: $299-500/mo
- Wise Agent: $49/mo
- DocuSign: $25-40/mo
- Canva for marketing: $13/mo
- Zillow Premier Agent: $200-1,000+/mo for leads
- **Total monthly SaaS spend: $400-2,000/mo**

---