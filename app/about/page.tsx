/**
 * About Page - What is Vibe Coding?
 * Redirects to the main vibe coding information page
 */

import { redirect } from 'next/navigation';

export default function AboutPage() {
  // Redirect to the existing what-is-vibe-coding page
  redirect('/what-is-vibe-coding');
}