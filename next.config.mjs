/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'maps.googleapis.com',
      'lh3.googleusercontent.com',
      'supabase.co',
      'zexuxpxqmwjvhmnpivvz.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || '',
    ],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SITE_URL: process.env.SITE_URL || 'https://famtriply.vercel.app',
  },
  // Allowing server-side rendering for proper CSS processing
  output: 'standalone',
  // Configuring image optimization for deployment
  experimental: {
    serverComponentsExternalPackages: ['sharp']
  }
}

export default nextConfig
