import { IndustryProfile } from "./types";

/**
 * Replace CSS custom property values for primary and accent colors.
 */
export function customizeGlobalsCss(
  content: string,
  profile: IndustryProfile
): string {
  let result = content;
  result = result.replace(
    /--color-primary:\s*#[0-9a-fA-F]{3,8}/,
    `--color-primary: ${profile.primaryColor}`
  );
  result = result.replace(
    /--color-accent:\s*#[0-9a-fA-F]{3,8}/,
    `--color-accent: ${profile.accentColor}`
  );
  return result;
}

/**
 * Replace environment-variable fallbacks in the seed file with literal profile values.
 */
export function customizeSeedFile(
  content: string,
  profile: IndustryProfile
): string {
  let result = content;

  // Replace email references
  result = result.replace(
    /process\.env\.COACH_EMAIL \|\| "coach@example\.com"/g,
    `"${escapeDoubleQuotes(profile.ownerEmail)}"`
  );

  // Replace name references
  result = result.replace(
    /process\.env\.COACH_NAME \|\| "Coach"/g,
    `"${escapeDoubleQuotes(profile.ownerName)}"`
  );

  // Replace business name references
  result = result.replace(
    /process\.env\.BUSINESS_NAME \|\| "Coaching Practice"/g,
    `"${escapeDoubleQuotes(profile.businessName)}"`
  );

  // Replace timezone references
  result = result.replace(
    /process\.env\.COACH_TIMEZONE \|\| "America\/New_York"/g,
    `"${escapeDoubleQuotes(profile.timezone)}"`
  );

  // Also replace primary/accent colors in SiteSettings creation
  result = result.replace(
    /primaryColor:\s*"#2563eb"/,
    `primaryColor: "${profile.primaryColor}"`
  );
  result = result.replace(
    /accentColor:\s*"#f59e0b"/,
    `accentColor: "${profile.accentColor}"`
  );

  // Replace cancellation policy if provided
  if (profile.cancellationPolicyHours !== undefined) {
    result = result.replace(
      /cancellationPolicyHours:\s*\d+/,
      `cancellationPolicyHours: ${profile.cancellationPolicyHours}`
    );
  }

  return result;
}

/**
 * Update Next.js metadata (title and description) in the root layout.
 */
export function customizeLayout(
  content: string,
  profile: IndustryProfile
): string {
  let result = content;

  // Replace the metadata title
  result = result.replace(
    /title:\s*"[^"]*"/,
    `title: "${escapeDoubleQuotes(profile.businessName)}"`
  );

  // Replace the metadata description with tagline if available
  if (profile.tagline) {
    result = result.replace(
      /description:\s*\n?\s*"[^"]*"/,
      `description: "${escapeDoubleQuotes(profile.tagline)}"`
    );
  }

  return result;
}

/**
 * Update the package name to a slugified version of the business name.
 */
export function customizePackageJson(
  content: string,
  profile: IndustryProfile
): string {
  const slug = slugify(profile.businessName);
  return content.replace(/"name":\s*"[^"]*"/, `"name": "${slug}"`);
}

/**
 * .env.example is kept as-is — customer fills in their own keys.
 */
export function customizeEnvExample(
  content: string,
  _profile: IndustryProfile
): string {
  return content;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeDoubleQuotes(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
