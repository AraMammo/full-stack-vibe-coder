## 6. AUTO SERVICES (Mechanic, Detailer, Body Shop)

### Core Workflows
- Vehicle drop-off (or mobile service for detailing)
- Intake: VIN lookup, mileage, customer complaint
- Diagnostic inspection, findings documented
- Estimate prepared with parts + labor, sent for approval
- Work performed, parts ordered if needed
- Quality check, customer notification, pick-up
- Invoice + payment, maintenance reminder scheduled

### Must-Have Features
- **VIN decoder** (auto-populate year/make/model/engine)
- **Digital vehicle inspection** (checklist with red/yellow/green + photos)
- **Estimate builder** with parts catalog integration
- **Customer approval workflow** (text/email approve button)
- **Work order management** (bay assignment, tech assignment, status tracking)
- **Parts ordering** and inventory
- **Maintenance schedule reminders** (oil change due, tire rotation due)
- **Vehicle history** per VIN (every service ever performed)

### Database Schema
```
customers (id, name, email, phone, address, fleet_flag)
vehicles (id, customer_id, vin, year, make, model, engine, color, mileage_last_visit, license_plate)
work_orders (id, vehicle_id, customer_id, tech_id, bay_id, status[INTAKE|DIAGNOSING|ESTIMATE_SENT|APPROVED|IN_PROGRESS|PARTS_ORDERED|COMPLETE|PICKED_UP], customer_complaint, created_at)
inspections (id, work_order_id, items_json[{system, item, status[GOOD|NEEDS_ATTENTION|URGENT], photo_url, notes}])
estimates (id, work_order_id, line_items_json[{description, part_number, part_cost, labor_hours, labor_rate, total}], parts_total, labor_total, tax, grand_total, status[SENT|APPROVED|DECLINED], approved_items[])
invoices (id, work_order_id, estimate_id, amount, tax, total, status, paid_at)
parts (id, part_number, description, cost, markup, supplier, qty_in_stock)
bays (id, name, status[AVAILABLE|OCCUPIED])
maintenance_reminders (id, vehicle_id, service_type, due_date_or_mileage, sent_at)
```

### API Routes
```
POST   /api/vehicles                        — add vehicle (VIN decode)
POST   /api/work-orders                     — create work order
POST   /api/work-orders/:id/inspection      — digital inspection
POST   /api/work-orders/:id/estimate        — create estimate
POST   /api/estimates/:id/approve           — customer approval (public link)
PATCH  /api/work-orders/:id/status          — update status
GET    /api/vehicles/:vin/history           — full service history
POST   /api/maintenance/reminders           — schedule reminder
GET    /api/bays                            — bay availability
GET    /api/reports/tech-productivity       — hours billed per tech
```

### Payment Patterns
Pay on completion. Large repairs may require deposit. Fleet accounts = net-30 invoicing. Detailing packages (monthly membership for unlimited washes). Financing for major repairs ($1000+ through third-party).

### Client Interaction Model
Find via Google, referral, drive-by. Drop off vehicle, get updates via text. Pick up and pay. Maintenance reminders bring them back. Trust is built through transparent inspections (photos of issues). Fleet managers need accounts receivable.

### Industry-Specific Nuances
- **VIN-centric everything** -- history follows the vehicle, not the person
- **Digital inspection with photos** is the trust-builder and upsell mechanism
- **Parts markup** is a significant revenue stream (typically 40-60% markup)
- **Bay management** = physical resource constraint
- **Declined service tracking** -- customer said no to brakes today, follow up in 30 days

### What They Currently Cobble Together (and Cost)
- Shop-Ware: $117-427/mo
- Mitchell RepairCenter: custom pricing ($200+/mo)
- RepairPal for estimates
- AllData/Mitchell for repair data: $100-300/mo
- QuickBooks: $30-200/mo
- Pen and paper (still common for small shops)
- **Total monthly SaaS spend: $250-800/mo**

---