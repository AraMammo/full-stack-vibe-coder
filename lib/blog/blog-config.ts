/**
 * Blog Configuration
 *
 * Content categories and metadata for the FSVC blog.
 * No BS. Real experiences. Actual results.
 */

export type BlogCategory =
  | 'Building in Public'
  | 'Case Studies'
  | 'Myths Debunked'
  | 'Scam Alerts'
  | 'Fundamentals'
  | 'Culture & Craft';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: BlogCategory;
  featured?: boolean;
}

export const categoryDescriptions: Record<BlogCategory, string> = {
  'Building in Public': 'Real project updates. Wins and failures. No filters.',
  'Case Studies': 'Actual client results with real numbers. Not fake testimonials.',
  'Myths Debunked': 'Calling out AI development BS. What actually works.',
  'Scam Alerts': 'Red flags I learned the hard way so you don\'t have to.',
  'Fundamentals': 'Core concepts explained clearly. No jargon.',
  'Culture & Craft': 'The people, philosophy, and history behind the code.'
};

export const categoryColors: Record<BlogCategory, string> = {
  'Building in Public': 'from-cyan-500 to-blue-500',
  'Case Studies': 'from-green-500 to-emerald-500',
  'Myths Debunked': 'from-pink-500 to-rose-500',
  'Scam Alerts': 'from-red-500 to-orange-500',
  'Fundamentals': 'from-purple-500 to-indigo-500',
  'Culture & Craft': 'from-amber-500 to-pink-500'
};
