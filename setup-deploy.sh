#!/bin/bash

# Setup script to prepare the project for deployment

# Make scripts executable
chmod +x check-deployment.js
chmod +x fix-dependencies.js

# Install node modules with correct flags
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Add missing shadcn components if any
echo "🧩 Installing shadcn/ui components..."
npx shadcn-ui@latest add card --yes
npx shadcn-ui@latest add button --yes
npx shadcn-ui@latest add alert --yes
npx shadcn-ui@latest add dialog --yes
npx shadcn-ui@latest add toast --yes
npx shadcn-ui@latest add tabs --yes
npx shadcn-ui@latest add select --yes
npx shadcn-ui@latest add dropdown-menu --yes
npx shadcn-ui@latest add popover --yes
npx shadcn-ui@latest add label --yes
npx shadcn-ui@latest add scroll-area --yes
npx shadcn-ui@latest add input --yes
npx shadcn-ui@latest add textarea --yes
npx shadcn-ui@latest add progress --yes
npx shadcn-ui@latest add badge --yes

# Build the project
echo "🏗️ Building the project..."
npm run build

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."
node check-deployment.js

echo "✅ Project is ready for deployment!"
echo ""
echo "To deploy to Vercel, run: npm run deploy:vercel"
echo "To deploy to Netlify, run: npm run deploy:netlify"
