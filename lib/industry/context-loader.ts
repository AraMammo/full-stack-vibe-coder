/**
 * Industry Context Loader
 *
 * Loads industry research profiles as prompt context for AI generation.
 * These are NOT templates — they're reference material that tells Claude
 * what features, database schema, payment patterns, and workflows
 * a given industry needs. Claude then generates the right code.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface IndustryMeta {
  slug: string;
  name: string;
  category: string;
}

// All available industry profiles with human-readable names
export const INDUSTRIES: IndustryMeta[] = [
  // Local Services
  { slug: 'home_services', name: 'Home Services (Plumber, Electrician, HVAC, Handyman)', category: 'Local Services' },
  { slug: 'personal_care', name: 'Personal Care (Salon, Barber, Spa, Nail Tech)', category: 'Local Services' },
  { slug: 'pet_services', name: 'Pet Services (Groomer, Walker, Sitter, Vet)', category: 'Local Services' },
  { slug: 'fitness_wellness', name: 'Fitness & Wellness (Personal Trainer, Yoga, Gym)', category: 'Local Services' },
  { slug: 'cleaning_services', name: 'Cleaning Services (Residential, Commercial)', category: 'Local Services' },
  { slug: 'auto_services', name: 'Auto Services (Mechanic, Detailer, Body Shop)', category: 'Local Services' },

  // Professional Services
  { slug: 'consultant_coach', name: 'Consultant / Coach (Business, Life, Executive)', category: 'Professional Services' },
  { slug: 'therapist_counselor', name: 'Therapist / Counselor (Mental Health, Couples, Family)', category: 'Professional Services' },
  { slug: 'accountant_bookkeeper', name: 'Accountant / Bookkeeper', category: 'Professional Services' },
  { slug: 'lawyer_legal', name: 'Lawyer / Legal Services', category: 'Professional Services' },
  { slug: 'real_estate', name: 'Real Estate Agent / Broker', category: 'Professional Services' },
  { slug: 'financial_advisor', name: 'Financial Advisor / Planner', category: 'Professional Services' },

  // Creative Services
  { slug: 'photographer_videographer', name: 'Photographer / Videographer', category: 'Creative Services' },
  { slug: 'graphic_designer', name: 'Graphic Designer / Brand Designer', category: 'Creative Services' },
  { slug: 'web_agency', name: 'Web Agency / Freelance Developer', category: 'Creative Services' },
  { slug: 'interior_designer', name: 'Interior Designer', category: 'Creative Services' },
  { slug: 'wedding_planner', name: 'Wedding Planner / Event Coordinator', category: 'Creative Services' },
  { slug: 'music_teacher', name: 'Music Teacher / Tutor', category: 'Creative Services' },

  // Knowledge / Creator Economy
  { slug: 'course_creator', name: 'Online Course Creator / Educator', category: 'Knowledge Economy' },
  { slug: 'membership_community', name: 'Membership Community Owner', category: 'Knowledge Economy' },
  { slug: 'newsletter_creator', name: 'Newsletter / Content Creator', category: 'Knowledge Economy' },
  { slug: 'podcast_producer', name: 'Podcast / Media Producer', category: 'Knowledge Economy' },

  // Startup / SaaS
  { slug: 'saas_startup', name: 'Early-Stage SaaS Founder', category: 'Startup / SaaS' },
  { slug: 'agency_saas', name: 'Agency SaaS (White-Label Tools)', category: 'Startup / SaaS' },

  // Trades & Specialty
  { slug: 'restaurant', name: 'Restaurant / Food Service', category: 'Trades & Specialty' },
  { slug: 'nonprofit', name: 'Nonprofit / Charity', category: 'Trades & Specialty' },
  { slug: 'church', name: 'Church / Religious Organization', category: 'Trades & Specialty' },
  { slug: 'property_manager', name: 'Property Manager / Landlord', category: 'Trades & Specialty' },
];

// Cache loaded profiles in memory
const profileCache = new Map<string, string>();

/**
 * Load the full industry research profile for a given slug.
 * Returns the markdown content with core workflows, features,
 * database schema, payment patterns, etc.
 */
export function getIndustryContext(slug: string): string | null {
  if (profileCache.has(slug)) {
    return profileCache.get(slug)!;
  }

  try {
    const filePath = join(process.cwd(), 'lib', 'industry', 'profiles', `${slug}.md`);
    const content = readFileSync(filePath, 'utf-8');
    profileCache.set(slug, content);
    return content;
  } catch {
    console.warn(`[Industry] No profile found for slug: ${slug}`);
    return null;
  }
}

/**
 * Get a compact list of all industries for the classifier prompt.
 */
export function getIndustryList(): string {
  const grouped: Record<string, IndustryMeta[]> = {};
  for (const ind of INDUSTRIES) {
    if (!grouped[ind.category]) grouped[ind.category] = [];
    grouped[ind.category].push(ind);
  }

  let list = '';
  for (const [category, industries] of Object.entries(grouped)) {
    list += `\n${category}:\n`;
    for (const ind of industries) {
      list += `  - "${ind.slug}": ${ind.name}\n`;
    }
  }
  return list.trim();
}

/**
 * Get the human-readable name for an industry slug.
 */
export function getIndustryName(slug: string): string | null {
  return INDUSTRIES.find((i) => i.slug === slug)?.name ?? null;
}
