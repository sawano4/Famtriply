# FamTriply Deployment Guide

## Components used by this project

### UI Framework
- React 18
- Next.js 14

### UI Components
- shadcn/ui (Tailwind-based components)
- Lucide React (Icons)
- date-fns (Date formatting)

### Backend
- Supabase (Authentication, Database, Storage)
- Next.js API Routes

### Map Integration
- Google Maps JavaScript API

## Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your Google Maps API key with Places API enabled
- `SITE_URL`: Your deployed site URL (e.g., https://famtriply.vercel.app)

## Deployment Instructions

### Prerequisites
1. Node.js 18+ installed
2. npm 9+ installed
3. Supabase account and project set up
4. Google Maps API key with Places API enabled

### Option 1: Vercel Deployment (Recommended)

1. **Prepare your repository**
   ```bash
   # Clone the repository
   git clone <your-repo-url>
   cd famtriply
   
   # Run the setup script
   # For Windows
   setup-deploy.bat
   
   # For Mac/Linux
   bash setup-deploy.sh
   ```

2. **Deploy to Vercel**
   ```bash
   # If you have Vercel CLI installed
   npm run deploy:vercel
   
   # Or using npx
   npx vercel --prod
   ```

3. **Configure environment variables in Vercel dashboard**
   - Go to your project in the Vercel dashboard
   - Navigate to Settings > Environment Variables
   - Add all required environment variables
   - Redeploy your application to apply the changes

### Option 2: Netlify Deployment

1. **Prepare your repository**
   ```bash
   # Clone the repository
   git clone <your-repo-url>
   cd famtriply
   
   # Run the setup script
   # For Windows
   setup-deploy.bat
   
   # For Mac/Linux
   bash setup-deploy.sh
   ```

2. **Deploy to Netlify**
   ```bash
   # If you have Netlify CLI installed
   npm run deploy:netlify
   
   # Or using npx
   npx netlify deploy --prod
   ```

3. **Configure environment variables in Netlify dashboard**
   - Go to your project in the Netlify dashboard
   - Navigate to Site settings > Environment variables
   - Add all required environment variables
   - Redeploy your application to apply the changes

### Local Development

1. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Create environment file**
   - Copy `.env.example` to `.env.local`
   - Fill in your environment variables

3. **Run development server**
   ```bash
   npm run dev
   ```

## Troubleshooting

### Deployment Issues
- **Build failures**: Run `npm run check-deploy` to diagnose issues
- **Missing dependencies**: Ensure you've run the setup script
- **Authentication issues**: Verify Supabase URL and anon key
- **Google Maps errors**: Check if your API key has Places API enabled

### Environment Variables
- Make sure all required variables are set in your deployment platform
- Double-check for typos in environment variable names

## Notes
- The project uses `output: 'standalone'` in Next.js config for better serverless deployment
- Supabase authentication is implemented using the new `@supabase/ssr` package
- The `fix-dependencies.js` script helps resolve any dependency conflicts

## Deployment Checklist

Before deploying, ensure:
- [ ] All dependencies are installed (`npm install --legacy-peer-deps`)
- [ ] Environment variables are properly set
- [ ] Build completes successfully locally (`npm run build`)
- [ ] Pre-deployment checks pass (`npm run check-deploy`)
- [ ] Google Maps API key has Places API enabled
- [ ] Supabase project is properly configured
