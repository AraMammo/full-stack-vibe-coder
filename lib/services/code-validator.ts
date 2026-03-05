/**
 * Pre-deploy code validation
 * Catches broken JSON, missing dependencies, empty files, and other issues
 * before pushing to GitHub and triggering Vercel builds.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  removedFiles: string[];
}

/**
 * Validate all code files before deployment.
 * Returns which files are invalid (to be removed) and which are fine.
 */
export function validateCodeFiles(files: Map<string, string>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const removedFiles: string[] = [];

  files.forEach((content, filepath) => {
    // Check for empty files
    if (!content || content.trim().length === 0) {
      warnings.push(`Empty file: ${filepath}`);
      removedFiles.push(filepath);
      return;
    }

    // Check for path traversal (defense in depth)
    if (filepath.includes('..') || filepath.startsWith('/')) {
      errors.push(`Unsafe path: ${filepath}`);
      removedFiles.push(filepath);
      return;
    }

    // Validate JSON files
    if (filepath.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch {
        errors.push(`Invalid JSON in ${filepath}`);
        removedFiles.push(filepath);
        return;
      }
    }

    // Validate package.json has next dependency
    if (filepath === 'package.json' || filepath.endsWith('/package.json')) {
      try {
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (!deps['next']) {
          warnings.push(`package.json missing 'next' dependency — adding it`);
        }
      } catch {
        // Already caught by JSON validation above
      }
    }

    // Check for unbalanced braces in TS/TSX/JS/JSX files
    if (/\.(tsx?|jsx?)$/.test(filepath)) {
      const openBraces = (content.match(/\{/g) || []).length;
      const closeBraces = (content.match(/\}/g) || []).length;
      if (Math.abs(openBraces - closeBraces) > 2) {
        warnings.push(`Possibly unbalanced braces in ${filepath} (open: ${openBraces}, close: ${closeBraces})`);
      }
    }

    // Validate Prisma schema
    if (filepath.endsWith('.prisma')) {
      if (!content.includes('datasource') || !content.includes('generator')) {
        warnings.push(`Prisma schema ${filepath} missing datasource or generator block`);
      }
    }
  });

  // Remove invalid files
  removedFiles.forEach((filepath) => {
    files.delete(filepath);
  });

  // Ensure package.json has next dep if it exists
  const pkgPath = files.has('package.json') ? 'package.json' : null;
  if (pkgPath) {
    try {
      const pkg = JSON.parse(files.get(pkgPath)!);
      if (!pkg.dependencies) pkg.dependencies = {};
      if (!pkg.dependencies['next']) {
        pkg.dependencies['next'] = '14.2.5';
        files.set(pkgPath, JSON.stringify(pkg, null, 2));
      }
    } catch {
      // Can't fix it, move on
    }
  }

  if (errors.length > 0 || removedFiles.length > 0) {
    console.warn(`[CodeValidator] Removed ${removedFiles.length} files, ${errors.length} errors, ${warnings.length} warnings`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    removedFiles,
  };
}
