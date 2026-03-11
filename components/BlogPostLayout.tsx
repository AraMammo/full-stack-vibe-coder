/**
 * BlogPostLayout Component
 *
 * Reusable layout for all blog posts. Substack-style with brand theme.
 * Handles structure, navigation, and CTA consistently across all posts.
 */

import Link from 'next/link';
import { type BlogCategory, categoryColors } from '@/lib/blog/blog-config';

interface BlogPostLayoutProps {
  title: string;
  category: BlogCategory;
  date: string;
  readTime: string;
  children: React.ReactNode;
}

export function BlogPostLayout({
  title,
  category,
  date,
  readTime,
  children
}: BlogPostLayoutProps) {
  return (
    <article className="blog-post-page">
      <div className="blog-post-container">
        {/* Header */}
        <header className="blog-post-header">
          {/* Meta Navigation */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Link
              href="/blog"
              className="text-accent-2 hover:text-accent-2/80 font-medium transition-colors"
            >
              ← Back to Blog
            </Link>
            <span
              className={`
                px-4 py-1.5 rounded-full text-sm font-semibold
                bg-gradient-to-r ${categoryColors[category]}
                text-white shadow-lg
              `}
            >
              {category}
            </span>
            <time className="text-white/60 text-sm">{date}</time>
            <span className="text-white/60 text-sm">{readTime}</span>
          </div>

          {/* Title */}
          <h1 className="blog-post-title">{title}</h1>
        </header>

        {/* Content */}
        <div className="blog-post-content">
          {children}
        </div>

        {/* Footer CTA */}
        <footer className="blog-post-footer">
          <div className="blog-cta-box">
            <h3
              className="text-2xl font-bold mb-4 text-accent"
            >
              Ready to Build Fast?
            </h3>
            <p className="text-white/80 text-lg mb-6">
              Record your project idea. Get a proposal in 6 hours. See how fast we can ship your software.
            </p>
            <Link
              href="/get-started"
              className="
                inline-block px-8 py-4 rounded-lg font-bold text-white
                bg-accent
                hover:shadow-2xl hover:shadow-accent/50 hover:scale-105
                transition-all duration-300
              "
            >
              Start Your Project
            </Link>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/blog"
              className="text-white/60 hover:text-white transition-colors"
            >
              ← Back to all posts
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
}

/**
 * BlogSection Component - Wraps content sections
 */
export function BlogSection({ children }: { children: React.ReactNode }) {
  return <section className="blog-section">{children}</section>;
}

/**
 * BlogQuote Component - Highlighted quotes/callouts
 */
export function BlogQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="
      my-8 p-6 border-l-4 border-accent
      bg-accent/10
      rounded-r-lg
    ">
      <div className="text-white/90 text-lg italic">
        {children}
      </div>
    </blockquote>
  );
}

/**
 * BlogHighlight Component - Key takeaways
 */
export function BlogHighlight({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="
      my-8 p-6 rounded-lg
      bg-accent-2/10
      border border-accent-2/30
    ">
      {title && (
        <h4 className="text-accent-2 font-bold text-lg mb-3">
          {title}
        </h4>
      )}
      <div className="text-white/90">
        {children}
      </div>
    </div>
  );
}

/**
 * BlogWarning Component - Red flags / warnings
 */
export function BlogWarning({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="
      my-8 p-6 rounded-lg
      bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/10
      border border-red-500/30
    ">
      {title && (
        <h4 className="text-red-400 font-bold text-lg mb-3 flex items-center gap-2">
          <span className="text-2xl">⚠️</span> {title}
        </h4>
      )}
      <div className="text-white/90">
        {children}
      </div>
    </div>
  );
}
