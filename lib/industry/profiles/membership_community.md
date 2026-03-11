## 20. MEMBERSHIP COMMUNITY OWNER

### Core Workflows
- Member joins (free or paid)
- Onboarding sequence (welcome, introduce features, first action)
- Ongoing content delivery (posts, discussions, events)
- Live events (calls, workshops, AMAs)
- Member engagement tracking
- Churn management (at-risk members identified and contacted)
- Content archive grows over time

### Must-Have Features
- **Discussion spaces** (topic-based channels/groups)
- **Member directory** with profiles
- **Event scheduling** (live calls, workshops with RSVP)
- **Content library** (organized, searchable past content)
- **Member onboarding** automation
- **Subscription billing** (monthly/annual with free trial)
- **Engagement analytics** (active members, lurkers, at-risk)
- **Access levels/tiers** (free vs. paid, tiered membership)
- **Direct messaging** between members
- **Gamification** (points, badges, levels)

### Database Schema
```
members (id, user_id, name, email, tier[FREE|BASIC|PREMIUM|VIP], status[ACTIVE|TRIAL|PAUSED|CANCELLED], joined_at, stripe_subscription_id, last_active, engagement_score)
spaces (id, community_id, name, description, type[DISCUSSION|ANNOUNCEMENT|RESOURCE], access_tier_required, order)
posts (id, space_id, author_id, title, content, type[TEXT|LINK|IMAGE|VIDEO|POLL], pinned, likes_count, comments_count, created_at)
comments (id, post_id, author_id, content, parent_id, created_at)
events (id, title, description, type[LIVE_CALL|WORKSHOP|AMA|CHALLENGE], datetime, duration_min, recording_url, rsvp_count, max_capacity, access_tier)
event_rsvps (id, event_id, member_id, status[GOING|MAYBE|NOT_GOING], attended)
member_badges (id, member_id, badge_type, earned_at)
engagement_metrics (id, member_id, period, posts_count, comments_count, events_attended, logins, score)
tiers (id, name, price_monthly, price_annual, features[], spaces_access[])
onboarding_steps (id, member_id, step_name, completed_at)
direct_messages (id, from_id, to_id, content, read_at, created_at)
```

### API Routes
```
POST   /api/members/join                     — join community
GET    /api/feed?space=                      — content feed
POST   /api/posts                            — create post
POST   /api/posts/:id/comments               — add comment
POST   /api/events                           — create event
POST   /api/events/:id/rsvp                  — RSVP to event
GET    /api/members/directory                — member directory
GET    /api/members/:id/engagement           — engagement score
POST   /api/messages                         — send DM
GET    /api/analytics/community              — community health metrics
GET    /api/analytics/churn-risk             — at-risk members
POST   /api/tiers                            — create membership tier
```

### Payment Patterns
Monthly subscription ($9-297/mo). Annual discount (2 months free typically). Free tier with upgrade path. Founding member pricing (locked-in lower rate). Lifetime access (one-time). Challenge/event fees (separate from membership).

### Client Interaction Model
Find via the creator's audience (YouTube, podcast, social). Free content samples hook them. Community is the product. Peer connections increase retention. Events create urgency. Content library creates perceived value. Active engagement prevents churn.

### Industry-Specific Nuances
- **Engagement scoring** -- identifying lurkers vs. contributors
- **Churn prediction** -- members who haven't logged in in 30 days
- **Content organization** -- must be searchable, not just chronological
- **Tier-gating** -- certain spaces/content visible only to paid members
- **Community culture management** -- moderation, guidelines, featured members

### What They Currently Cobble Together (and Cost)
- Circle: $89-419/mo
- Skool: $99/mo per community
- Mighty Networks: $49-79/mo
- Discord (free but unprofessional)
- Stripe for billing: 2.9%
- Zoom for live events: $13-22/mo
- **Total monthly SaaS spend: $100-500/mo**

---