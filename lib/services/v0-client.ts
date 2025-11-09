/**
 * v0 Client Wrapper (REST API Implementation)
 *
 * Direct integration with v0.dev Platform API using REST endpoints.
 * No SDK dependencies required - uses native fetch.
 *
 * API Documentation: https://v0.dev/docs/api/platform/reference/chats/create
 */

// Type definitions for v0 API
interface ChatsCreateRequest {
  message: string;
  system?: string;
  chatPrivacy?: 'public' | 'private' | 'team-edit' | 'team' | 'unlisted';
  projectId?: string;
  designSystemId?: string | null;
  modelConfiguration?: {
    modelId?: 'v0-1.5-sm' | 'v0-1.5-md' | 'v0-1.5-lg';
    imageGenerations?: boolean;
    thinking?: boolean;
    responseMode?: 'sync' | 'async' | 'experimental_stream';
  };
}

interface ChatsCreateResponse {
  id: string;
  object: 'chat';
  messages: any[];
  latestVersion?: {
    status?: 'pending' | 'in_progress' | 'completed' | 'failed';
    demoUrl?: string;
    previewUrl?: string;
  };
  webUrl: string;
  apiUrl: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  privacy?: string;
}

const V0_API_BASE_URL = 'https://api.v0.dev';

// ============================================
// TYPES
// ============================================

export interface V0DeploymentResult {
  success: boolean;
  chatId?: string;
  previewUrl?: string;
  webUrl?: string;
  demoUrl?: string;
  projectId?: string;
  error?: string;
  metadata?: {
    createdAt?: string;
    privacy?: string;
    status?: string;
  };
}

export interface V0GenerateOptions {
  prompt: string;
  systemPrompt?: string;
  chatPrivacy?: 'public' | 'private' | 'team-edit' | 'team' | 'unlisted';
  projectId?: string;
  waitForCompletion?: boolean; // If true, poll until generation completes
}

// ============================================
// v0 CLIENT FUNCTIONS
// ============================================

/**
 * Generate a Next.js/React application from a prompt using v0
 *
 * @param options - Generation options including the prompt
 * @returns Deployment result with URLs and metadata
 */
export async function generateV0App(
  options: V0GenerateOptions
): Promise<V0DeploymentResult> {
  const apiKey = process.env.V0_API_KEY || process.env.VERCEL_V0_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'V0_API_KEY or VERCEL_V0_API_KEY not configured in environment variables',
    };
  }

  if (!options.prompt || options.prompt.length < 20) {
    return {
      success: false,
      error: 'Prompt must be at least 20 characters long',
    };
  }

  console.log('[v0] Starting app generation...');
  console.log(`[v0] Prompt length: ${options.prompt.length} characters`);
  console.log(`[v0] Privacy: ${options.chatPrivacy || 'private'}`);

  try {
    // Prepare request parameters
    const createParams: ChatsCreateRequest = {
      message: options.prompt,
      system: options.systemPrompt || 'You are an expert full-stack developer. Build a production-ready Next.js application based on the requirements provided. Use modern best practices, TypeScript, and Tailwind CSS.',
      chatPrivacy: options.chatPrivacy || 'private',
      projectId: options.projectId,
      modelConfiguration: {
        modelId: 'v0-1.5-lg', // Use largest model for best quality
        imageGenerations: false, // Don't need image generation for code
        thinking: false, // Skip thinking mode for faster response
        responseMode: 'sync', // Wait for initial response
      },
    };

    console.log('[v0] Calling v0 API...');
    console.log(`[v0] Endpoint: ${V0_API_BASE_URL}/v1/chats`);

    // Call v0 REST API
    const response = await fetch(`${V0_API_BASE_URL}/v1/chats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createParams),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(
        `v0 API returned ${response.status}: ${errorText}`
      );
    }

    const data: ChatsCreateResponse = await response.json();

    if (!data || !data.id) {
      throw new Error('Invalid response from v0 API - no chat ID returned');
    }

    console.log(`[v0] ✓ Chat created: ${data.id}`);
    console.log(`[v0] Web URL: ${data.webUrl}`);

    // Extract deployment information
    const result: V0DeploymentResult = {
      success: true,
      chatId: data.id,
      webUrl: data.webUrl,
      previewUrl: data.webUrl, // webUrl is the preview/edit URL
      projectId: data.projectId,
      metadata: {
        createdAt: data.createdAt,
        privacy: data.privacy,
        status: data.latestVersion?.status || 'pending',
      },
    };

    // If version has a demo URL, include it
    if (data.latestVersion?.demoUrl) {
      result.demoUrl = data.latestVersion.demoUrl;
      console.log(`[v0] ✓ Demo URL: ${data.latestVersion.demoUrl}`);
    }

    // If waitForCompletion is true, poll until generation completes
    if (options.waitForCompletion && data.latestVersion?.status === 'pending') {
      console.log('[v0] Waiting for generation to complete...');
      const completedChat = await waitForCompletion(data.id, apiKey);

      if (completedChat) {
        result.metadata!.status = completedChat.latestVersion?.status || 'completed';
        if (completedChat.latestVersion?.demoUrl) {
          result.demoUrl = completedChat.latestVersion.demoUrl;
        }
        if (completedChat.latestVersion?.previewUrl) {
          result.previewUrl = completedChat.latestVersion.previewUrl;
        }
      }
    }

    console.log('[v0] ✓ Generation successful');
    return result;

  } catch (error: any) {
    console.error('[v0] ✗ Generation failed:', error);

    return {
      success: false,
      error: error.message || 'Unknown error during v0 generation',
    };
  }
}

/**
 * Wait for v0 generation to complete by polling the chat status
 *
 * @param chatId - The chat ID to poll
 * @param apiKey - v0 API key for authentication
 * @param maxAttempts - Maximum number of polling attempts (default: 20)
 * @param intervalMs - Interval between polling attempts in ms (default: 3000)
 * @returns The completed chat details or null if timeout
 */
async function waitForCompletion(
  chatId: string,
  apiKey: string,
  maxAttempts: number = 20,
  intervalMs: number = 3000
): Promise<ChatsCreateResponse | null> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      // Wait before polling (except first attempt)
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }

      console.log(`[v0] Polling status (attempt ${attempts}/${maxAttempts})...`);

      // Get chat status via REST API
      const response = await fetch(`${V0_API_BASE_URL}/v1/chats/${chatId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`[v0] Polling request failed: ${response.status}`);
        continue; // Continue polling despite errors
      }

      const chat: ChatsCreateResponse = await response.json();

      if (!chat.latestVersion) {
        console.log('[v0] No version available yet, continuing to poll...');
        continue;
      }

      const status = chat.latestVersion.status;
      console.log(`[v0] Status: ${status}`);

      if (status === 'completed') {
        console.log('[v0] ✓ Generation completed!');
        return chat;
      }

      if (status === 'failed') {
        console.error('[v0] ✗ Generation failed');
        return null;
      }

      // Status is 'pending' or 'in_progress', continue polling
      console.log('[v0] Still generating, waiting...');

    } catch (error: any) {
      console.error(`[v0] Polling error (attempt ${attempts}):`, error.message);
      // Continue polling despite errors
    }
  }

  console.warn(`[v0] ⚠️  Timeout after ${maxAttempts} attempts`);
  return null;
}

/**
 * Get chat details by ID
 *
 * @param chatId - The chat ID to retrieve
 * @returns Chat details or null if not found
 */
export async function getV0Chat(chatId: string): Promise<ChatsCreateResponse | null> {
  const apiKey = process.env.V0_API_KEY || process.env.VERCEL_V0_API_KEY;

  if (!apiKey) {
    console.error('[v0] V0_API_KEY or VERCEL_V0_API_KEY not configured');
    return null;
  }

  try {
    console.log(`[v0] Fetching chat: ${chatId}`);

    const response = await fetch(`${V0_API_BASE_URL}/v1/chats/${chatId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[v0] Failed to fetch chat: ${response.status} ${response.statusText}`);
      return null;
    }

    const chat: ChatsCreateResponse = await response.json();
    console.log(`[v0] ✓ Chat retrieved: ${chat.id}`);
    return chat;

  } catch (error: any) {
    console.error(`[v0] Failed to fetch chat ${chatId}:`, error.message);
    return null;
  }
}

/**
 * Test v0 API connectivity
 *
 * @returns True if connection successful, false otherwise
 */
export async function testV0Connection(): Promise<boolean> {
  const apiKey = process.env.V0_API_KEY || process.env.VERCEL_V0_API_KEY;

  if (!apiKey) {
    console.error('[v0] V0_API_KEY or VERCEL_V0_API_KEY not configured');
    return false;
  }

  try {
    console.log('[v0] Testing API connection...');

    // Create a simple test chat
    const result = await generateV0App({
      prompt: 'Create a simple "Hello World" Next.js page with a centered h1 tag that says "v0 Connection Test"',
      chatPrivacy: 'private',
      waitForCompletion: false,
    });

    if (result.success) {
      console.log(`[v0] ✓ Test successful: ${result.webUrl}`);
      return true;
    }

    console.error(`[v0] ✗ Test failed: ${result.error}`);
    return false;

  } catch (error: any) {
    console.error(`[v0] ✗ Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Extract and format the replit_site_16 prompt for v0
 * Removes any markdown code blocks and formats for optimal v0 processing
 *
 * @param promptOutput - Raw output from replit_site_16 execution
 * @returns Cleaned and formatted prompt ready for v0
 */
export function formatReplitPromptForV0(promptOutput: string): string {
  let formatted = promptOutput.trim();

  // Remove markdown code blocks if present
  formatted = formatted.replace(/^```[\s\S]*?```$/gm, '');
  formatted = formatted.replace(/^```/gm, '');
  formatted = formatted.replace(/```$/gm, '');

  // Remove excessive whitespace
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Add v0-specific context at the beginning
  const v0Context = `Build a production-ready Next.js application with the following requirements:\n\n`;

  return v0Context + formatted;
}
