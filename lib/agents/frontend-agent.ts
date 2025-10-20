/**
 * Frontend Agent
 *
 * Generates React/Next.js components with TypeScript and Tailwind CSS
 */

import {
  BaseSpecialistAgent,
  TaskExecutionContext,
  SpecialistAgentResult,
  TaskArtifact,
} from './base-specialist-agent';

export class FrontendAgent extends BaseSpecialistAgent {
  constructor() {
    super({
      name: 'frontend',
      model: 'claude-sonnet-4.5-20250929',
      temperature: 0.6, // Balanced - creative but consistent code
      maxTokens: 16384, // Large output for component code
    });
  }

  getSystemPrompt(): string {
    return `You are a Frontend Development Agent for FullStackVibeCoder, an AI-powered development agency.

Your role is to generate production-ready React/Next.js components with TypeScript and Tailwind CSS.

# Your Expertise

- Next.js 14+ with App Router
- React 18+ with Server Components
- TypeScript (strict mode)
- Tailwind CSS for styling
- Accessibility (WCAG 2.1 AA)
- Performance optimization
- SEO best practices

# Code Quality Standards

1. **TypeScript**:
   - Use strict typing
   - Define proper interfaces and types
   - Avoid 'any' types
   - Use type-safe props

2. **React Best Practices**:
   - Use Server Components by default
   - Add 'use client' only when needed (hooks, interactivity)
   - Proper component composition
   - Meaningful component and variable names

3. **Styling**:
   - Use Tailwind CSS utility classes
   - Mobile-first responsive design
   - Consistent spacing and typography
   - Accessible color contrasts

4. **Code Structure**:
   - Clear file organization
   - Proper imports ordering
   - Comments for complex logic
   - JSDoc for component props

5. **Accessibility**:
   - Semantic HTML
   - ARIA labels where needed
   - Keyboard navigation support
   - Screen reader compatibility

# File Naming Conventions

- Components: PascalCase.tsx (e.g., HeroSection.tsx)
- Pages: lowercase with hyphens (e.g., about-us/page.tsx)
- Utilities: camelCase.ts (e.g., formatDate.ts)

# Output Format

Return a JSON array of artifacts:

\`\`\`json
[
  {
    "artifactType": "component",
    "fileName": "HeroSection.tsx",
    "filePath": "app/components/HeroSection.tsx",
    "content": "// Component code here",
    "language": "typescript",
    "framework": "react"
  }
]
\`\`\`

# Important

- Generate WORKING code (no placeholders or TODOs)
- Follow Next.js 14 App Router patterns
- Use TypeScript interfaces for props
- Include all necessary imports
- Add helpful comments
- Ensure responsive design
- Test-ready code (clear, testable structure)`;
  }

  async executeTask(context: TaskExecutionContext): Promise<SpecialistAgentResult> {
    try {
      console.log(`[frontend] Executing task: ${context.task.title}`);

      // Build user prompt with full context
      const userPrompt = this.buildUserPrompt(context);

      // Call Claude to generate component code
      const { content, usage } = await this.callClaude(userPrompt);

      // Parse artifacts from response
      const artifacts = this.parseJSON<TaskArtifact[]>(content);

      // Validate artifacts
      this.validateArtifacts(artifacts);

      // Generate summary
      const summary = this.generateSummary(artifacts);

      console.log(`[frontend] Generated ${artifacts.length} artifacts`);

      return {
        success: true,
        artifacts,
        summary,
        metadata: {
          tokensUsed: usage.input_tokens + usage.output_tokens,
        },
      };

    } catch (error) {
      console.error('[frontend] Execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build comprehensive user prompt with task details and context
   */
  private buildUserPrompt(context: TaskExecutionContext): string {
    const { task, project, dependencies } = context;
    const taskInput = task.input || {};

    let prompt = `Generate React/Next.js component(s) for the following task:

# Task Details

**Title**: ${task.title}

**Description**:
${task.description}

**Phase**: ${task.phase || 'build'}

# Project Context

**Project**: ${project.name}
${project.description}

**Tech Stack**:
- Frontend: ${project.techStack.frontend?.join(', ') || 'React, Next.js, TypeScript, Tailwind CSS'}
- Backend: ${project.techStack.backend?.join(', ') || 'Next.js API Routes'}
- Database: ${project.techStack.database?.join(', ') || 'PostgreSQL with Prisma'}

`;

    // Add acceptance criteria if available
    if (taskInput.acceptanceCriteria && taskInput.acceptanceCriteria.length > 0) {
      prompt += `# Acceptance Criteria

${taskInput.acceptanceCriteria.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

`;
    }

    // Add technical context
    if (taskInput.technicalContext) {
      const techContext = taskInput.technicalContext;

      if (techContext.designRequirements) {
        prompt += `# Design Requirements

${techContext.designRequirements.join('\n')}

`;
      }

      if (techContext.contentRequirements) {
        prompt += `# Content Requirements

${techContext.contentRequirements.join('\n')}

`;
      }
    }

    // Add dependency outputs (design specs, etc.)
    if (dependencies.length > 0) {
      prompt += `# Dependencies

`;
      dependencies.forEach(dep => {
        prompt += `## ${dep.title}

`;
        if (dep.artifacts.length > 0) {
          dep.artifacts.forEach(artifact => {
            prompt += `**${artifact.fileName}** (${artifact.artifactType}):
\`\`\`
${artifact.content.substring(0, 2000)}${artifact.content.length > 2000 ? '\n... (truncated)' : ''}
\`\`\`

`;
          });
        }
      });
    }

    prompt += `# Instructions

1. Generate production-ready React/Next.js component code
2. Use TypeScript with proper interfaces
3. Style with Tailwind CSS (mobile-first)
4. Follow Next.js 14 App Router patterns
5. Ensure accessibility (semantic HTML, ARIA labels)
6. Add helpful comments
7. Include all necessary imports

Return an array of artifacts in JSON format. Each artifact should have:
- artifactType: "component"
- fileName: Component file name
- filePath: Full path (e.g., "app/components/HeroSection.tsx")
- content: The complete component code
- language: "typescript"
- framework: "react"

Generate the artifacts now.`;

    return prompt;
  }

  /**
   * Validate generated artifacts
   */
  private validateArtifacts(artifacts: TaskArtifact[]): void {
    if (!Array.isArray(artifacts)) {
      throw new Error('Artifacts must be an array');
    }

    if (artifacts.length === 0) {
      throw new Error('No artifacts generated');
    }

    for (const artifact of artifacts) {
      if (!artifact.fileName) {
        throw new Error('Artifact missing fileName');
      }
      if (!artifact.filePath) {
        throw new Error(`Artifact ${artifact.fileName} missing filePath`);
      }
      if (!artifact.content || artifact.content.trim().length === 0) {
        throw new Error(`Artifact ${artifact.fileName} has empty content`);
      }
      if (!artifact.artifactType) {
        throw new Error(`Artifact ${artifact.fileName} missing artifactType`);
      }
    }
  }

  /**
   * Generate execution summary
   */
  private generateSummary(artifacts: TaskArtifact[]): string {
    const fileNames = artifacts.map(a => a.fileName).join(', ');
    const totalLines = artifacts.reduce((sum, a) => sum + a.content.split('\n').length, 0);

    return `Generated ${artifacts.length} component${artifacts.length > 1 ? 's' : ''}: ${fileNames}. Total: ${totalLines} lines of code.`;
  }
}
