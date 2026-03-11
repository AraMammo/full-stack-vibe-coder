## 25. RESTAURANT/FOOD SERVICE (Dine-In Focused)

### Core Workflows
- Reservation/walk-in management
- Seating assignment, table turn management
- Order taking (server enters, kitchen receives)
- Kitchen display / ticket management
- Payment processing (split checks, tip handling)
- Inventory/ingredient tracking
- Staff scheduling
- Menu management (seasonal updates, 86'd items)
- Daily/weekly financial reporting

### Must-Have Features
- **Table management** with floor plan, availability, turn times
- **Reservation system** with online booking, waitlist, SMS notifications
- **Menu management** (categories, items, modifiers, pricing, photos, 86'd status)
- **POS / order management** (dine-in, takeout)
- **Kitchen display** (ticket queue, timing, routing by station)
- **Payment processing** with split checks, tip adjustment
- **Staff scheduling** and labor cost tracking
- **Inventory management** (ingredient-level tracking, waste, ordering)
- **Customer database** with visit history, preferences, allergies
- **Daily report** (sales, labor, food cost, covers)

### Database Schema
```
floor_plan (id, restaurant_id, tables_json[{table_id, name, capacity, x, y, shape}])
tables (id, name, capacity, zone[PATIO|MAIN|BAR|PRIVATE], status[AVAILABLE|OCCUPIED|RESERVED|DIRTY])
reservations (id, customer_id, date, time, party_size, table_id, status[CONFIRMED|SEATED|COMPLETED|NO_SHOW|CANCELLED], special_requests, created_via[ONLINE|PHONE|WALK_IN])
waitlist (id, customer_name, phone, party_size, estimated_wait_min, status[WAITING|NOTIFIED|SEATED|LEFT], joined_at)
menu_categories (id, name, sort_order, active)
menu_items (id, category_id, name, description, price, cost, photo_url, modifiers_available[], allergens[], is_86d, active)
modifiers (id, name, options_json[{name, price}], required, max_selections)
orders (id, table_id, server_id, status[OPEN|SUBMITTED|PREPARING|SERVED|CLOSED], type[DINE_IN|TAKEOUT], created_at)
order_items (id, order_id, menu_item_id, modifiers_selected[], quantity, price, status[ORDERED|PREPARING|READY|SERVED], station[GRILL|SAUTE|COLD|DESSERT|BAR], sent_to_kitchen_at)
checks (id, order_id, items[], subtotal, tax, tip, total, payment_method, split_type[FULL|EVEN_SPLIT|ITEM_SPLIT], status[OPEN|PAID])
staff (id, name, role[SERVER|HOST|COOK|BARTENDER|MANAGER], hourly_rate, pin_code)
shifts (id, staff_id, date, clock_in, clock_out, hours, tips_earned, break_minutes)
inventory (id, ingredient_name, unit, quantity_on_hand, par_level, cost_per_unit, supplier_id, last_ordered)
customers (id, name, email, phone, visit_count, last_visit, allergies, preferences, vip_flag)
daily_reports (id, date, total_sales, food_sales, bar_sales, covers, avg_check, labor_cost, food_cost_percent)
```

### API Routes
```
GET    /api/tables                           — floor plan with status
POST   /api/reservations                     — make reservation
GET    /api/reservations?date=               — day's reservations
POST   /api/waitlist                         — add to waitlist
POST   /api/orders                           — open order for table
POST   /api/orders/:id/items                 — add items to order
PATCH  /api/orders/:id/items/:item_id        — fire/update item
GET    /api/kitchen/tickets                  — kitchen display
POST   /api/checks/:id/pay                   — process payment
PATCH  /api/menu/:id                         — update menu item / 86
POST   /api/shifts/clock-in                  — staff clock in
GET    /api/reports/daily                    — daily report
GET    /api/inventory/alerts                 — low stock alerts
POST   /api/inventory/count                  — inventory count entry
```

### Payment Patterns
Per-table check (primary). Split checks (by item or evenly). Credit card + cash + gift card. Tip handling (auto-gratuity for large parties). POS processing fees (2.5-3%). Gift card sales and redemption.

### Client Interaction Model
Customers find via Google, Yelp, Instagram, word of mouth. Reserve via OpenTable, Google, website, or phone. Walk-ins common. Repeat customers are the backbone. Loyalty via consistency. Reviews on Yelp/Google drive discovery.

### Industry-Specific Nuances
- **86'd items** -- real-time menu availability is critical
- **Station routing** -- orders must route to correct kitchen station
- **Table turn management** -- revenue = covers x average check
- **Tip pools and tip outs** -- servers tip out bussers, bartenders, kitchen
- **Food cost tracking** -- target 28-32% food cost ratio
- **Allergen management** -- legal liability for incorrect allergen info
- **Split checks** -- the most requested and annoying payment feature

### What They Currently Cobble Together (and Cost)
- Toast POS: $69-165/mo + hardware + 2.49-2.99% processing
- Square for Restaurants: $0-149/mo + 2.6% processing
- Lightspeed Restaurant: $189+/mo
- OpenTable for reservations: $39-449/mo + $1-1.50/cover
- 7shifts for scheduling: $35-150/mo
- **Total monthly SaaS spend: $300-1,000/mo + processing fees + hardware lease**

---