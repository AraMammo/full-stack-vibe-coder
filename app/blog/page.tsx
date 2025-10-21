import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Blog | FullStackVibeCoder - Vibe Coding Insights",
  description: "Learn about vibe coding, AI-powered development, and building software faster. Real insights from Ara on the future of software development.",
  keywords: "vibe coding blog, AI development, software development 2025, coding with AI",
  alternates: {
    canonical: "https://fullstackvibecoder.com/blog"
  }
};

export default function BlogPage() {
  const posts = [
    {
      slug: 'what-is-vibe-coding',
      title: 'What is Vibe Coding: Complete Guide for 2025',
      excerpt: 'Deep dive into vibe coding - how AI is transforming software development and why every developer needs to adapt now.',
      date: 'October 21, 2025',
      readTime: '8 min read',
      category: 'Fundamentals'
    }
  ];

  return (
    <main className="blog-page">
      <div className="blog-container">
        <header className="blog-header">
          <h1 className="blog-title">Blog</h1>
          <p className="blog-subtitle">
            Real insights on building software faster with AI. No fluff. No corporate speak.
          </p>
        </header>

        <div className="blog-grid">
          {posts.map((post) => (
            <article key={post.slug} className="blog-card">
              <div className="blog-card-meta">
                <span className="blog-category">{post.category}</span>
                <span className="blog-date">{post.date}</span>
              </div>
              
              <h2 className="blog-card-title">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>
              
              <p className="blog-card-excerpt">{post.excerpt}</p>
              
              <div className="blog-card-footer">
                <span className="blog-read-time">{post.readTime}</span>
                <Link href={`/blog/${post.slug}`} className="blog-read-more">
                  Read Article →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
