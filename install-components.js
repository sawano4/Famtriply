#!/usr/bin/env node

/**
 * Component installer script
 * This script installs all required shadcn/ui components
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const components = [
  'alert',
  'badge',
  'button',
  'card',
  'dialog',
  'dropdown-menu',
  'input',
  'label',
  'progress',
  'scroll-area',
  'select',
  'tabs',
  'textarea',
  'toast',
  'popover'
];

console.log('🧩 Installing UI components...');

// Check if components/ui directory exists
const uiDir = path.join(__dirname, 'components', 'ui');
if (!fs.existsSync(uiDir)) {
  console.log('📁 Creating UI components directory...');
  fs.mkdirSync(uiDir, { recursive: true });
}

// Install each component
components.forEach(component => {
  try {
    console.log(`Installing ${component}...`);
    
    // Check if component file already exists
    const componentPath = path.join(uiDir, `${component}.tsx`);
    if (fs.existsSync(componentPath)) {
      console.log(`✅ ${component} already exists, skipping...`);
      return;
    }
    
    // Install the component
    execSync(`npx shadcn-ui@latest add ${component} --yes`, { 
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8'
    });
    console.log(`✅ Installed ${component}`);
  } catch (error) {
    console.error(`❌ Failed to install ${component}:`, error.message);
  }
});

console.log('🎉 Finished installing UI components!');
