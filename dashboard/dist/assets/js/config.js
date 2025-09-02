/**
 * Configuration file for the dashboard
 * Automatically switches between development and production settings
 */

// Detect environment based on hostname
const isDevelopment = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

// Configuration settings
export const config = {
  // In development, use local API server
  // In production, use relative paths for direct file access
  api: {
    baseUrl: isDevelopment ? 'http://localhost:3001/api' : '',
    useDirectFileAccess: !isDevelopment
  },
  
  // Paths for data files (used in production mode)
  paths: {
    communes: 'geojson/communes/communes.geojson',
    communeData: 'data/communes_data.json',
    individualParcels: 'geojson/parcels/individual_parcels.geojson',
    collectiveParcels: 'geojson/parcels/collective_parcels.geojson',
    unjoinedParcels: 'geojson/parcels/unjoined_parcels.geojson',
    dashboardData: 'data/dashboard_data_complete.json',
    dashboardKpis: 'data/dashboard_kpis.json'
  },
  
  // Feature flags
  features: {
    enableAnimations: true,
    enableRealTimeUpdates: isDevelopment,
    debugMode: isDevelopment
  }
};
