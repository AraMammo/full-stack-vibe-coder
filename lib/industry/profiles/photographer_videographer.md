## 13. PHOTOGRAPHER/VIDEOGRAPHER

### Core Workflows
- Inquiry received (wedding, portrait, commercial, event)
- Discovery call, send proposal/quote with package options
- Contract signed, retainer/deposit collected
- Pre-shoot questionnaire, shot list planning
- Shoot day execution
- Culling, editing, delivery via online gallery
- Print/product orders
- Final payment collected

### Must-Have Features
- **Inquiry management** with auto-response
- **Proposal/package builder** (customizable packages, a la carte add-ons)
- **Contract + e-signature** with terms, usage rights
- **Online gallery delivery** with download + print ordering
- **Invoice with payment schedule** (deposit on booking, balance before delivery)
- **Questionnaires** (wedding timeline, family groupings, brand mood)
- **Calendar** (block shoot days, mark as booked/tentative)
- **Portfolio website** integration
- **Workflow automation** (after booking: send questionnaire on day X, reminder on day Y)

### Database Schema
```
clients (id, name, email, phone, type[WEDDING|PORTRAIT|COMMERCIAL|EVENT], source, status[INQUIRY|BOOKED|SHOT|EDITING|DELIVERED|COMPLETE])
projects (id, client_id, type, date, location, package_id, custom_price, status, shot_list_json, notes)
packages (id, name, description, price, includes[{item, quantity}], add_ons[{name, price}])
contracts (id, project_id, template_id, custom_terms, usage_rights, signed_at, document_url)
invoices (id, project_id, line_items[], total, payments_schedule[{amount, due_date, status}], balance)
payments (id, invoice_id, amount, type[DEPOSIT|MILESTONE|FINAL], method, paid_at)
galleries (id, project_id, title, images[], password, download_enabled, expiry_date, views)
gallery_images (id, gallery_id, url, thumbnail_url, filename, favorited_by_client)
questionnaires (id, project_id, type[PRE_SHOOT|WEDDING_TIMELINE|BRAND_BRIEF], responses_json, sent_at, completed_at)
workflows (id, trigger[BOOKING|PRE_SHOOT|POST_SHOOT|DELIVERY], actions_json[{delay_days, action, template_id}])
print_orders (id, gallery_id, client_id, items[], total, status, fulfillment_partner)
```

### API Routes
```
POST   /api/inquiries                        — submit inquiry
POST   /api/proposals                        — send proposal with packages
POST   /api/contracts/:id/sign               — sign contract
POST   /api/invoices/:id/pay                 — process payment
POST   /api/galleries                        — create gallery
GET    /api/galleries/:id                    — client gallery view (password-protected)
POST   /api/galleries/:id/favorites          — client favorites selection
POST   /api/questionnaires/:id/respond       — fill questionnaire
GET    /api/calendar/availability             — check date availability
POST   /api/print-orders                     — place print order
GET    /api/reports/booking-rate              — inquiry-to-booking conversion
```

### Payment Patterns
Package pricing ($500-10,000+). Deposit on booking (25-50%). Balance due before or after delivery. Payment plans for weddings. Print/product orders as additional revenue. Rush fee for fast delivery.

### Client Interaction Model
Find via Instagram, Google, referral, wedding directories (The Knot, WeddingWire). Portfolio is the sales tool. Inquiries spike seasonally. Booking to delivery timeline: weeks to months. Galleries are the final touchpoint. Past clients refer.

### Industry-Specific Nuances
- **Usage rights** in contracts (personal use vs. commercial, exclusivity)
- **Gallery delivery** with client favorites selection, download, and print ordering
- **Date exclusivity** -- can only shoot one wedding per date
- **Seasonal booking** patterns (engagement season, wedding season)
- **Second shooter coordination** for events

### What They Currently Cobble Together (and Cost)
- HoneyBook: $36-109/mo
- Dubsado: $20-40/mo
- Pixieset/Pic-Time for galleries: $0-40/mo
- ShootProof for galleries + sales: $10-45/mo
- Canva for marketing: $13/mo
- Instagram for portfolio
- **Total monthly SaaS spend: $60-200/mo across 3-5 tools**

---