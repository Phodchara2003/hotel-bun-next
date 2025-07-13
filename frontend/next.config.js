/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  images: {
    domains: ['example.com', 'images.unsplash.com', 'via.placeholder.com'],
  },
}

module.exports = nextConfig
