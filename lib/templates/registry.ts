import { IndustryProfile } from "./types";

export interface RegisteredTemplate {
  slug: string;
  name: string;
  description: string;
  templatePath: string;
  features: string[];
  defaultConfig: Partial<IndustryProfile>;
}

export const TEMPLATES: RegisteredTemplate[] = [
  {
    slug: "coaching",
    name: "Coaching & Consulting",
    description:
      "Complete coaching practice management — booking, packages, client portal, invoicing",
    templatePath: "/Volumes/Side Quests/coaching-app",
    features: [
      "booking",
      "packages",
      "client-portal",
      "invoicing",
      "blog",
      "analytics",
      "email-automation",
    ],
    defaultConfig: {
      primaryColor: "#2563eb",
      accentColor: "#f59e0b",
      timezone: "America/New_York",
      businessHours: {
        startTime: "09:00",
        endTime: "17:00",
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      cancellationPolicyHours: 24,
    },
  },
];

export function getTemplate(slug: string): RegisteredTemplate | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

export function listTemplates(): RegisteredTemplate[] {
  return TEMPLATES;
}
