# Orchestrator & Specialist Agent Implementation

## Overview

This document details the implementation of the Orchestrator Agent and Specialist Agent framework for FullStackVibeCoder.com. The system automatically breaks down approved proposals into executable tasks and routes them to specialist AI agents for implementation.

## Implementation Date
January 2025

---

## Architecture

### System Flow

```
Proposal Approval
    ↓
Orchestrator Agent (breaks down into tasks)
    ↓
Task Queue (organized by phase + dependencies)
    ↓
Specialist Agents (execute tasks, generate code)
    ↓
Task Artifacts (stored in database)
    ↓
Project Completion
```

### Agents Implemented

1. **Orchestrator Agent** - Task decomposition and planning
2. **Frontend Agent** - React/Next.js component generation (WORKING)
3. **Backend Agent** - API routes and server logic (TODO)
4. **Design Agent** - Brand guidelines and UI specs (TODO)
5. **Content Agent** - Copywriting and documentation (TODO)

---

## Database Schema Updates

### 1. Task Model - Added `phase` Field

**File:** `prisma/schema.prisma:336`

```prisma
model Task {
  // ... existing fields ...
  phase         String?   // Project phase: design, build, test, launch
  // ... rest of model ...
}
```

**Purpose:** Organize tasks into project phases for better sequencing and visibility.

---

### 2. TaskArtifact Model - NEW

**File:** `prisma/schema.prisma:369-399`

```prisma
model TaskArtifact {
  id              String   @id @default(cuid())
  taskId          String
  projectId       String

  // Artifact details
  artifactType    String   // component, api_route, schema, config, documentation, asset
  fileName        String   // e.g., "HeroSection.tsx"
  filePath        String   // e.g., "app/components/HeroSection.tsx"
  content         String   @db.Text // The actual code/content

  // Metadata
  agentName       String   // Which agent created this
  language        String?  // typescript, css, markdown, etc.
  framework       String?  // react, nextjs, tailwind, etc.

  // File info
  fileSize        Int?     // Size in bytes
  linesOfCode     Int?     // Lines of code

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  task    Task    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([projectId])
  @@index([artifactType])
  @@index([agentName])
}
```

**Purpose:** Store generated code, documentation, and other artifacts produced by specialist agents.

---

## Types & Interfaces

### Orchestrator Types

**File:** `lib/agents/types.ts:386-480`

**Key Interfaces:**

```typescript
interface OrchestratorInput {
  projectId: string;
  userId: string;
  proposal: ProposalDocument;
  scope: ProjectScope;
  estimate: ProjectEstimate;
}

interface ExecutionPlan {
  projectId: string;
  phases: ProjectPhase[];
  tasks: TaskDefinition[];
  summary: {
    totalTasks: number;
    tasksByPhase: Record<string, number>;
    tasksByAgent: Record<string, number>;
    criticalPath: string[];
  };
}

interface TaskDefinition {
  id: string; // Temporary ID for dependency mapping
  title: string;
  description: string;
  phase: 'design' | 'build' | 'test' | 'launch';
  agentName: 'design' | 'frontend' | 'backend' | 'content' | 'infrastructure' | 'qa' | 'human';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  deliverableId?: string;
  featureIds?: string[];
  dependsOn: string[]; // Task IDs this depends on
  requiresHumanReview: boolean;
  acceptanceCriteria: string[];
  technicalContext?: {
    techStack?: string[];
    integrations?: string[];
    designRequirements?: string[];
    contentRequirements?: string[];
  };
}
```

---

## Orchestrator Agent

**File:** `lib/agents/orchestrator-agent.ts`

### Purpose

Breaks down approved proposals into atomic, executable tasks with proper sequencing and dependencies.

### Key Features

1. **Task Decomposition**
   - Parses proposal deliverables into work packages
   - Breaks into 2-8 hour tasks
   - Assigns to appropriate specialist agents

2. **Phase Organization**
   - Design Phase: Brand, wireframes, component specs
   - Build Phase: Frontend + Backend (parallel where possible)
   - Test Phase: QA, testing
   - Launch Phase: Deployment, handoff

3. **Dependency Management**
   - Identifies which tasks block others
   - Design tasks typically first
   - Frontend depends on design
   - Testing depends on implementation
   - Deployment depends on testing

4. **Priority Assignment**
   - Critical: Core deliverables, blockers
   - High: Important features
   - Medium: Standard features
   - Low: Polish, optional enhancements

### Configuration

```typescript
{
  name: 'orchestrator',
  model: 'claude-sonnet-4.5-20250929',
  temperature: 0.4, // Balanced creativity + consistency
  maxTokens: 8192,  // Large output for task lists
}
```

### System Prompt Highlights

```
Your role is to break down approved project proposals into executable tasks for specialist agents.

Decompose into Tasks:
- Tasks should be 2-8 hours each
- Atomic (single responsibility)
- Clear acceptance criteria
- Explicit dependencies

Assign Agents:
- design: Brand, UI/UX, wireframes
- frontend: React/Next.js components
- backend: API routes, database
- content: Copywriting, docs
- infrastructure: Deployment (human review)
- qa: Testing (human review)
- human: Complex decisions
```

### Methods

**`execute(input: OrchestratorInput)`**
- Calls Claude to decompose proposal
- Returns ExecutionPlan with tasks and phases

**`saveToDatabase(plan: ExecutionPlan)`**
- Creates Task records
- Maps temporary IDs to database IDs
- Updates dependencies with real IDs
- Sets initial task statuses (ready vs pending)
- Updates project status to 'in_progress'

### Database Integration

**Automatic Trigger:**
- When proposal approved → `POST /api/proposal/[id]/approve`
- Orchestrator runs automatically
- Tasks created in database
- Project status updated

**Manual Trigger:**
- `POST /api/project/[id]/orchestrate`
- Re-runs orchestration (requires deleting existing tasks first)

---

## Specialist Agent Framework

**File:** `lib/agents/base-specialist-agent.ts`

### Purpose

Abstract base class providing common functionality for all specialist agents (Frontend, Backend, Design, Content).

### Key Features

1. **Context Loading**
   - Loads task details
   - Loads project context
   - Loads dependency outputs (artifacts from previous tasks)

2. **Execution Flow**
   ```
   run(taskId)
     → loadContext()
     → updateStatus('in_progress')
     → executeTask()
     → saveArtifacts()
     → updateStatus('completed')
   ```

3. **Error Handling**
   - Retry logic (can be extended)
   - Task status updates on failure
   - Error logging

4. **Artifact Management**
   - Saves generated code to TaskArtifact table
   - Calculates file size and line count
   - Links to task and project

### Types

```typescript
interface TaskExecutionContext {
  task: {
    id: string;
    title: string;
    description: string;
    agentName: string;
    phase: string | null;
    input: any;
    dependsOn: string[];
  };
  project: {
    id: string;
    name: string;
    description: string;
    proposalContent: any;
    techStack: {
      frontend?: string[];
      backend?: string[];
      database?: string[];
      hosting?: string[];
    };
  };
  dependencies: {
    taskId: string;
    title: string;
    artifacts: Array<{
      id: string;
      fileName: string;
      filePath: string;
      content: string;
      artifactType: string;
    }>;
  }[];
}

interface TaskArtifact {
  artifactType: 'component' | 'api_route' | 'schema' | 'config' | 'documentation' | 'asset';
  fileName: string;
  filePath: string;
  content: string;
  language?: string;
  framework?: string;
}

interface SpecialistAgentResult {
  success: boolean;
  artifacts?: TaskArtifact[];
  summary?: string;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    executionTimeMs?: number;
  };
}
```

### Abstract Methods

Subclasses must implement:

```typescript
abstract getSystemPrompt(): string;
abstract executeTask(context: TaskExecutionContext): Promise<SpecialistAgentResult>;
```

---

## Frontend Agent

**File:** `lib/agents/frontend-agent.ts`

### Purpose

Generates production-ready React/Next.js components with TypeScript and Tailwind CSS.

### Configuration

```typescript
{
  name: 'frontend',
  model: 'claude-sonnet-4.5-20250929',
  temperature: 0.6, // Balanced creativity
  maxTokens: 16384, // Large for component code
}
```

### Code Quality Standards

1. **TypeScript**
   - Strict typing
   - Proper interfaces
   - No 'any' types

2. **React**
   - Server Components by default
   - 'use client' only when needed
   - Proper composition

3. **Styling**
   - Tailwind CSS utilities
   - Mobile-first responsive
   - Accessible colors

4. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation

### System Prompt Highlights

```
You are a Frontend Development Agent for FullStackVibeCoder.

Expertise:
- Next.js 14+ with App Router
- React 18+ with Server Components
- TypeScript (strict mode)
- Tailwind CSS
- Accessibility (WCAG 2.1 AA)
- Performance optimization
- SEO best practices

Output Format:
Return JSON array of artifacts with:
- artifactType: "component"
- fileName: "HeroSection.tsx"
- filePath: "app/components/HeroSection.tsx"
- content: Complete component code
- language: "typescript"
- framework: "react"
```

### Execution Flow

1. **Build User Prompt**
   - Task title, description, phase
   - Project context and tech stack
   - Acceptance criteria
   - Technical context (design requirements, content needs)
   - Dependency outputs (design specs from Design Agent)

2. **Call Claude**
   - Generate component code
   - Return artifacts as JSON

3. **Validate Artifacts**
   - Check all required fields present
   - Ensure content not empty
   - Validate artifact types

4. **Save to Database**
   - Create TaskArtifact records
   - Calculate file size and line count
   - Link to task and project

### Example Output

```json
[
  {
    "artifactType": "component",
    "fileName": "HeroSection.tsx",
    "filePath": "app/components/HeroSection.tsx",
    "content": "/**\n * Hero Section Component\n */\n\nexport function HeroSection() {\n  return (\n    <section className=\"min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800\">\n      <div className=\"max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center\">\n        <h1 className=\"text-5xl font-bold text-white mb-6\">\n          Welcome to Our Platform\n        </h1>\n        <p className=\"text-xl text-gray-300 mb-8\">\n          Build amazing products with AI-powered development\n        </p>\n        <button className=\"px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors\">\n          Get Started\n        </button>\n      </div>\n    </section>\n  );\n}",
    "language": "typescript",
    "framework": "react"
  }
]
```

---

## API Endpoints

### 1. POST /api/project/[id]/orchestrate

**File:** `app/api/project/[id]/orchestrate/route.ts`

**Purpose:** Manually trigger orchestration for a project

**Request:**
```
POST /api/project/{projectId}/orchestrate
```

**Response:**
```json
{
  "success": true,
  "message": "Project orchestrated successfully",
  "executionPlan": {
    "totalTasks": 15,
    "phases": 4,
    "tasksByPhase": { "design": 3, "build": 8, "test": 2, "launch": 2 },
    "tasksByAgent": { "design": 3, "frontend": 5, "backend": 3, "qa": 2, "human": 2 }
  }
}
```

**Validation:**
- Checks project exists and user owns it
- Prevents re-orchestration if tasks already exist
- Validates workflow context has scope + estimate

**Error Handling:**
- Sets project status to 'orchestration_failed' on error
- Non-blocking (can re-trigger manually)

---

### 2. GET /api/project/[id]/plan

**File:** `app/api/project/[id]/plan/route.ts`

**Purpose:** View execution plan (tasks grouped by phase)

**Request:**
```
GET /api/project/{projectId}/plan
```

**Response:**
```json
{
  "project": {
    "id": "...",
    "name": "Coffee Roaster Landing Page",
    "status": "in_progress",
    "progress": 40,
    "deadline": "2025-02-15T00:00:00.000Z"
  },
  "statistics": {
    "totalTasks": 15,
    "completedTasks": 6,
    "inProgressTasks": 2,
    "readyTasks": 4,
    "blockedTasks": 3,
    "progress": 40
  },
  "phases": [
    {
      "name": "design",
      "displayName": "Design",
      "totalTasks": 3,
      "completedTasks": 3,
      "progress": 100,
      "tasks": [...]
    },
    {
      "name": "build",
      "displayName": "Build",
      "totalTasks": 8,
      "completedTasks": 3,
      "progress": 37,
      "tasks": [...]
    }
  ]
}
```

**Features:**
- Groups tasks by phase
- Calculates completion percentage per phase
- Shows task dependencies
- Highlights tasks requiring human review

---

### 3. GET /api/project/[id]/tasks

**File:** `app/api/project/[id]/tasks/route.ts`

**Purpose:** List and filter tasks

**Request:**
```
GET /api/project/{projectId}/tasks?status=ready&agentType=frontend&readyOnly=true
```

**Query Parameters:**
- `status` - Filter by task status (pending, ready, in_progress, completed, failed)
- `agentType` - Filter by agent (frontend, backend, design, content, etc.)
- `phase` - Filter by phase (design, build, test, launch)
- `priority` - Filter by priority (low, medium, high, critical)
- `readyOnly` - Show only tasks ready to execute (no pending dependencies)

**Response:**
```json
{
  "tasks": [
    {
      "id": "...",
      "title": "Create hero section component",
      "description": "...",
      "agentName": "frontend",
      "phase": "build",
      "status": "ready",
      "priority": "high",
      "estimatedHours": 4,
      "requiresHumanReview": false,
      "acceptanceCriteria": [...],
      "technicalContext": {...},
      "dependsOn": [],
      "dependencyCount": 0
    }
  ],
  "summary": {
    "total": 5,
    "byStatus": { "ready": 3, "completed": 2 },
    "byAgent": { "frontend": 5 },
    "byPhase": { "build": 5 }
  },
  "filters": {
    "status": "ready",
    "agentType": "frontend",
    "phase": "all",
    "priority": "all",
    "readyOnly": true
  }
}
```

---

### 4. POST /api/agent/execute

**File:** `app/api/agent/execute/route.ts`

**Purpose:** Manually execute a task with appropriate specialist agent

**Request:**
```json
{
  "taskId": "clx..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task executed successfully",
  "task": {
    "id": "...",
    "title": "Create hero section component",
    "status": "completed",
    "completedAt": "2025-01-20T15:30:00.000Z"
  },
  "execution": {
    "summary": "Generated 1 component: HeroSection.tsx. Total: 45 lines of code.",
    "artifactCount": 1,
    "tokensUsed": 3500,
    "executionTimeMs": 2300
  },
  "artifacts": [
    {
      "id": "...",
      "fileName": "HeroSection.tsx",
      "filePath": "app/components/HeroSection.tsx",
      "artifactType": "component",
      "language": "typescript",
      "linesOfCode": 45
    }
  ]
}
```

**Validation:**
- Checks task exists and user owns project
- Prevents execution if task already completed or in progress
- Checks all dependencies are completed
- Validates agent type is implemented

**Agent Routing:**
- `frontend` → FrontendAgent ✅ WORKING
- `backend` → BackendAgent (TODO)
- `design` → DesignAgent (TODO)
- `content` → ContentAgent (TODO)
- `human`, `qa`, `infrastructure` → Requires human review (returns error)

**Error Handling:**
- Returns incomplete dependencies if blocked
- Returns error for unimplemented agents
- Sets task status to 'failed' on execution error

---

## Approval Flow Integration

**File:** `app/api/proposal/[id]/approve/route.ts:100-136`

### Automatic Orchestration on Approval

When a proposal is approved:

1. **Project Created**
   ```typescript
   const project = await prisma.project.create({
     data: {
       workflowId, proposalId, userId,
       name, description,
       status: 'not_started',
       progress: 0,
       deadline: calculateDeadline(estimatedDays),
     },
   });
   ```

2. **Orchestrator Triggered**
   ```typescript
   const orchestratorInput: OrchestratorInput = {
     projectId: project.id,
     userId: session.user.id,
     proposal: proposal.content,
     scope: workflowContext.scope,
     estimate: workflowContext.estimate,
   };

   const orchestrator = new OrchestratorAgent();
   const result = await orchestrator.execute(orchestratorInput);
   ```

3. **Tasks Saved**
   ```typescript
   if (result.success && result.data) {
     await orchestrator.saveToDatabase(result.data);
     console.log(`✓ Orchestration completed: ${result.data.summary.totalTasks} tasks created`);
   }
   ```

4. **Error Handling**
   - Non-blocking: If orchestration fails, project still approved
   - Project status set to 'orchestration_failed'
   - Can re-run manually via `/api/project/[id]/orchestrate`

---

## Testing Flow

### Manual Testing Steps

1. **Approve a Test Proposal**
   ```
   POST /api/proposal/{id}/approve
   ```
   - Creates project
   - Runs orchestrator
   - Generates tasks

2. **View Execution Plan**
   ```
   GET /api/project/{id}/plan
   ```
   - See tasks grouped by phase
   - Check dependencies
   - View progress

3. **Find Ready Tasks**
   ```
   GET /api/project/{id}/tasks?readyOnly=true&agentType=frontend
   ```
   - Lists tasks with no pending dependencies
   - Filters by agent type

4. **Execute a Frontend Task**
   ```
   POST /api/agent/execute
   { "taskId": "clx..." }
   ```
   - Runs Frontend Agent
   - Generates component code
   - Saves artifacts

5. **View Generated Code**
   ```sql
   SELECT * FROM "TaskArtifact" WHERE "taskId" = 'clx...';
   ```
   - Check artifact content
   - Verify file paths
   - Review generated code

6. **Check Task Status**
   ```
   GET /api/project/{id}/plan
   ```
   - Task marked as completed
   - Progress updated
   - Dependent tasks now ready

---

## Implementation Summary

### Files Created

**Agents:**
- `lib/agents/orchestrator-agent.ts` - Task decomposition
- `lib/agents/base-specialist-agent.ts` - Common framework
- `lib/agents/frontend-agent.ts` - React/Next.js generation

**Types:**
- `lib/agents/types.ts` - Added Orchestrator + Specialist types

**API Routes:**
- `app/api/project/[id]/orchestrate/route.ts` - Trigger orchestration
- `app/api/project/[id]/plan/route.ts` - View execution plan
- `app/api/project/[id]/tasks/route.ts` - List/filter tasks
- `app/api/agent/execute/route.ts` - Execute specialist agent

**Schema Updates:**
- `prisma/schema.prisma` - Added `phase` field to Task
- `prisma/schema.prisma` - Added TaskArtifact model

**Modified:**
- `app/api/proposal/[id]/approve/route.ts` - Integrated orchestrator

---

## Success Metrics

✅ **Orchestration:**
- Proposal approval triggers automatic task breakdown
- Tasks created with proper dependencies
- Phases organized (design → build → test → launch)
- Agent assignments correct

✅ **Frontend Agent:**
- Generates working TypeScript React components
- Uses Tailwind CSS for styling
- Follows Next.js 14 patterns
- Artifacts saved to database

✅ **API Endpoints:**
- View project execution plan
- Filter tasks by status/agent/phase
- Manually execute tasks
- Track progress

✅ **Database Integration:**
- Tasks linked to projects
- Artifacts linked to tasks
- Dependencies tracked
- Status updates work

---

## Known Limitations

1. **Single Agent Implemented**
   - Only Frontend Agent functional
   - Backend, Design, Content agents TODO
   - Human review tasks not automated

2. **Manual Execution Required**
   - No automatic agent scheduling
   - Need to call `/api/agent/execute` manually
   - Future: Add job queue (Inngest)

3. **No Automatic Dependency Resolution**
   - System identifies dependencies
   - Doesn't auto-execute when dependencies complete
   - Future: Event-driven execution

4. **No Retry Logic**
   - Failed tasks stay failed
   - Manual re-execution required
   - Future: Automatic retry with backoff

5. **No Human Review UI**
   - Tasks flagged for human review
   - No portal for humans to review/approve
   - Future: Build review interface

---

## Next Steps

### Immediate (Extend Current System)

1. **Implement Backend Agent**
   - Generate API routes
   - Database operations
   - Server-side logic

2. **Implement Design Agent**
   - Brand guidelines
   - Component specifications
   - Wireframes (text descriptions)

3. **Implement Content Agent**
   - Copywriting
   - Documentation
   - SEO content

4. **Automatic Execution**
   - Event listener for task completion
   - Auto-execute dependent tasks when ready
   - Queue system (Inngest)

### Future (Scale System)

5. **Human Review Portal**
   - UI for reviewing agent outputs
   - Approve/reject artifacts
   - Request modifications

6. **Inter-Agent Communication**
   - Agents ask clarifying questions
   - Pass context between agents
   - Collaborative refinement

7. **Code Validation**
   - TypeScript compilation check
   - Linting
   - Test generation + execution

8. **Deployment Pipeline**
   - Create deployable projects
   - GitHub repo generation
   - CI/CD setup
   - Vercel deployment

---

## Technical Debt

- [ ] Add comprehensive error recovery
- [ ] Implement rate limiting for agent calls
- [ ] Add cost tracking (token usage × pricing)
- [ ] Build admin dashboard for monitoring
- [ ] Add telemetry and observability
- [ ] Implement task retry with exponential backoff
- [ ] Add validation for generated code (TypeScript compiler, linting)
- [ ] Build artifact preview UI
- [ ] Add version control for artifacts (revision history)
- [ ] Implement artifact diffing (compare versions)

---

## Conclusion

The Orchestrator and Specialist Agent system is **functional and ready for testing**. The core infrastructure is in place:

- ✅ Proposals automatically break down into tasks
- ✅ Tasks organized by phase with dependencies
- ✅ Frontend Agent generates working React components
- ✅ Artifacts stored and retrievable from database
- ✅ Manual execution API for testing

**Next milestone:** Implement Backend, Design, and Content agents to achieve full automation of project execution.
