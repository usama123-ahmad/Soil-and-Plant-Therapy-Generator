const { execSync } = require('child_process');

console.log('🚀 Starting deployment process...');

try {
  
  // Build the project
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Go to https://vercel.com');
  console.log('2. Sign in with your GitHub account');
  console.log('3. Click "New Project"');
  console.log('4. Import repository: franzhentze92/Plant-Therapy-Report-Generator');
  console.log('5. Configure settings:');
  console.log('   - Framework: Vite');
  console.log('   - Root Directory: ./');
  console.log('   - Build Command: npm run build');
  console.log('   - Output Directory: dist');
  console.log('6. Click "Deploy"');
  console.log('');
  console.log('🌐 Your app will be deployed to a URL like: https://plant-therapy-report-generator.vercel.app');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
} 