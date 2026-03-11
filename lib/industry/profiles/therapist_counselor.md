## 8. THERAPIST/COUNSELOR (Mental Health, Couples, Family)

### Core Workflows
- Client finds therapist (directory, referral, insurance panel)
- Intake: insurance verification, consent forms, intake questionnaire
- Session scheduled (weekly cadence typical)
- Session conducted (50 min), progress notes written (required by law)
- Claim submitted to insurance or client pays out-of-pocket
- Superbill generated for out-of-network clients
- Ongoing weekly sessions, treatment plan updates

### Must-Have Features
- **HIPAA-compliant everything** (encrypted storage, BAA with vendors, audit logs)
- **Intake forms** with e-signature (consent to treat, privacy practices, policies)
- **Insurance verification** and eligibility checks
- **Scheduling** with recurring session support
- **Progress notes** (DAP, SOAP, BIRP formats) with templates
- **Treatment plans** with goals and interventions
- **Claims submission** (electronic via clearinghouse)
- **Superbill generation** (for out-of-network reimbursement)
- **Secure client portal** (messaging, documents, forms)
- **Telehealth** (HIPAA-compliant video)

### Database Schema
```
clients (id, legal_name, preferred_name, email, phone, dob, address, emergency_contact, insurance_id, referral_source, status[ACTIVE|INACTIVE|DISCHARGED])
insurance_info (id, client_id, carrier, plan_name, member_id, group_number, copay, deductible, deductible_met, authorization_sessions, auth_expiry)
sessions (id, client_id, therapist_id, datetime, duration_min, type[INDIVIDUAL|COUPLES|FAMILY|GROUP], modality[IN_PERSON|TELEHEALTH], status[SCHEDULED|COMPLETED|CANCELLED_LATE|CANCELLED|NO_SHOW], cpt_code)
progress_notes (id, session_id, format[DAP|SOAP|BIRP], content_encrypted, diagnosis_codes[], interventions[], signed_at, locked)
treatment_plans (id, client_id, diagnosis_codes[], goals_json[{goal, objectives[], interventions[], target_date}], review_date, status[ACTIVE|UPDATED|COMPLETED])
claims (id, session_id, insurance_id, cpt_code, diagnosis_codes[], amount_billed, amount_allowed, amount_paid, patient_responsibility, status[SUBMITTED|ACCEPTED|DENIED|PAID], submitted_at)
superbills (id, client_id, sessions_ids[], generated_at, pdf_url)
consent_forms (id, client_id, form_type, signed_at, document_url, version)
intake_questionnaires (id, client_id, responses_encrypted, submitted_at)
audit_log (id, user_id, action, resource_type, resource_id, timestamp, ip_address)
```

### API Routes
```
POST   /api/clients/intake                  — full intake process
POST   /api/insurance/verify                — eligibility check
GET    /api/schedule?therapist=&week=       — weekly schedule
POST   /api/sessions/:id/notes              — write progress note (encrypted)
POST   /api/sessions/:id/notes/lock         — lock/sign note
POST   /api/treatment-plans                 — create treatment plan
POST   /api/claims/submit                   — submit insurance claim
POST   /api/superbills/generate             — generate superbill PDF
GET    /api/clients/:id/ledger              — financial history
GET    /api/telehealth/:session_id/join     — secure video link
GET    /api/audit-log                        — compliance audit trail
```

### Payment Patterns
Insurance copay per session ($20-60). Out-of-pocket per session ($100-250). Sliding scale available. Superbill for out-of-network reimbursement. Late cancellation fees. No-show fees. Rarely packages or memberships.

### Client Interaction Model
Find via Psychology Today, insurance panel, referral. Intake is extensive (forms, insurance, questionnaires). Weekly recurring sessions (same day/time). Secure portal communication only (not regular email/text). Relationship may last months to years.

### Industry-Specific Nuances
- **HIPAA compliance is non-negotiable** -- encryption at rest + in transit, BAA required, audit logs mandatory
- **Progress notes are legal documents** -- must be locked after signing, formats mandated by payers
- **Insurance billing is extremely complex** -- CPT codes, diagnosis codes, clearinghouse integration
- **Sliding scale** tracking per client
- **Telehealth consent** is separate from general consent
- **Group notes vs. individual notes** -- different documentation requirements

### What They Currently Cobble Together (and Cost)
- SimplePractice: $29-158/mo + 3.15% processing
- TherapyNotes: $49-69/mo + $40/additional clinician
- Jane App: pricing varies + 2.85% processing
- Psychology Today directory: $30/mo for listing
- Zoom (HIPAA BAA plan): $22/mo
- **Total monthly SaaS spend: $100-300/mo per clinician**

---