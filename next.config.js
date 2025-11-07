/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 13+
  
  // Reduce memory usage during builds
  experimental: {
    // Reduce memory usage by disabling certain optimizations
    workerThreads: false,
    cpus: 1,
  },
  
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,
  
  // Optimize for production builds with lower memory usage
  swcMinify: true,
  
  // Disable image optimization during build (can be re-enabled later if needed)
  images: {
    unoptimized: true,
  },
  
  // TypeScript and ESLint settings to reduce build memory
  typescript: {
    // Skip type checking during build (we'll rely on CI/CD for this)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
