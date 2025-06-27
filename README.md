# FamTriply - Family Trip Planning App

FamTriply is a comprehensive family trip planning application built with Next.js and Supabase. It helps families plan their trips together, with features for itinerary management, expense tracking, photo sharing, and more.

## Quick Deployment Guide

### Option 1: Deploy to Vercel (Recommended)

1. **Fork or clone this repository**

2. **Run the setup script**
   ```bash
   # For Windows
   setup-deploy.bat
   
   # For Mac/Linux
   bash setup-deploy.sh
   ```

3. **Deploy to Vercel**
   ```bash
   npx vercel
   ```
   
   Or, if you have Vercel CLI installed:
   ```bash
   vercel
   ```
   
   For production deployment:
   ```bash
   npm run deploy:vercel
   ```

4. **Add environment variables in Vercel dashboard**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `SITE_URL` (your site URL, e.g., https://famtriply.vercel.app)

1. **Fork or clone this repository**

2. **Run the setup script**
   ```bash
   # For Windows
   setup-deploy.bat
   
   # For Mac/Linux
   bash setup-deploy.sh
   ```

3. **Deploy to Netlify**
   ```bash
   npm run deploy:netlify
   ```

4. **Add environment variables in Netlify dashboard**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
