'use client';

import Link from 'next/link';
import { useState } from 'react';
import { allBlogPosts, getBlogPosts, getAllCategories } from '@/lib/blog/blog-posts';
import { categoryColors, type BlogCategory } from '@/lib/blog/blog-config';

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categories = ['all', ...getAllCategories()];
  const posts = selectedCategory === 'all' ? allBlogPosts : getBlogPosts(selectedCategory);

  return (
    <main className="blog-page">
      <div className="blog-container">
        <header className="blog-header">
          <h1 className="blog-title">Blog</h1>
          <p className="blog-subtitle">
            No BS. Real results. Hard lessons. I got scammed so you don't have to.
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mt-8 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  px-6 py-2 rounded-full font-medium transition-all duration-300
                  border-2 backdrop-blur-xl
                  ${selectedCategory === category
                    ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white border-transparent shadow-lg shadow-pink-500/50'
                    : 'bg-black/40 text-white/80 border-white/20 hover:border-pink-500/50 hover:text-white'
                  }
                `}
              >
                {category === 'all' ? 'All Posts' : category}
              </button>
            ))}
          </div>
        </header>

        {/* Posts Grid */}
        <div className="blog-grid">
          {posts.map((post) => (
            <article key={post.slug} className="blog-card group">
              {/* Category Badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`
                    px-4 py-1.5 rounded-full text-sm font-semibold
                    bg-gradient-to-r ${categoryColors[post.category as BlogCategory]}
                    text-white shadow-lg
                  `}
                >
                  {post.category}
                </span>
                <time className="blog-card-date">{post.date}</time>
              </div>

              {/* Title */}
              <h2 className="blog-card-title">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-cyan-500 group-hover:bg-clip-text group-hover:text-transparent transition-all"
                >
                  {post.title}
                </Link>
              </h2>

              {/* Excerpt */}
              <p className="blog-card-excerpt">{post.excerpt}</p>

              {/* Footer */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                <span className="text-white/60 text-sm font-medium">{post.readTime}</span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="
                    text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500
                    font-semibold text-sm
                    group-hover:from-cyan-400 group-hover:to-pink-400
                    transition-all duration-300
                  "
                >
                  Read Article →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/60 text-lg">No posts in this category yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
