import fs from "fs/promises";
import path from "path";
import { TemplateConfig, TemplateResult } from "./types";
import {
  customizeGlobalsCss,
  customizeSeedFile,
  customizeLayout,
  customizePackageJson,
  customizeEnvExample,
} from "./customizers";
import { generateSeedSql } from "./seed-generator";

/** Directories and file patterns to skip when reading the template source. */
const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);
const SKIP_FILES = new Set(["package-lock.json", "yarn.lock", "pnpm-lock.yaml", ".env"]);

/** Map of relative file paths to their customizer functions. */
const CUSTOMIZER_MAP: Record<
  string,
  (content: string, profile: TemplateConfig["profile"]) => string
> = {
  "app/globals.css": customizeGlobalsCss,
  "prisma/seed.ts": customizeSeedFile,
  "app/layout.tsx": customizeLayout,
  "package.json": customizePackageJson,
  ".env.example": customizeEnvExample,
};

/**
 * Build a complete file map from a template source directory, applying
 * customer-specific customizations from the provided profile.
 *
 * Returns a `TemplateResult` with:
 * - `files` — Map<string, string> of relative filepath to file content
 * - `migrationSql` — instruction string (Prisma handles migrations)
 * - `seedSql` — raw INSERT statements for seeding the provisioned database
 */
export async function buildFromTemplate(
  config: TemplateConfig
): Promise<TemplateResult> {
  const files = new Map<string, string>();

  // Recursively read all files from the template source
  await readDirRecursive(config.templatePath, "", files);

  // Apply customizations to files that have a registered customizer
  for (const [relativePath, customizer] of Object.entries(CUSTOMIZER_MAP)) {
    const content = files.get(relativePath);
    if (content !== undefined) {
      files.set(relativePath, customizer(content, config.profile));
    }
  }

  // Migration SQL: Prisma handles this via `npx prisma migrate deploy`.
  // We include the schema file in the file map (already read above).
  const migrationSql = [
    "-- Migration is handled by Prisma.",
    "-- Run: npx prisma migrate deploy",
    "-- The prisma/schema.prisma file is included in the generated output.",
  ].join("\n");

  // Seed SQL: raw INSERT statements derived from the customer profile
  const seedSql = generateSeedSql(config.profile);

  return { files, migrationSql, seedSql };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Recursively read all files under `baseDir + relativePath`, skipping
 * directories and files in the skip lists. Binary files are skipped
 * (only UTF-8 text files are included).
 */
async function readDirRecursive(
  baseDir: string,
  relativePath: string,
  files: Map<string, string>
): Promise<void> {
  const fullPath = path.join(baseDir, relativePath);
  const entries = await fs.readdir(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryRelative = relativePath
      ? `${relativePath}/${entry.name}`
      : entry.name;

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await readDirRecursive(baseDir, entryRelative, files);
    } else if (entry.isFile()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (SKIP_FILES.has(entry.name)) continue;
      if (entry.name.endsWith(".lock")) continue;

      // Attempt to read as UTF-8; skip binary files that fail
      try {
        const content = await fs.readFile(
          path.join(baseDir, entryRelative),
          "utf-8"
        );
        files.set(entryRelative, content);
      } catch {
        // Binary file or read error — skip silently
      }
    }
  }
}
