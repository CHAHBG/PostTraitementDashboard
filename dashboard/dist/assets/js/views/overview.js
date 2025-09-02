/**
 * Overview Tab
 * Implementation for the Executive Overview tab
 */

import { store } from '../services/store.js';

// Map instance
let overviewMap = null;
// Commune layer
let communeLayer = null;

export function initOverviewTab() {
  console.log('Initializing Overview tab...');
  
  // Initialize counters
  initCounters();
  
  // Initialize mini map
  initOverviewMap();
  
  // Load alerts
  loadAlerts();
  
  // Listen for tab changes to update map when tab becomes visible
  window.addEventListener('tabchange', (event) => {
    if (event.detail.tabId === 'overview' && overviewMap) {
      // Refresh map when tab becomes active
      setTimeout(() => {
        overviewMap.invalidateSize();
      }, 100);
    }
  });
}

/**
 * Initialize animated counters
 */
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'), 10);
    
    // Animate from 0 to target value
    animateCounter(counter, 0, target, 1500);
  });
}

/**
 * Animate counter from start to end value
 * @param {HTMLElement} element - Counter element
 * @param {number} start - Start value
 * @param {number} end - Target value
 * @param {number} duration - Animation duration in milliseconds
 */
function animateCounter(element, start, end, duration) {
  const range = end - start;
  const increment = end > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / range));
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    element.textContent = current.toLocaleString();
    
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      element.textContent = end.toLocaleString();
      clearInterval(timer);
    }
  }, stepTime);
}

/**
 * Initialize the mini map in the overview tab
 */
function initOverviewMap() {
  // Check if Leaflet is loaded
  if (!window.L) {
    console.error('Leaflet library not loaded');
    return;
  }
  
  // Create map instance
  overviewMap = L.map('overviewMap', {
    center: [14.5, -14.4],
    zoom: 7,
    zoomControl: false,
    attributionControl: false
  });
  
  // Add attribution control in a compact form
  L.control.attribution({
    prefix: false,
    position: 'bottomright'
  }).addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>').addTo(overviewMap);
  
  // Add zoom control in a different position
  L.control.zoom({
    position: 'topright'
  }).addTo(overviewMap);
  
  // Add tile layer (base map)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(overviewMap);
  
  // Load commune boundaries
  loadCommuneBoundaries();
  
  // Add theme change listener to update map styles
  window.addEventListener('themechange', updateMapTheme);
}

/**
 * Load commune boundaries on the mini map
 */
async function loadCommuneBoundaries() {
  try {
    const api = store.get('api');
    
    if (!api) {
      throw new Error('API service not available');
    }
    
    // Check if we already have communes data in the store
    const communes = store.get('communes');
    
    if (!communes) {
      throw new Error('Communes data not loaded');
    }
    
    // Fetch GeoJSON data
    const response = await fetch('geojson/communes/communes.geojson');
    const geojsonData = await response.json();
    
    // Create layer and add to map
    communeLayer = L.geoJSON(geojsonData, {
      style: getLayerStyle(),
      onEachFeature: (feature, layer) => {
        // Add tooltip
        if (feature.properties && feature.properties.CCRCA) {
          layer.bindTooltip(feature.properties.CCRCA, {
            permanent: false,
            direction: 'center',
            className: 'commune-tooltip'
          });
        }
      }
    }).addTo(overviewMap);
    
    // Fit map to bounds
    overviewMap.fitBounds(communeLayer.getBounds(), {
      padding: [20, 20]
    });
    
  } catch (error) {
    console.error('Error loading commune boundaries:', error);
    // Show error message in map container
    const mapContainer = document.getElementById('overviewMap');
    if (mapContainer) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'map-error';
      errorMsg.textContent = 'Failed to load commune boundaries';
      mapContainer.appendChild(errorMsg);
    }
  }
}

/**
 * Get layer style based on current theme
 * @returns {Object} Leaflet path style options
 */
function getLayerStyle() {
  const isDarkTheme = document.body.className === 'theme-dark';
  
  return {
    fillColor: isDarkTheme ? '#3498db' : '#2980b9',
    weight: 2,
    opacity: 1,
    color: isDarkTheme ? '#4a69bd' : '#3498db',
    fillOpacity: 0.3
  };
}

/**
 * Update map theme when theme changes
 */
function updateMapTheme() {
  if (communeLayer) {
    communeLayer.setStyle(getLayerStyle());
  }
}

/**
 * Load system alerts
 */
async function loadAlerts() {
  const alertsList = document.getElementById('alertsList');
  
  if (!alertsList) {
    return;
  }
  
  try {
    // Simulate loading alerts (in a real app, this would be an API call)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Sample alerts (in a real app, these would come from the API)
    const alerts = [
      { level: 'info', message: 'System successfully processed 245 new parcels' },
      { level: 'warning', message: '15 parcels missing commune information' },
      { level: 'error', message: 'Failed to synchronize with external database' },
      { level: 'info', message: 'Daily backup completed successfully' }
    ];
    
    // Clear loading message
    alertsList.innerHTML = '';
    
    // Add alerts to list
    alerts.forEach(alert => {
      const alertItem = document.createElement('li');
      alertItem.className = `alert-item alert-${alert.level}`;
      
      // Create icon based on level
      const icon = document.createElement('span');
      icon.className = 'alert-icon';
      icon.textContent = getAlertIcon(alert.level);
      
      // Create message element
      const message = document.createElement('span');
      message.className = 'alert-message';
      message.textContent = alert.message;
      
      // Add to alert item
      alertItem.appendChild(icon);
      alertItem.appendChild(message);
      
      // Add to list
      alertsList.appendChild(alertItem);
    });
    
  } catch (error) {
    console.error('Error loading alerts:', error);
    alertsList.innerHTML = '<li class="alert-item alert-error">Failed to load system alerts</li>';
  }
}

/**
 * Get icon for alert level
 * @param {string} level - Alert level (info, warning, error)
 * @returns {string} Icon character
 */
function getAlertIcon(level) {
  switch (level) {
    case 'info':
      return 'ℹ️';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    default:
      return '•';
  }
}
