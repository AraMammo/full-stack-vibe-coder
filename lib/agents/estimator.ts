/**
 * Estimator Agent
 *
 * Calculates project cost and timeline based on scope defined by Scope Agent.
 * Uses pricing benchmarks and complexity analysis to generate accurate estimates.
 */

import { BaseAgent } from './base';
import {
  AgentResult,
  ProjectEstimate,
  ProjectEstimateSchema,
  WorkflowState,
} from './types';
import { prisma } from '@/lib/db';

export class EstimatorAgent extends BaseAgent<any, ProjectEstimate> {
  constructor() {
    super({
      name: 'estimator',
      temperature: 0.3, // Low temperature for consistent calculations
      maxTokens: 3000,
    });
  }

  getSystemPrompt(): string {
    return `You are a senior project estimator at FullStackVibeCoder, responsible for calculating project costs and timelines.

Your role is to analyze project scope and provide accurate, realistic estimates for cost, time, and resource allocation.

# Your Goals:
1. Calculate total cost (in cents) and timeline (in days/hours)
2. Break down costs by deliverable
3. Create realistic timeline with phases
4. Include contingency buffer for unknowns
5. Provide confidence scores for estimates

# Pricing Guidelines:

## Hourly Rates:
- Junior Developer: $7,500/hour ($75/hr in cents)
- Mid-level Developer: $12,500/hour ($125/hr in cents)
- Senior Developer: $17,500/hour ($175/hr in cents)
- Design/Branding: $10,000/hour ($100/hr in cents)

## Estimation by Complexity:

### Simple Deliverables:
- Simple Website (5 pages): 8-12 hours
- Basic Branding (logo, colors): 4-6 hours
- Simple Integration: 3-5 hours
- Documentation: 2-4 hours

### Medium Deliverables:
- Medium Website (6-15 pages): 16-32 hours
- Full Branding (logo, guidelines, assets): 8-12 hours
- Medium Integration (2 services): 6-10 hours
- Business/Marketing Plan: 4-8 hours

### Complex Deliverables:
- Complex Web App (15+ pages, auth, dashboard): 40-80 hours
- Advanced Branding (video, animations): 16-24 hours
- Complex Integration (3+ services, workflows): 12-20 hours
- Full Platform Architecture: 60-120 hours

## Contingency Buffer:
- Add 15-20% contingency for unexpected issues
- Higher contingency (25%) for projects with:
  - Unclear requirements
  - Multiple integrations
  - Custom/complex features

## Timeline Calculation:
- Assume 6 productive hours per day per developer
- Some work can be done in parallel
- Design/branding often blocks development
- Testing and revisions add 10-15% to timeline

# Output Format:
Respond with ONLY a JSON object:

{
  "totalCost": number (in cents),
  "totalDays": number,
  "totalHours": number,
  "breakdown": [
    {
      "deliverableId": "id-from-scope",
      "deliverableName": "Name",
      "hours": number,
      "cost": number (in cents),
      "days": number,
      "confidence": 0.0-1.0
    }
  ],
  "timeline": [
    {
      "phase": "Phase Name (e.g., Design, Development, Testing)",
      "startDay": number (1-indexed),
      "endDay": number,
      "deliverables": ["deliverable-id-1", "deliverable-id-2"]
    }
  ],
  "costBreakdown": {
    "labor": number (in cents),
    "thirdPartyServices": number (optional, in cents),
    "contingency": number (in cents)
  },
  "confidence": {
    "overall": 0.0-1.0,
    "notes": [
      "High confidence because X",
      "Lower confidence due to Y"
    ]
  }
}

# Example Calculation:

Scope:
- Deliverable 1: "Portfolio Web App" (complex website)
- Deliverable 2: "Brand Identity" (medium branding)

Estimate:
{
  "totalCost": 1050000,  // $10,500 in cents
  "totalDays": 12,
  "totalHours": 70,
  "breakdown": [
    {
      "deliverableId": "web-app",
      "deliverableName": "Portfolio Web App",
      "hours": 60,
      "cost": 900000,  // 60 hrs × $150/hr avg
      "days": 10,
      "confidence": 0.8
    },
    {
      "deliverableId": "branding",
      "deliverableName": "Brand Identity",
      "hours": 10,
      "cost": 100000,  // 10 hrs × $100/hr
      "days": 2,
      "confidence": 0.9
    }
  ],
  "timeline": [
    {
      "phase": "Design & Branding",
      "startDay": 1,
      "endDay": 3,
      "deliverables": ["branding"]
    },
    {
      "phase": "Development",
      "startDay": 4,
      "endDay": 10,
      "deliverables": ["web-app"]
    },
    {
      "phase": "Testing & Launch",
      "startDay": 11,
      "endDay": 12,
      "deliverables": ["web-app"]
    }
  ],
  "costBreakdown": {
    "labor": 900000,
    "thirdPartyServices": 0,
    "contingency": 150000
  },
  "confidence": {
    "overall": 0.85,
    "notes": [
      "High confidence in branding timeline",
      "Web app estimate assumes no major blockers",
      "15% contingency added for testing and revisions"
    ]
  }
}

Now calculate costs and timeline for the provided scope.`;
  }

  getOutputSchema() {
    return ProjectEstimateSchema;
  }

  async execute(state: WorkflowState): Promise<AgentResult<ProjectEstimate>> {
    try {
      if (!state.scope) {
        return {
          success: false,
          error: 'No scope found in workflow state. Scope agent must run first.',
        };
      }

      const { scope } = state;

      // Optional: Fetch pricing benchmarks from database
      const pricingBenchmarks = await prisma.pricingBenchmark.findMany({
        where: { active: true },
      });

      // Include benchmarks in prompt if available
      let benchmarksText = '';
      if (pricingBenchmarks.length > 0) {
        benchmarksText = `\n\n---\nACTUAL PRICING BENCHMARKS FROM DATABASE:\n${JSON.stringify(pricingBenchmarks, null, 2)}\n---\n\nUse these benchmarks to inform your estimates when applicable.`;
      }

      // Construct user prompt
      const userPrompt = `Please calculate cost and timeline estimates for this project scope:

---
PROJECT SCOPE:
${JSON.stringify(scope, null, 2)}
---
${benchmarksText}

Remember:
- All costs must be in CENTS (multiply dollars by 100)
- Be realistic about timelines
- Include contingency buffer
- Respond with ONLY the JSON object`;

      // Call Claude
      const { content, usage } = await this.callClaude(userPrompt);

      // Parse and validate
      const parsedData = this.parseJSON<ProjectEstimate>(content);
      const validatedData = this.validateOutput(parsedData);

      console.log(`[estimator] Created estimate:`, {
        totalCost: `$${(validatedData.totalCost / 100).toFixed(2)}`,
        totalDays: validatedData.totalDays,
        confidence: validatedData.confidence.overall,
      });

      return {
        success: true,
        data: validatedData,
        metadata: {
          tokensUsed: usage.input_tokens + usage.output_tokens,
        },
      };
    } catch (error) {
      console.error('[estimator] Execution error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in estimator agent',
      };
    }
  }
}
