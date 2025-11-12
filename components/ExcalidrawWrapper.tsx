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
    <div style={{ height: '100vh', width: '100%' }}>
      <Excalidraw
        theme="dark"
      />
    </div>
  );
}
