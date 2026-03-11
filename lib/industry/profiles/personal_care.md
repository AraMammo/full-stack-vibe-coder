## 2. PERSONAL CARE (Salon, Barber, Spa, Nail Tech)

### Core Workflows
- Client books appointment (online or walk-in)
- Check-in, assign to stylist/station
- Service performed (tracked by duration, product used)
- Upsell retail products at checkout
- Collect payment + tip
- Rebook next appointment before client leaves
- Send appointment reminders, birthday promos

### Must-Have Features
- **Online booking** with service menu, duration, and provider selection
- **Chair/station calendar** (multi-provider, color-coded)
- **Client profiles** with service history, preferences, formulas (color formulas for hair, skin notes for spa)
- **POS + tip handling** (split tips, tip percentages)
- **Retail inventory** (product sales tracking)
- **Automated reminders** (24hr SMS, rebooking prompts)
- **Waitlist management** for cancellations
- **Commission/booth rent tracking** per stylist
- **Loyalty program** (visit count rewards)

### Database Schema
```
clients (id, name, email, phone, birthday, preferences_notes, formula_notes, referral_source, loyalty_points, created_at)
providers (id, name, role[STYLIST|BARBER|ESTHETICIAN|NAIL_TECH], commission_rate, booth_rent, schedule_json, color_code)
services (id, name, category, duration_min, price, requires_provider_type)
appointments (id, client_id, provider_id, service_ids[], status[BOOKED|CONFIRMED|CHECKED_IN|IN_PROGRESS|COMPLETE|NO_SHOW|CANCELLED], start_time, end_time, notes)
transactions (id, appointment_id, subtotal, tax, tip, total, payment_method, tip_split_json, created_at)
products (id, name, sku, category, price, cost, stock_qty)
product_sales (id, transaction_id, product_id, qty, price)
client_formulas (id, client_id, provider_id, formula_text, service_type, date)
loyalty_rewards (id, client_id, points_balance, tier)
waitlist (id, client_id, preferred_provider_id, preferred_date, service_id, status)
```

### API Routes
```
GET    /api/booking/availability?provider=&service=&date=  — open slots
POST   /api/appointments                                    — book appointment
PATCH  /api/appointments/:id/status                         — check-in, complete, no-show
POST   /api/transactions                                    — process payment + tip
GET    /api/clients/:id                                     — profile with history + formulas
POST   /api/clients/:id/formulas                            — save color/service formula
GET    /api/providers/:id/schedule                           — provider calendar
GET    /api/reports/commissions?period=                      — commission report
POST   /api/products/sale                                    — retail product sale
GET    /api/waitlist                                         — current waitlist
```

### Payment Patterns
Per-visit payment at checkout. Tips are critical (15-25% of revenue). Retail product sales. Package deals (buy 5 get 1 free). Gift cards. Some salons do monthly memberships (unlimited blowouts, etc.).

### Client Interaction Model
Book online or via Instagram DM. Walk-ins common for barbers. Loyalty is provider-specific (clients follow their stylist). Instagram is the portfolio. Referral is the #1 growth channel. Rebooking at checkout is the retention mechanism.

### Industry-Specific Nuances
- **Formula tracking** is sacred -- hair color formulas, skin treatment notes must persist
- **Tip handling** is complex (cash tips, card tips, tip pools, split tips)
- **Commission vs. booth rent** models require different financial tracking
- **No-show protection** (deposit requirements, cancellation policies)
- **Station/chair management** -- physical resource scheduling alongside people

### What They Currently Cobble Together (and Cost)
- Fresha: $19.95/mo + $14.95/staff + 20% commission on marketplace leads
- Vagaro: $30/mo + $10/staff
- Square Appointments: $0-149/mo + 2.6% processing
- GlossGenius: $24-48/mo
- Instagram for portfolio/booking
- Venmo/CashApp for tips
- **Total monthly SaaS spend: $50-300/mo**

---