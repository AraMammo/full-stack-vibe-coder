/**
 * Proposal Detail Page
 *
 * Displays AI-generated proposal with approval/revision actions
 * TODO: Implement Proposal model in Prisma schema before enabling this feature
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default async function ProposalPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  // Feature not yet implemented - Proposal model doesn't exist in Prisma schema
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Feature Not Implemented</h1>
        <p className="text-gray-600 mb-6">
          The proposal system requires additional database models that haven't been implemented yet.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
