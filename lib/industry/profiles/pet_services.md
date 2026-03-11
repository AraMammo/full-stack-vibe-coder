## 3. PET SERVICES (Groomer, Walker, Sitter, Vet)

### Core Workflows
- Pet owner contacts for service (grooming appointment, walk schedule, boarding dates)
- Intake: pet profile (breed, weight, temperament, vaccination records, allergies)
- Service performed, notes/photos sent to owner during service
- Pick-up or return, payment collected
- Recurring schedule maintained (daily walks, monthly grooming)

### Must-Have Features
- **Pet profiles** (not just client profiles) with medical/behavioral data
- **Vaccination record tracking** with expiration alerts
- **Scheduling** (one-time and recurring)
- **GPS tracking for walks** (live map for pet parents)
- **Photo/video report cards** sent after service
- **Multi-pet per household** management
- **Kennel/cage availability** for boarding
- **Waiver/liability forms** (digital signature)
- **Staff route optimization** for dog walkers

### Database Schema
```
owners (id, name, email, phone, address, emergency_contact, payment_method_id)
pets (id, owner_id, name, species, breed, weight, birthday, gender, spay_neuter_status, temperament_notes, allergies, feeding_instructions, vet_name, vet_phone)
vaccinations (id, pet_id, type[RABIES|BORDETELLA|DHPP|FLEA_TICK], date_administered, expiration_date, document_url)
bookings (id, pet_ids[], owner_id, service_type[WALK|GROOMING|BOARDING|DAYCARE|SITTING], staff_id, status, start_datetime, end_datetime, recurring_schedule_id, special_instructions)
recurring_schedules (id, owner_id, pet_ids[], service_type, days_of_week[], time, staff_id, active)
report_cards (id, booking_id, pet_id, photos[], notes, walk_distance, walk_duration, gps_route_json, mood_rating, feeding_done, potty_notes, sent_at)
kennels (id, name, size[SMALL|MEDIUM|LARGE], status[AVAILABLE|OCCUPIED|CLEANING])
kennel_assignments (id, kennel_id, booking_id, pet_id, check_in, check_out)
waivers (id, owner_id, signed_at, document_url, version)
invoices (id, owner_id, bookings[], amount, status, due_date, paid_at)
```

### API Routes
```
POST   /api/pets                         — add pet profile
POST   /api/pets/:id/vaccinations        — upload vaccination record
POST   /api/bookings                     — book service
GET    /api/bookings?date=&staff=        — schedule view
POST   /api/bookings/:id/report-card     — send report card with photos
GET    /api/kennels/availability?dates=  — check boarding availability
POST   /api/waivers/:owner_id/sign       — digital waiver
GET    /api/owners/:id/pets              — all pets for household
GET    /api/walks/:id/track              — live GPS for walk
POST   /api/recurring-schedules          — set up recurring service
```

### Payment Patterns
Per-visit for grooming. Recurring packages for walks (e.g., 20 walks/month). Daily rate for boarding/daycare. Holiday surcharges. Multi-pet discounts. Tipping common for walkers/groomers.

### Client Interaction Model
Find via Google, Rover/Wag marketplace, neighborhood referrals. Trust is paramount (you're caring for their "child"). Report cards with photos build loyalty. Text-heavy communication. Recurring schedules create lock-in.

### Industry-Specific Nuances
- **Vaccination compliance is non-negotiable** -- expired vaccines = cannot accept pet
- **Pet-centric, not person-centric** -- multiple pets per owner, each with unique needs
- **Liability waivers** required for every new client
- **Seasonal demand** (holiday boarding, summer daycare)
- **Staff capacity limits** (walker can handle 3-6 dogs, kennel has fixed capacity)

### What They Currently Cobble Together (and Cost)
- Time To Pet: $40-100/mo
- Gingr/PetExec: $85-105/mo
- Rover/Wag for leads: 15-20% commission
- Google Calendar for scheduling
- Venmo for payments
- **Total monthly SaaS spend: $85-200/mo + marketplace commissions**

---