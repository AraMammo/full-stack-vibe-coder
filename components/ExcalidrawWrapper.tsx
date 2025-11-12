/**
 * ExcalidrawWrapper Component
 *
 * Client-side wrapper for Excalidraw whiteboard.
 * Must be dynamically imported with ssr: false in Next.js.
 */

'use client';

import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

export default function ExcalidrawWrapper() {
  return (
    <div style={{
      height: 'calc(100vh - 72px)',
      width: '100vw',
      position: 'relative'
    }}>
      <Excalidraw
        theme="dark"
      />
    </div>
  );
}
