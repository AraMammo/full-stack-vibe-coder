/**
 * Context Management Page
 *
 * /dashboard/context
 * Allows users to upload and manage their RAG context files
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// TYPES
// ============================================

interface Context {
  contextId: string;
  fileName: string;
  fileType: string;
  status: string;
  uploadedAt: string;
  chunksCount: number;
  wordCount?: number;
}

interface ContextStats {
  totalContexts: number;
  totalChunks: number;
  totalWords: number;
  byFileType: Record<string, number>;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ContextManagementPage() {
  const router = useRouter();
  const [contexts, setContexts] = useState<Context[]>([]);
  const [stats, setStats] = useState<ContextStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load contexts on mount
  useEffect(() => {
    loadContexts();
  }, []);

  // ============================================
  // API FUNCTIONS
  // ============================================

  async function loadContexts() {
    try {
      setLoading(true);
      const response = await fetch('/api/context?stats=true');

      if (!response.ok) {
        throw new Error('Failed to load contexts');
      }

      const data = await response.json();
      setContexts(data.data.contexts);
      setStats(data.data.stats);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    try {
      setUploading(true);
      setError(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/context/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setSuccessMessage(`Successfully uploaded ${file.name}`);

      // Reload contexts
      await loadContexts();

    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleURLUpload(url: string) {
    try {
      setUploading(true);
      setError(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append('url', url);

      const response = await fetch('/api/context/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setSuccessMessage(`Successfully processed ${url}`);

      // Reload contexts
      await loadContexts();

    } catch (error: any) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(contextId: string) {
    if (!confirm('Are you sure you want to delete this context?')) {
      return;
    }

    try {
      const response = await fetch(`/api/context/${contextId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete context');
      }

      setSuccessMessage('Context deleted successfully');

      // Reload contexts
      await loadContexts();

    } catch (error: any) {
      setError(error.message);
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-cyan-500 to-green-500 text-transparent bg-clip-text">
            Context Library
          </h1>
          <p className="text-gray-400 mt-2">
            Upload files and URLs to personalize your Business in a Box outputs
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Contexts" value={stats.totalContexts} />
            <StatCard title="Text Chunks" value={stats.totalChunks} />
            <StatCard title="Words" value={stats.totalWords.toLocaleString()} />
            <StatCard
              title="File Types"
              value={Object.keys(stats.byFileType).length}
            />
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <FileUploadCard
            onUpload={handleFileUpload}
            uploading={uploading}
          />
          <URLUploadCard
            onUpload={handleURLUpload}
            uploading={uploading}
          />
        </div>

        {/* Contexts List */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Your Contexts</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              Loading contexts...
            </div>
          ) : contexts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No contexts uploaded yet.</p>
              <p className="text-sm mt-2">Upload files or URLs above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contexts.map((context) => (
                <ContextCard
                  key={context.contextId}
                  context={context}
                  onDelete={() => handleDelete(context.contextId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <div className="text-gray-400 text-sm">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function FileUploadCard({
  onUpload,
  uploading
}: {
  onUpload: (file: File) => void;
  uploading: boolean
}) {
  const [dragActive, setDragActive] = useState(false);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  }

  return (
    <div
      className={`bg-gray-900/50 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 hover:border-gray-600'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="text-4xl mb-4">📄</div>
      <h3 className="text-lg font-semibold mb-2">Upload File</h3>
      <p className="text-sm text-gray-400 mb-4">
        PDF, DOCX, TXT, MD (max 10MB)
      </p>

      <label className="inline-block">
        <input
          type="file"
          className="hidden"
          onChange={handleChange}
          accept=".pdf,.docx,.txt,.md,.html"
          disabled={uploading}
        />
        <span className="inline-block px-6 py-2 bg-gradient-to-r from-pink-500 to-cyan-500 text-white rounded-lg font-medium cursor-pointer hover:opacity-90 transition-opacity">
          {uploading ? 'Uploading...' : 'Choose File'}
        </span>
      </label>

      <p className="text-xs text-gray-500 mt-4">
        or drag and drop
      </p>
    </div>
  );
}

function URLUploadCard({
  onUpload,
  uploading
}: {
  onUpload: (url: string) => void;
  uploading: boolean
}) {
  const [url, setUrl] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (url.trim()) {
      onUpload(url.trim());
      setUrl('');
    }
  }

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-8">
      <div className="text-4xl mb-4 text-center">🌐</div>
      <h3 className="text-lg font-semibold mb-2 text-center">Add URL</h3>
      <p className="text-sm text-gray-400 mb-4 text-center">
        LinkedIn, portfolio, competitor sites
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          disabled={uploading}
          required
        />
        <button
          type="submit"
          disabled={uploading || !url.trim()}
          className="w-full px-6 py-2 bg-gradient-to-r from-pink-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Processing...' : 'Add URL'}
        </button>
      </form>
    </div>
  );
}

function ContextCard({
  context,
  onDelete
}: {
  context: Context;
  onDelete: () => void
}) {
  const statusColors = {
    COMPLETED: 'text-green-500',
    PROCESSING: 'text-yellow-500',
    FAILED: 'text-red-500',
    PENDING: 'text-gray-500',
  };

  const statusColor = statusColors[context.status as keyof typeof statusColors] || 'text-gray-500';

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:border-gray-600 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">
            {context.fileType === 'URL' ? '🌐' :
             context.fileType === 'PDF' ? '📕' :
             context.fileType === 'DOCX' ? '📘' : '📄'}
          </span>
          <div>
            <h3 className="font-medium">{context.fileName}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
              <span className={statusColor}>{context.status}</span>
              <span>{context.chunksCount} chunks</span>
              {context.wordCount && <span>{context.wordCount.toLocaleString()} words</span>}
              <span>{new Date(context.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onDelete}
        className="px-4 py-2 text-red-500 hover:text-red-400 transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
