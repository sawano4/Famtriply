#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🛠️ Running dependency fix script...');

try {
  // Install npm-force-resolutions globally if it doesn't exist
  try {
    execSync('npx npm-force-resolutions --version', { stdio: 'ignore' });
  } catch (e) {
    console.log('📦 Installing npm-force-resolutions...');
    execSync('npm install -g npm-force-resolutions');
  }

  // Force resolution of vulnerable packages
  console.log('🔒 Fixing vulnerable dependencies...');
  execSync('npx npm-force-resolutions', { stdio: 'inherit' });
  
  // Check if we have a package-lock.json file
  const packageLockPath = path.join(__dirname, 'package-lock.json');
  if (fs.existsSync(packageLockPath)) {
    console.log('📋 package-lock.json exists, running npm ci for faster install...');
    try {
      execSync('npm ci --legacy-peer-deps --no-audit', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️ npm ci failed, falling back to npm install...');
      // Clean install
      console.log('🧹 Cleaning node_modules...');
      try {
        // Use the appropriate command based on the platform
        if (process.platform === 'win32') {
          execSync('if exist node_modules rmdir /s /q node_modules', { stdio: 'inherit' });
        } else {
          execSync('rm -rf node_modules', { stdio: 'inherit' });
        }
      } catch (e) {
        console.log('⚠️ Could not remove node_modules folder, continuing anyway...');
      }
      
      console.log('📦 Reinstalling dependencies...');
      execSync('npm install --legacy-peer-deps --no-audit', { stdio: 'inherit' });
    }
  } else {
    // Clean install
    console.log('🧹 Cleaning node_modules...');
    try {
      // Use the appropriate command based on the platform
      if (process.platform === 'win32') {
        execSync('if exist node_modules rmdir /s /q node_modules', { stdio: 'inherit' });
      } else {
        execSync('rm -rf node_modules', { stdio: 'inherit' });
      }
    } catch (e) {
      console.log('⚠️ Could not remove node_modules folder, continuing anyway...');
    }
    
    console.log('📦 Reinstalling dependencies...');
    execSync('npm install --legacy-peer-deps --no-audit --force', { stdio: 'inherit' });
  }
  
  console.log('✅ Dependencies successfully updated and vulnerabilities fixed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run "npm run build" to test your application');
  console.log('2. Deploy to Netlify or Vercel');
} catch (error) {
  console.error('❌ Error fixing dependencies:', error.message);
  process.exit(1);
}
