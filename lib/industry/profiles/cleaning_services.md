## 5. CLEANING SERVICES (Residential, Commercial)

### Core Workflows
- Inquiry via web form or phone (address, sqft, number of rooms/bathrooms)
- Auto-quote or in-home estimate
- Schedule cleaning team and time slot
- Team dispatched, cleans, takes completion photos
- Customer charged (recurring or one-time)
- Follow-up satisfaction survey, review request

### Must-Have Features
- **Instant quoting engine** (sqft + rooms + add-ons = price)
- **Recurring scheduling** (weekly, bi-weekly, monthly with same team)
- **Team dispatch** (assign 2-3 cleaners per job, route optimization)
- **Checklist system** (per-room cleaning tasks, completion tracking)
- **Time tracking** (clock in/out per job, calculate pay-per-clean)
- **Quality inspection photos** (completion proof)
- **Automated billing** (charge after each clean, or monthly)
- **Customer portal** (reschedule, add services, pay)

### Database Schema
```
customers (id, name, email, phone, address_id, home_sqft, bedrooms, bathrooms, pets, access_instructions, alarm_code_encrypted)
addresses (id, customer_id, street, city, state, zip, parking_notes)
service_plans (id, customer_id, service_type[STANDARD|DEEP|MOVE_IN_OUT], frequency[WEEKLY|BIWEEKLY|MONTHLY|ONE_TIME], price, add_ons[], team_preference_id)
cleanings (id, service_plan_id, team_id, status[SCHEDULED|IN_PROGRESS|COMPLETE|CANCELLED], scheduled_date, actual_start, actual_end, checklist_completion_json, photos[])
teams (id, name, members[])
cleaners (id, name, phone, hourly_rate, pay_per_clean, status[ACTIVE|INACTIVE])
checklists (id, service_type, rooms_json[{room, tasks[]}])
cleaning_tasks (id, cleaning_id, room, task, completed, completed_by)
invoices (id, customer_id, cleaning_ids[], amount, status, auto_charge)
quality_reports (id, cleaning_id, photos[], customer_rating, issues_noted)
```

### API Routes
```
POST   /api/quotes                     — instant quote from property details
POST   /api/service-plans              — set up recurring service
GET    /api/schedule?date=&team=       — dispatch board
PATCH  /api/cleanings/:id/status       — clock in/out, mark complete
POST   /api/cleanings/:id/checklist    — complete checklist items
POST   /api/cleanings/:id/photos       — upload completion photos
GET    /api/customers/:id/portal       — customer self-service
POST   /api/quality/:id/rate           — customer satisfaction rating
GET    /api/reports/payroll             — per-cleaner earnings
GET    /api/reports/revenue             — revenue by service type
```

### Payment Patterns
Recurring auto-charge after each clean (most common). One-time for deep cleans and move-in/move-out. Per-clean pricing (not hourly to client). Add-on charges (inside oven, inside fridge, laundry). First-clean discount. Annual contracts for commercial.

### Client Interaction Model
Find via Google, Thumbtack, Nextdoor, referral. Book online with instant quote. Very little ongoing communication needed if service is consistent. Automated billing = low friction. Trust = keeping the same team each visit.

### Industry-Specific Nuances
- **Same-team preference** is the #1 retention factor
- **Pay-per-clean** math (not hourly) -- cleaners earn per job, price includes travel
- **Access management** -- lockbox codes, alarm codes, key handling
- **Add-on pricing** must be simple (laundry +$25, inside fridge +$15)
- **Quality control** via photo verification

### What They Currently Cobble Together (and Cost)
- ZenMaid: $19-49/mo + per-seat
- Launch27: $59-299/mo
- Jobber: $39-169/mo
- Google Sheets for scheduling
- Venmo/Zelle for payments
- **Total monthly SaaS spend: $60-350/mo**

---