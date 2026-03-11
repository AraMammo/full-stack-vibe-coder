export interface IndustryProfile {
  // Business identity
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  tagline?: string;
  about?: string;
  phone?: string;

  // Brand
  primaryColor: string; // hex
  accentColor: string; // hex
  timezone: string; // IANA timezone

  // Services (coaching-specific for now)
  services: Array<{
    name: string;
    description: string;
    duration: number; // minutes
    price: number; // cents
    type: "INDIVIDUAL" | "GROUP" | "DISCOVERY" | "WORKSHOP";
  }>;

  // Packages
  packages: Array<{
    name: string;
    description: string;
    price: number; // cents
    totalSessions: number;
    validityDays: number;
    serviceNames: string[]; // which services are included
  }>;

  // Availability
  businessHours: {
    startTime: string; // "09:00"
    endTime: string; // "17:00"
    daysOfWeek: number[]; // 1=Mon, 5=Fri
  };

  // Optional
  credentials?: string[];
  socialLinks?: Record<string, string>;
  cancellationPolicyHours?: number;
}

export interface TemplateConfig {
  templateSlug: string; // e.g., "coaching"
  templatePath: string; // absolute path to template source
  profile: IndustryProfile;
}

export interface TemplateResult {
  files: Map<string, string>;
  migrationSql: string; // for Neon provisioning
  seedSql: string; // INSERT statements for seed data
}
