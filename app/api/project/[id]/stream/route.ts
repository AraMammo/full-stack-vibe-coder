/**
 * SSE Endpoint for Real-Time Project Progress
 *
 * Streams prompt execution progress to the client via Server-Sent Events
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ProgressData {
  projectId: string;
  completedCount: number;
  totalCount: number;
  progress: number;
  currentSection: string | null;
  status: string;
  completedSections: {
    id: number;
    name: string;
    section: string;
    completedAt: Date | null;
  }[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  // Verify user authentication and authorization
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify user has access to this project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
  });

  if (!project) {
    return new Response('Project not found or access denied', { status: 403 });
  }

  // Create readable stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let isActive = true;

      // Function to send SSE data
      const sendUpdate = async () => {
        try {
          // Fetch all prompt executions for this project
          const executions = await prisma.promptExecution.findMany({
            where: { projectId },
            include: {
              prompt: {
                select: {
                  promptName: true,
                  promptSection: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          });

          // Get current project status
          const currentProject = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
              status: true,
              progress: true,
              completedPrompts: true,
              totalPrompts: true,
            },
          });

          const completed = executions.filter((e) => e.status === 'completed');
          const inProgress = executions.find((e) => e.status === 'in_progress');
          const total = executions.length || currentProject?.totalPrompts || 0;

          const progressData: ProgressData = {
            projectId,
            completedCount: completed.length,
            totalCount: total,
            progress: total > 0 ? Math.round((completed.length / total) * 100) : 0,
            currentSection: inProgress?.prompt.promptName || null,
            status: currentProject?.status || 'PENDING',
            completedSections: completed.map((e) => ({
              id: e.id,
              name: e.prompt.promptName,
              section: e.prompt.promptSection,
              completedAt: e.completedAt,
            })),
          };

          // Send data as SSE
          const data = `data: ${JSON.stringify(progressData)}\n\n`;
          controller.enqueue(encoder.encode(data));

          // If all complete or project is in final state, close stream
          if (
            currentProject?.status === 'COMPLETED' ||
            currentProject?.status === 'FAILED' ||
            (completed.length === total && total > 0)
          ) {
            isActive = false;
            controller.close();
          }
        } catch (error) {
          console.error('Error sending SSE update:', error);
          // Send error event
          const errorData = `event: error\ndata: ${JSON.stringify({ error: 'Failed to fetch progress' })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        }
      };

      // Send initial update
      await sendUpdate();

      // Poll every 2 seconds
      const interval = setInterval(async () => {
        if (isActive) {
          await sendUpdate();
        } else {
          clearInterval(interval);
        }
      }, 2000);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        isActive = false;
        clearInterval(interval);
        try {
          controller.close();
        } catch (e) {
          // Stream already closed
        }
      });
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
