#!/usr/bin/env node

/**
 * Pre-deployment check script
 * This script verifies if all required dependencies are installed correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if we're running the correct Node.js version
console.log('🔍 Checking Node.js version...');
try {
  const nodeVersion = process.version;
  console.log(`Node.js version: ${nodeVersion}`);
  
  // Extract major version number
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0], 10);
  
  if (majorVersion < 18) {
    console.warn('⚠️ Warning: Node.js version is below 18. Some features may not work correctly.');
  } else {
    console.log('✅ Node.js version is compatible.');
  }
} catch (error) {
  console.error('❌ Error checking Node.js version:', error.message);
}

// Check if .env.production exists
console.log('\n🔍 Checking environment variables...');
const envPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.production file exists.');
  
  // Check if required environment variables are set
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'SITE_URL'
  ];
  
  const missingVars = [];
  for (const varName of requiredVars) {
    if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=`)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ The following environment variables may be missing or empty in .env.production: ${missingVars.join(', ')}`);
  } else {
    console.log('✅ All required environment variables are present in .env.production.');
  }
} else {
  console.warn('⚠️ No .env.production file found. Make sure to set environment variables in your deployment platform.');
}

// Check for required dependencies
console.log('\n🔍 Checking required dependencies...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = [
    '@supabase/ssr',
    '@supabase/supabase-js',
    'next',
    'react',
    'react-dom',
    'next-sitemap'
  ];
  
  const missingDeps = [];
  for (const dep of requiredDeps) {
    if (!packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  }
  
  if (missingDeps.length > 0) {
    console.warn(`⚠️ The following dependencies may be missing: ${missingDeps.join(', ')}`);
  } else {
    console.log('✅ All required dependencies are present in package.json.');
  }
} else {
  console.error('❌ package.json not found!');
}

console.log('\n🏁 Pre-deployment check completed.');
console.log('Note: If there are any warnings, address them before deploying to ensure a successful deployment.');
