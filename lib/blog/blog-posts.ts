import { BlogPost } from './blog-config';

/**
 * Blog Posts Registry
 *
 * All blog posts are listed here. As you write new posts,
 * add them to this array and they'll appear on the blog page.
 */

export const allBlogPosts: BlogPost[] = [
  // FUNDAMENTALS
  {
    slug: 'what-is-vibe-coding',
    title: 'What is Vibe Coding: Complete Guide for 2025',
    excerpt: 'Deep dive into vibe coding - how AI is transforming software development and why every developer needs to adapt now.',
    date: '2025-01-15',
    readTime: '8 min read',
    category: 'Fundamentals',
    featured: true
  },

  // BUILDING IN PUBLIC
  {
    slug: 'building-fullstack-vibe-coder-48-hours',
    title: 'I Built This Entire Platform in 48 Hours (Here\'s How)',
    excerpt: 'The complete build log of FullStackVibeCoder.com. What worked, what broke, and how AI did 90% of the heavy lifting.',
    date: '2025-01-20',
    readTime: '12 min read',
    category: 'Building in Public',
    featured: true
  },
  {
    slug: 'month-one-revenue-reality-check',
    title: 'Month One: $847 Revenue and Hard Lessons',
    excerpt: 'First month numbers from my AI dev agency. Revenue, expenses, time spent, and three mistakes that cost me clients.',
    date: '2025-01-22',
    readTime: '6 min read',
    category: 'Building in Public'
  },

  // CASE STUDIES
  {
    slug: 'case-study-saas-mvp-3-days',
    title: 'Case Study: SaaS MVP in 3 Days for $2,500',
    excerpt: 'How we built a complete appointment booking SaaS from zero to paying customers in 72 hours. Tech stack, timeline, and exact costs.',
    date: '2025-01-18',
    readTime: '10 min read',
    category: 'Case Studies',
    featured: true
  },
  {
    slug: 'client-went-from-idea-to-revenue-week',
    title: 'Client Went From Idea to $3K MRR in One Week',
    excerpt: 'Real results from a recent client: Simple automation tool, built in 4 days, $3,000 monthly recurring revenue after 7 days. Here\'s the breakdown.',
    date: '2025-01-25',
    readTime: '7 min read',
    category: 'Case Studies'
  },

  // MYTHS DEBUNKED
  {
    slug: 'myth-ai-will-replace-developers',
    title: 'Myth: "AI Will Replace Developers"',
    excerpt: 'Why this narrative is complete BS. AI makes good developers unstoppable. It makes bad developers unemployable. Here\'s the difference.',
    date: '2025-01-16',
    readTime: '5 min read',
    category: 'Myths Debunked'
  },
  {
    slug: 'myth-no-code-enough',
    title: 'Myth: "No-Code Is Just as Good"',
    excerpt: 'No-code gets you 80% there, then traps you. Real code gives you 100% control. Here\'s when each makes sense (and when you\'re being lied to).',
    date: '2025-01-23',
    readTime: '6 min read',
    category: 'Myths Debunked'
  },

  // SCAM ALERTS
  {
    slug: 'ai-agency-course-scam',
    title: 'I Paid $3K for an "AI Agency Course" - Complete Scam',
    excerpt: 'Fell for the AI agency guru playbook. Paid $3,000. Got recycled ChatGPT prompts. Here are the exact red flags I missed.',
    date: '2025-01-17',
    readTime: '9 min read',
    category: 'Scam Alerts',
    featured: true
  },
  {
    slug: 'spot-fake-ai-dev-agencies',
    title: 'How to Spot Fake AI Dev Agencies (Red Flags List)',
    excerpt: 'The AI dev space is full of scammers. Here\'s how to identify them before you waste money. 12 red flags from someone who learned the hard way.',
    date: '2025-01-21',
    readTime: '8 min read',
    category: 'Scam Alerts'
  },
  {
    slug: 'discord-gurus-selling-templates',
    title: 'Stop Buying Discord Course Templates for $500',
    excerpt: 'These "exclusive" Discord courses are selling you free GPT prompts for $500. I bought three. Here\'s what they actually contain.',
    date: '2025-01-24',
    readTime: '5 min read',
    category: 'Scam Alerts'
  }
];

/**
 * Get all posts, optionally filtered by category
 */
export function getBlogPosts(category?: string): BlogPost[] {
  if (!category || category === 'all') {
    return allBlogPosts;
  }
  return allBlogPosts.filter(post => post.category === category);
}

/**
 * Get featured posts (max 3 for homepage)
 */
export function getFeaturedPosts(): BlogPost[] {
  return allBlogPosts.filter(post => post.featured).slice(0, 3);
}

/**
 * Get a single post by slug
 */
export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return allBlogPosts.find(post => post.slug === slug);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(allBlogPosts.map(post => post.category));
  return Array.from(categories);
}
