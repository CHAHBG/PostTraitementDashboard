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

// Paths outside the dashboard folder (project root)
const projectRoot = path.resolve(sourceDir, '..');

const directories = [
  'assets'
];

// Vendor libraries to copy from node_modules into dist/lib
const vendorLibs = [
  { src: path.join(sourceDir, 'node_modules', 'leaflet', 'dist'), dest: path.join(distDir, 'lib', 'leaflet') },
  { src: path.join(sourceDir, 'node_modules', 'd3', 'dist'), dest: path.join(distDir, 'lib', 'd3') },
  { src: path.join(sourceDir, 'node_modules', 'chart.js', 'dist'), dest: path.join(distDir, 'lib', 'chart.js') },
  { src: path.join(sourceDir, 'node_modules', 'leaflet.markercluster', 'dist'), dest: path.join(distDir, 'lib', 'leaflet.markercluster') }
];

// Data and geojson live at project root; copy them explicitly
const externalDirs = [
  { src: path.join(projectRoot, 'geojson'), dest: path.join(distDir, 'geojson') },
  { src: path.join(projectRoot, 'data'), dest: path.join(distDir, 'data') }
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

// Copy external project directories (geojson, data)
externalDirs.forEach(d => {
  copyDirectory(d.src, d.dest);
  console.log(`Copied ${d.src} -> ${d.dest}`);
});

// Copy vendor libraries from node_modules into dist/lib
vendorLibs.forEach(lib => {
  if (fs.existsSync(lib.src)) {
    copyDirectory(lib.src, lib.dest);
    console.log(`Copied vendor lib ${lib.src} -> ${lib.dest}`);
  } else {
    console.log(`Vendor lib not found: ${lib.src} - skipping`);
  }
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
