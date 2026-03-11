## 22. PODCAST/MEDIA PRODUCER

### Core Workflows
- Plan episode (guest research, topic outline)
- Schedule and coordinate guest
- Record episode (remote or in-studio)
- Edit audio/video, add intros/outros
- Write show notes, create clips
- Publish to hosting platform (distributes to Apple, Spotify, etc.)
- Promote on social media
- Track analytics (downloads, listener demographics)
- Monetize (sponsors, premium content)

### Must-Have Features
- **Episode planning** (content calendar, guest pipeline)
- **Guest management** (booking, prep questionnaire, bio collection)
- **Recording scheduling** with calendar links
- **Show notes builder** (episode description, timestamps, links)
- **Social clip management** (audiograms, video clips per episode)
- **Analytics dashboard** (downloads, listener growth, top episodes)
- **Sponsor management** (ad reads, CPM tracking)
- **Transcript generation**
- **Website/RSS feed** management

### Database Schema
```
shows (id, name, description, artwork_url, rss_url, category, hosting_platform, website_url)
episodes (id, show_id, title, episode_number, season, description, show_notes_html, audio_url, video_url, transcript_text, status[PLANNED|RECORDING|EDITING|SCHEDULED|PUBLISHED], published_at, duration_seconds)
guests (id, name, email, bio, headshot_url, social_links_json, episodes_appeared[], notes, status[PROSPECT|CONFIRMED|RECORDED|PUBLISHED])
guest_bookings (id, episode_id, guest_id, scheduled_datetime, prep_questionnaire_sent, prep_questionnaire_completed, recording_link, status)
clips (id, episode_id, title, platform[INSTAGRAM|TIKTOK|YOUTUBE|TWITTER|LINKEDIN], clip_url, thumbnail_url, posted_at, engagement_json)
sponsors (id, company, contact, cpm_rate, deal_type[PRE_ROLL|MID_ROLL|POST_ROLL|NATIVE], active)
ad_placements (id, sponsor_id, episode_id, type, impressions, revenue)
analytics (id, episode_id, date, downloads, unique_listeners, platforms_json[{platform, percentage}])
content_calendar (id, show_id, planned_date, topic, guest_id, status[IDEA|PLANNED|CONFIRMED|RECORDED|PUBLISHED])
```

### API Routes
```
POST   /api/episodes                         — create episode
PATCH  /api/episodes/:id                     — update episode status
POST   /api/episodes/:id/publish             — publish episode
POST   /api/guests                           — add guest
POST   /api/guests/:id/book                  — schedule recording
POST   /api/guests/:id/questionnaire         — send prep questionnaire
POST   /api/clips                            — create clip from episode
GET    /api/analytics/show                   — show-level analytics
GET    /api/analytics/episode/:id            — per-episode analytics
POST   /api/sponsors                         — add sponsor
GET    /api/content-calendar                 — upcoming content plan
POST   /api/transcripts/generate             — generate transcript
```

### Payment Patterns
Sponsorship revenue (CPM-based: $15-50 per 1,000 downloads). Premium/bonus episodes (paid subscription $5-10/mo). Listener donations (Patreon/Buy Me a Coffee). Live event tickets. Course/product sales to audience.

### Client Interaction Model
Listeners find via podcast directories, social media, guest cross-promotion. Weekly/bi-weekly episode cadence. Community via Discord/social. Sponsors are the B2B relationship. Guest bookings create networking leverage.

### Industry-Specific Nuances
- **Guest coordination** is the most time-consuming admin task
- **Multi-platform distribution** (Apple, Spotify, YouTube, etc.) from one upload
- **Clip creation for social** -- repurposing episodes is the marketing engine
- **CPM-based sponsor reporting** -- need accurate download numbers
- **Season/episode numbering** conventions

### What They Currently Cobble Together (and Cost)
- Buzzsprout/Transistor for hosting: $19-79/mo
- Riverside for recording: $15-39/mo
- Descript for editing: $24-44/mo
- Calendly for guest booking: $10-16/mo
- Canva for episode art: $13/mo
- Podchaser/Matchmaker for guests
- **Total monthly SaaS spend: $80-200/mo across 4-6 tools**

---