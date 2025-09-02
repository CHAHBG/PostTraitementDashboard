/**
 * Deployment Script for Netlify
 * 
 * This script prepares the dashboard for deployment to Netlify:
 * 1. Copies all necessary files to a dist directory
 * 2. Creates a Netlify configuration file (netlify.toml)
 * 3. Sets up redirects for SPA routing
 */

const fs = require('fs');
const path = require('path');

// Configuration
const sourceDir = path.resolve(__dirname, '..');
const distDir = path.resolve(sourceDir, 'dist');
const directories = [
  'assets',
  'geojson',
  'data'
];

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log(`Created ${distDir}`);
}

// Copy index.html to dist
fs.copyFileSync(
  path.join(sourceDir, 'index.html'),
  path.join(distDir, 'index.html')
);
console.log('Copied index.html to dist');

// Copy directories recursively
directories.forEach(dir => {
  copyDirectory(
    path.join(sourceDir, dir),
    path.join(distDir, dir)
  );
  console.log(`Copied ${dir} directory to dist`);
});

// Create netlify.toml
const netlifyConfig = `
# Netlify Configuration File

# Set cache headers for static assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Set cache headers for data files
[[headers]]
  for = "/data/*"
  [headers.values]
    Cache-Control = "public, max-age=3600"

# Set cache headers for geojson files
[[headers]]
  for = "/geojson/*"
  [headers.values]
    Cache-Control = "public, max-age=86400"

# Handle SPA routing - direct all requests to index.html
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;

fs.writeFileSync(
  path.join(distDir, 'netlify.toml'),
  netlifyConfig.trim()
);
console.log('Created netlify.toml configuration file');

// Create a _redirects file for Netlify
const redirects = `
# Netlify _redirects file
/*    /index.html   200
`;

fs.writeFileSync(
  path.join(distDir, '_redirects'),
  redirects.trim()
);
console.log('Created _redirects file for SPA routing');

console.log('\nBuild complete! The dist/ directory is ready for deployment to Netlify.');
console.log('Next steps:');
console.log('1. Upload the dist/ directory to GitHub');
console.log('2. Connect the GitHub repository to Netlify');
console.log('3. Set the publish directory to "dist" in the Netlify settings');

// Utility function to copy a directory recursively
function copyDirectory(source, destination) {
  // Check if source directory exists
  if (!fs.existsSync(source)) {
    console.log(`Directory does not exist: ${source} - skipping`);
    return;
  }
  
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Get all files and directories in source
  const items = fs.readdirSync(source);

  // Copy each item to destination
  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    
    // Check if item is a directory
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      // Copy file
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}
