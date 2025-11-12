/**
 * Whiteboard Page
 *
 * Free Excalidraw whiteboard tool for brainstorming, diagramming, and visual collaboration.
 * Dynamically imports Excalidraw to avoid SSR issues.
 */

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import Excalidraw with SSR disabled
const ExcalidrawWrapper = dynamic(
  () => import('@/components/ExcalidrawWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-white text-lg">Loading Whiteboard...</p>
        </div>
      </div>
    ),
  }
);

export default function WhiteboardPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Prevent body scroll when whiteboard is active
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!isMounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black z-[100]" style={{ paddingTop: '72px' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-white text-lg">Loading Whiteboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[100]" style={{ paddingTop: '72px' }}>
      <ExcalidrawWrapper />
    </div>
  );
}
