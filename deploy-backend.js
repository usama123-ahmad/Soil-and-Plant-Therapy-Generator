#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Plant Therapy Report Generator - Backend Deployment Helper\n');

console.log('📋 Current Status:');
console.log('✅ Frontend: Ready for Vercel deployment');
console.log('❌ Backend: Needs separate deployment\n');

console.log('🔧 Solution: Deploy backend to Railway or Render\n');

console.log('📁 Files created for deployment:');
console.log('  ✅ backend/Procfile');
console.log('  ✅ backend/runtime.txt');
console.log('  ✅ src/config/api.ts');
console.log('  ✅ env.example');
console.log('  ✅ DEPLOYMENT_GUIDE.md\n');

console.log('🚀 Next Steps:');
console.log('1. Deploy backend to Railway:');
console.log('   - Go to https://railway.app');
console.log('   - Create new project from GitHub');
console.log('   - Set source directory to "backend"');
console.log('   - Get your deployment URL\n');

console.log('2. Update Vercel environment variables:');
console.log('   - Add REACT_APP_API_URL = your-backend-url\n');

console.log('3. Redeploy frontend to Vercel\n');

console.log('📖 For detailed instructions, see DEPLOYMENT_GUIDE.md\n');

// Check if backend folder exists
if (!fs.existsSync(path.join(__dirname, 'backend'))) {
  console.log('❌ Error: backend folder not found!');
  console.log('   Make sure you have the backend folder in your project root.');
  process.exit(1);
}

// Check if required files exist
const requiredFiles = [
  'backend/app.py',
  'backend/requirements.txt',
  'backend/Procfile',
  'backend/runtime.txt'
];

console.log('🔍 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING!`);
  }
});

console.log('\n🎯 Ready to deploy! Follow the steps above.');
