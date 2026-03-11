## 17. WEDDING PLANNER/EVENT COORDINATOR

### Core Workflows
- Client inquiry, initial consultation
- Proposal with planning package options
- Contract signed, retainer/deposit collected
- Vendor sourcing, recommendation, and booking coordination
- Timeline creation (master timeline for the day)
- Budget tracking (client's overall budget across all vendors)
- Guest list management
- Day-of coordination execution
- Post-event: vendor payments, final billing

### Must-Have Features
- **Client portal** with budget, timeline, vendor list, checklist
- **Budget tracker** (total event budget across all vendors)
- **Vendor database** with categories, pricing, availability, notes
- **Master timeline builder** (minute-by-minute day-of schedule)
- **Guest list management** with RSVPs, meal choices, seating
- **Checklist/task system** with countdown to event
- **Floor plan / seating chart**
- **Multi-event calendar** (managing 10-30 events simultaneously)
- **Vendor payment tracking** (not planner's payments -- client's payments to vendors)

### Database Schema
```
clients (id, name, partner_name, email, phone, event_date, venue, guest_count_estimate, total_budget, package_id, status[INQUIRY|BOOKED|PLANNING|DAY_OF|COMPLETE])
events (id, client_id, name, date, venue_id, timeline_json[{time, activity, vendor_id, location, notes}], status)
vendors (id, name, category[VENUE|CATERING|FLORIST|PHOTOGRAPHER|DJ|BAND|OFFICIANT|CAKE|RENTALS|LIGHTING|TRANSPORTATION|HAIR_MAKEUP], contact_email, phone, price_range, rating, notes, portfolio_url)
event_vendors (id, event_id, vendor_id, service_description, contracted_price, deposit_amount, deposit_paid, balance_due_date, balance_paid, contract_url)
budget_items (id, event_id, category, vendor_id, estimated_cost, actual_cost, paid_amount, notes)
guest_list (id, event_id, name, email, party_size, rsvp_status[INVITED|ACCEPTED|DECLINED|PENDING], meal_choice, table_assignment, dietary_restrictions, address)
tasks (id, event_id, title, category, due_date, assigned_to, status[TODO|IN_PROGRESS|DONE], countdown_days)
seating_charts (id, event_id, tables_json[{table_name, capacity, guests[]}])
proposals (id, client_id, packages_offered[], custom_elements[], total_price, status)
invoices (id, client_id, amount, type[RETAINER|PLANNING_FEE|DAY_OF_FEE], status, paid_at)
```

### API Routes
```
POST   /api/events                           — create event
GET    /api/events/:id/dashboard             — client planning dashboard
POST   /api/events/:id/budget                — add/update budget items
GET    /api/events/:id/budget/summary        — budget vs. actual
POST   /api/events/:id/timeline              — build/update timeline
POST   /api/events/:id/guests                — manage guest list
POST   /api/events/:id/guests/import         — import guest list CSV
GET    /api/events/:id/guests/rsvp-status    — RSVP summary
POST   /api/events/:id/seating               — create seating chart
POST   /api/vendors                          — add to vendor database
GET    /api/vendors?category=&available=     — search vendors
POST   /api/events/:id/vendors               — assign vendor to event
GET    /api/tasks?event=&due_before=         — task list by event
```

### Payment Patterns
Flat fee planning packages ($2,000-15,000). Retainer (30-50% upfront). Monthly payment plans. Day-of coordination (lower price point $1,000-3,000). Percentage of total budget (10-15%) for luxury planners. Vendor referral commissions (some planners).

### Client Interaction Model
Find via Instagram, The Knot, WeddingWire, referral. Planning relationship lasts 6-18 months. Regular check-in meetings. Client portal for shared planning visibility. Day-of is the culmination. Post-event referrals and reviews.

### Industry-Specific Nuances
- **Budget tracking is the client's budget** -- not the planner's revenue
- **Vendor relationship management** is a competitive advantage
- **Guest list management** with RSVP tracking, dietary needs, seating
- **Minute-by-minute timelines** for event day (not just daily schedules)
- **Multi-event management** -- simultaneously managing 10-30 events at different stages
- **Seasonal booking** patterns (engagement season drives inquiry spikes)

### What They Currently Cobble Together (and Cost)
- Aisle Planner: $40-80/mo
- HoneyBook: $32.50-109/mo
- Planning Pod: $49-129/mo
- Google Sheets for budgets
- Pinterest for mood boards
- Canva for presentations
- **Total monthly SaaS spend: $80-300/mo**

---