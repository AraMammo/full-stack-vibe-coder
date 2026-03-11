/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable source maps in production to save memory
  productionBrowserSourceMaps: false,

  // Disable image optimization during build (can be re-enabled later if needed)
  images: {
    unoptimized: true,
  },

  // TypeScript and ESLint settings to reduce build memory
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
