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
  },
  // Add output: 'standalone' for better serverless deployment
  output: 'standalone',
}

export default nextConfig
