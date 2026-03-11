/**
 * Industry Profile — generic shape for any business type.
 *
 * Universal fields (businessName, colors, etc.) are typed.
 * Industry-specific fields live in `industryData` — Claude decides
 * what goes there based on the business type.
 */

export interface IndustryProfile {
  // Business identity (universal)
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  tagline?: string;
  about?: string;
  phone?: string;

  // Brand (universal)
  primaryColor: string; // hex
  accentColor: string; // hex
  timezone: string; // IANA timezone

  // Industry classification
  industrySlug?: string; // e.g., "real_estate", "home_services"

  // Industry-specific data — shape varies by business type.
  // For a coaching business: { services, packages, cancellationPolicyHours }
  // For real estate: { serviceAreas, listingTypes, mlsIntegration }
  // For a restaurant: { menuCategories, tableCount, reservationPolicy }
  // Claude extracts whatever fields are relevant.
  industryData?: Record<string, unknown>;

  // Legacy fields — kept for backward compat with existing coaching projects.
  // New projects should use industryData instead.
  services?: Array<{
    name: string;
    description: string;
    duration: number;
    price: number;
    type: string;
  }>;
  packages?: Array<{
    name: string;
    description: string;
    price: number;
    totalSessions: number;
    validityDays: number;
    serviceNames: string[];
  }>;
  businessHours?: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };
  cancellationPolicyHours?: number;

  // Optional
  credentials?: string[];
  socialLinks?: Record<string, string>;
}

export interface TemplateConfig {
  templateSlug: string;
  templatePath: string;
  profile: IndustryProfile;
}

export interface TemplateResult {
  files: Map<string, string>;
  migrationSql: string;
  seedSql: string;
}
