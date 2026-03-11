## 16. INTERIOR DESIGNER

### Core Workflows
- Client inquiry, in-home consultation
- Design agreement signed, retainer collected
- Space planning, mood boards, material selection
- Product sourcing (trade pricing), procurement
- Client presentation and approval
- Ordering, receiving, installation coordination
- Final reveal, photography
- Billing: design fees + product markup

### Must-Have Features
- **Project management** with rooms/spaces as units
- **Mood board / design board** creation
- **Product sourcing** with trade pricing and retail markup tracking
- **Procurement management** (orders, shipping, receiving, installation)
- **Time tracking** (hourly billing common)
- **Invoicing** with separate design fee and product billing
- **Client portal** with design boards, selections, approvals
- **Vendor/trade account management**
- **Purchase order generation**

### Database Schema
```
clients (id, name, email, phone, address, project_budget, status)
projects (id, client_id, name, type[FULL_SERVICE|E_DESIGN|CONSULTATION], status[CONSULTATION|DESIGN|PROCUREMENT|INSTALLATION|COMPLETE], design_fee_type[HOURLY|FLAT|PERCENTAGE], design_fee_amount, budget)
rooms (id, project_id, name, dimensions, photos[], mood_board_url, status)
product_selections (id, room_id, product_id, quantity, status[PROPOSED|APPROVED|ORDERED|RECEIVED|INSTALLED])
products (id, name, vendor_id, trade_price, retail_price, markup_percent, category[FURNITURE|LIGHTING|FABRIC|HARDWARE|ART|ACCESSORY], lead_time_weeks, sku)
vendors (id, name, contact, trade_account_number, discount_tier, payment_terms)
purchase_orders (id, vendor_id, project_id, line_items[], total_trade, total_retail, status[DRAFT|SENT|CONFIRMED|SHIPPED|RECEIVED], tracking_number)
proposals (id, project_id, room_id, design_board_images[], product_selections[], total_trade, total_retail, client_price, status[PRESENTED|APPROVED|REVISED])
invoices (id, project_id, type[DESIGN_FEE|PRODUCT|RETAINER], line_items[], total, status, paid_at)
time_entries (id, project_id, hours, description, date, billable)
installations (id, project_id, date, items[], contractor, status, notes)
```

### API Routes
```
POST   /api/projects                         — create project
POST   /api/rooms                            — add room to project
POST   /api/rooms/:id/selections             — add product selections
POST   /api/proposals                        — create design proposal
POST   /api/proposals/:id/approve            — client approves
POST   /api/purchase-orders                  — generate PO to vendor
PATCH  /api/purchase-orders/:id/status       — update order status
GET    /api/projects/:id/budget              — budget tracking view
POST   /api/time                             — log time
GET    /api/products/search                  — search product catalog
GET    /api/reports/profitability             — project profitability with markups
```

### Payment Patterns
Design fee: hourly ($150-500/hr) or flat/percentage of project. Product markup (30-50% over trade price is the primary revenue). Retainer collected upfront. Product payments due before ordering. Installation coordination fee.

### Client Interaction Model
Find via Instagram, Houzz, referral. In-home consultation starts the relationship. Long projects (3-18 months). Design presentations are key milestones. Client approvals gate procurement. Final reveal/photography closes the loop.

### Industry-Specific Nuances
- **Trade pricing vs. retail pricing** -- the markup is the business model
- **Procurement tracking** -- orders from 20+ vendors per project, each with lead times
- **Room-centric organization** -- not task-centric
- **Lead time management** -- furniture can take 8-16 weeks
- **Receiving/damage claims** -- tracking damaged goods, replacements

### What They Currently Cobble Together (and Cost)
- Houzz Pro: $149-199/mo + $60/additional user
- Studio Designer: $72-109/mo/user
- DesignFiles: $49-69/mo
- QuickBooks for billing: $30-200/mo
- Pinterest for mood boards
- Excel for procurement tracking
- **Total monthly SaaS spend: $150-500/mo**

---