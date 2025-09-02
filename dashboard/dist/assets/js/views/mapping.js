/**
 * Interactive Mapping Tab
 * Implementation for the mapping functionality
 */

import { store } from '../services/store.js';

// Map instance and layers
let mainMap = null;
let communeLayer = null;
let parcelLayer = null;
let selectedParcel = null;
let parcelClusterLayer = null;

// Controls
let layerControl = null;

export function initMappingTab() {
  console.log('Initializing Mapping tab...');
  
  // Initialize map when tab is first shown
  window.addEventListener('tabchange', (event) => {
    if (event.detail.tabId === 'mapping') {
      // Initialize map if not already done
      if (!mainMap) {
        initMap();
      } else {
        // Refresh map when tab becomes active
        setTimeout(() => {
          mainMap.invalidateSize();
        }, 100);
      }
    }
  });
  
  // Setup layer toggle controls
  setupLayerToggles();
  
  // Setup search functionality
  setupSearch();
}

/**
 * Initialize the main map
 */
function initMap() {
  // Check if Leaflet is loaded
  if (!window.L) {
    console.error('Leaflet library not loaded');
    return;
  }
  
  // Create map instance
  mainMap = L.map('mainMap', {
    center: [14.5, -14.4],
    zoom: 7,
    zoomControl: true,
    attributionControl: true
  });
  
  // Add tile layer (base map)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(mainMap);
  
  // Add scale control
  L.control.scale({
    imperial: false,
    position: 'bottomleft'
  }).addTo(mainMap);
  
  // Load layers
  loadCommuneLayer();
  loadParcelLayer();
  
  // Add theme change listener to update map styles
  window.addEventListener('themechange', updateMapTheme);
}

/**
 * Load commune boundaries layer
 */
async function loadCommuneLayer() {
  try {
    // Fetch GeoJSON data
    const response = await fetch('geojson/communes/communes.geojson');
    const geojsonData = await response.json();
    
    // Create layer and add to map
    communeLayer = L.geoJSON(geojsonData, {
      style: getCommuneLayerStyle(),
      onEachFeature: (feature, layer) => {
        // Add popup
        if (feature.properties && feature.properties.CCRCA) {
          const communeName = feature.properties.CCRCA;
          const popupContent = `
            <div class="map-popup">
              <h3>${communeName}</h3>
              <button class="btn btn-small" data-action="zoom-commune" data-commune="${communeName}">Zoom to Commune</button>
            </div>
          `;
          
          layer.bindPopup(popupContent);
          
          // Add tooltip
          layer.bindTooltip(communeName, {
            permanent: false,
            direction: 'center',
            className: 'commune-tooltip'
          });
          
          // Store layer reference for lookup
          if (!store.get('communeLayers')) {
            store.register('communeLayers', {});
          }
          store.get('communeLayers')[communeName] = layer;
        }
      }
    }).addTo(mainMap);
    
    // Register click handlers for popup buttons
    mainMap.on('popupopen', function(e) {
      const zoomButtons = document.querySelectorAll('[data-action="zoom-commune"]');
      
      zoomButtons.forEach(button => {
        button.addEventListener('click', function() {
          const communeName = this.getAttribute('data-commune');
          zoomToCommune(communeName);
        });
      });
    });
    
    // Update layer control
    updateLayerControl();
    
  } catch (error) {
    console.error('Error loading commune boundaries:', error);
    showMapError('Failed to load commune boundaries');
  }
}

/**
 * Load parcel layer with clustering
 */
async function loadParcelLayer() {
  try {
    // Create cluster group for better performance with many parcels
    parcelClusterLayer = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true
    });
    
    // Try to load individual parcels first
    const parcelFiles = [
      'geojson/parcels/individual_parcels.normalized.source_commune.geojson',
      'geojson/parcels/collective_parcels.normalized.source_commune.geojson'
    ];
    
    let totalParcels = 0;
    
    for (const filePath of parcelFiles) {
      try {
        const response = await fetch(filePath);
        const geojsonData = await response.json();
        
        // Create a layer but don't add directly to map - add to cluster
        parcelLayer = L.geoJSON(geojsonData, {
          style: getParcelLayerStyle(),
          onEachFeature: (feature, layer) => {
            // Add click handler
            layer.on('click', function(e) {
              handleParcelClick(feature, layer, e);
              L.DomEvent.stopPropagation(e);
            });
            
            // Add properties for search
            if (feature.properties) {
              const parcelId = getParcelId(feature.properties);
              if (parcelId) {
                layer.parcelId = parcelId;
              }
            }
          },
          pointToLayer: function(feature, latlng) {
            // For point features, create a circle marker
            return L.circleMarker(latlng, {
              radius: 5,
              fillColor: "#ff7800",
              color: "#000",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            });
          }
        });
        
        // Add to cluster layer
        parcelClusterLayer.addLayer(parcelLayer);
        totalParcels += geojsonData.features.length;
        
        // Only load max 5000 parcels for performance
        if (totalParcels > 5000) {
          break;
        }
      } catch (err) {
        console.warn(`Could not load parcel file ${filePath}:`, err);
      }
    }
    
    // Add cluster layer to map
    mainMap.addLayer(parcelClusterLayer);
    
    // Update layer control
    updateLayerControl();
    
  } catch (error) {
    console.error('Error loading parcels:', error);
    showMapError('Failed to load parcels');
  }
}

/**
 * Handle parcel click
 * @param {Object} feature - GeoJSON feature
 * @param {L.Layer} layer - Leaflet layer
 * @param {Object} event - Click event
 */
function handleParcelClick(feature, layer, event) {
  // Clear previous selection
  if (selectedParcel) {
    selectedParcel.setStyle(getParcelLayerStyle());
  }
  
  // Set new selection
  selectedParcel = layer;
  layer.setStyle({
    color: "#ff0000",
    weight: 3,
    opacity: 1
  });
  
  // Populate info panel
  updateParcelInfoPanel(feature.properties);
}

/**
 * Update parcel information panel
 * @param {Object} properties - Parcel properties
 */
function updateParcelInfoPanel(properties) {
  const infoPanel = document.getElementById('parcelInfo');
  
  if (!infoPanel) {
    return;
  }
  
  const parcelId = getParcelId(properties);
  const commune = properties.commune || properties.CCRCA || 'Unknown';
  
  // Format properties for display
  const html = `
    <div class="parcel-info">
      <h4>Parcel ID: ${parcelId || 'N/A'}</h4>
      <div class="info-row">
        <span class="info-label">Commune:</span>
        <span class="info-value">${commune}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Surface:</span>
        <span class="info-value">${properties.surface || properties.Surface || 'N/A'} ha</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type:</span>
        <span class="info-value">${properties.type || properties.Type || 'N/A'}</span>
      </div>
      <div class="property-list">
        <h5>All Properties:</h5>
        <div class="property-container">
          ${formatProperties(properties)}
        </div>
      </div>
      <button id="apiLookupBtn" class="btn" data-id="${parcelId || ''}">
        Look up in API
      </button>
    </div>
  `;
  
  infoPanel.innerHTML = html;
  
  // Add event listener to API lookup button
  const lookupBtn = document.getElementById('apiLookupBtn');
  if (lookupBtn && parcelId) {
    lookupBtn.addEventListener('click', () => lookupParcelInApi(parcelId));
  }
}

/**
 * Format all properties for display
 * @param {Object} properties - Object containing all properties
 * @returns {string} HTML representation of properties
 */
function formatProperties(properties) {
  return Object.entries(properties)
    .filter(([key]) => !['geometry', 'shape', 'bbox'].includes(key))
    .map(([key, value]) => {
      // Format the value based on type
      let displayValue = value;
      
      if (typeof value === 'object' && value !== null) {
        displayValue = JSON.stringify(value);
      }
      
      return `
        <div class="property-item">
          <span class="property-key">${key}:</span>
          <span class="property-value">${displayValue}</span>
        </div>
      `;
    })
    .join('');
}

/**
 * Look up parcel details in API
 * @param {string} parcelId - Parcel identifier
 */
async function lookupParcelInApi(parcelId) {
  const infoPanel = document.getElementById('parcelInfo');
  
  if (!infoPanel) {
    return;
  }
  
  try {
    infoPanel.innerHTML = '<div class="loading">Loading parcel data...</div>';
    
    const api = store.get('api');
    
    if (!api) {
      throw new Error('API service not available');
    }
    
    const response = await api.get(`/parcels/${parcelId}`);
    
    if (!response.success) {
      throw new Error(`API Error: ${response.error || 'Failed to lookup parcel'}`);
    }
    
    // Update panel with API data
    const parcel = response.parcel;
    
    const html = `
      <div class="parcel-info">
        <h4>Parcel ID: ${parcelId}</h4>
        <div class="api-data">
          <div class="info-row">
            <span class="info-label">Commune:</span>
            <span class="info-value">${parcel.commune || 'Unknown'}</span>
          </div>
          <h5>API Data:</h5>
          <div class="property-container">
            ${formatProperties(parcel.properties || {})}
          </div>
        </div>
      </div>
    `;
    
    infoPanel.innerHTML = html;
    
  } catch (error) {
    console.error('Error looking up parcel:', error);
    infoPanel.innerHTML = `
      <div class="error-message">
        Failed to load parcel data: ${error.message}
      </div>
      <button class="btn" onclick="window.history.back()">Back</button>
    `;
  }
}

/**
 * Get parcel ID from properties
 * @param {Object} properties - Feature properties
 * @returns {string|null} Parcel ID or null if not found
 */
function getParcelId(properties) {
  const idFields = [
    'Num_parcel', 'NUM_PARCEL', 'num_parcel', 
    'numParcel', 'num', 'ID', 'id', 'Id_parcel', 'IDPARCEL'
  ];
  
  for (const field of idFields) {
    if (properties[field]) {
      return String(properties[field]);
    }
  }
  
  return null;
}

/**
 * Get style for commune layer based on current theme
 * @returns {Object} Leaflet path style options
 */
function getCommuneLayerStyle() {
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
 * Get style for parcel layer based on current theme
 * @returns {Object} Leaflet path style options
 */
function getParcelLayerStyle() {
  const isDarkTheme = document.body.className === 'theme-dark';
  
  return {
    fillColor: isDarkTheme ? '#e74c3c' : '#e74c3c',
    weight: 1,
    opacity: 1,
    color: isDarkTheme ? '#c0392b' : '#c0392b',
    fillOpacity: 0.5
  };
}

/**
 * Update map theme when theme changes
 */
function updateMapTheme() {
  if (communeLayer) {
    communeLayer.setStyle(getCommuneLayerStyle());
  }
  
  if (parcelLayer) {
    parcelLayer.setStyle(getParcelLayerStyle());
  }
}

/**
 * Set up layer toggle controls
 */
function setupLayerToggles() {
  const communeToggle = document.getElementById('communeLayer');
  const parcelToggle = document.getElementById('parcelLayer');
  
  if (communeToggle) {
    communeToggle.addEventListener('change', function() {
      if (communeLayer) {
        if (this.checked) {
          mainMap.addLayer(communeLayer);
        } else {
          mainMap.removeLayer(communeLayer);
        }
      }
    });
  }
  
  if (parcelToggle) {
    parcelToggle.addEventListener('change', function() {
      if (parcelClusterLayer) {
        if (this.checked) {
          mainMap.addLayer(parcelClusterLayer);
        } else {
          mainMap.removeLayer(parcelClusterLayer);
        }
      }
    });
  }
}

/**
 * Update layer control
 */
function updateLayerControl() {
  if (!mainMap) return;
  
  // Remove existing control
  if (layerControl) {
    layerControl.remove();
  }
  
  // Create overlay layers object
  const overlays = {};
  
  if (communeLayer) {
    overlays['Communes'] = communeLayer;
  }
  
  if (parcelClusterLayer) {
    overlays['Parcels'] = parcelClusterLayer;
  }
  
  // Create control and add to map
  layerControl = L.control.layers(null, overlays, {
    position: 'topright',
    collapsed: false
  }).addTo(mainMap);
}

/**
 * Zoom to a specific commune
 * @param {string} communeName - Name of commune to zoom to
 */
function zoomToCommune(communeName) {
  const communeLayers = store.get('communeLayers');
  
  if (communeLayers && communeLayers[communeName]) {
    const layer = communeLayers[communeName];
    mainMap.fitBounds(layer.getBounds());
  } else {
    console.warn(`Commune layer for ${communeName} not found`);
  }
}

/**
 * Set up parcel search functionality
 */
function setupSearch() {
  const searchInput = document.getElementById('parcelSearch');
  const searchButton = document.getElementById('searchBtn');
  
  if (!searchInput || !searchButton) {
    return;
  }
  
  // Load Fuse.js for fuzzy search if available
  const useFuzzySearch = typeof Fuse !== 'undefined';
  
  searchButton.addEventListener('click', () => {
    const searchValue = searchInput.value.trim();
    if (!searchValue) return;
    
    searchParcel(searchValue);
  });
  
  // Search on enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchButton.click();
    }
  });
}

/**
 * Search for a parcel
 * @param {string} searchTerm - Search term
 */
async function searchParcel(searchTerm) {
  try {
    const api = store.get('api');
    
    if (!api) {
      throw new Error('API service not available');
    }
    
    // Search via API
    const response = await api.get(`/parcels/${searchTerm}`);
    
    if (!response.success) {
      throw new Error(`Parcel not found: ${searchTerm}`);
    }
    
    // Update info panel with result
    updateParcelInfoPanel(response.parcel.properties);
    
    // Highlight on map if possible
    // This would require looking up the geometry, which may not be available in the API response
    // You'd need to implement a lookup mechanism to find the layer by ID
    
  } catch (error) {
    console.error('Error searching for parcel:', error);
    const infoPanel = document.getElementById('parcelInfo');
    
    if (infoPanel) {
      infoPanel.innerHTML = `
        <div class="error-message">
          ${error.message || 'Error searching for parcel'}
        </div>
      `;
    }
  }
}

/**
 * Show error message on the map
 * @param {string} message - Error message
 */
function showMapError(message) {
  const mapContainer = document.getElementById('mainMap');
  
  if (!mapContainer) return;
  
  const errorElement = document.createElement('div');
  errorElement.className = 'map-error';
  errorElement.textContent = message;
  
  mapContainer.appendChild(errorElement);
  
  // Remove after 5 seconds
  setTimeout(() => {
    if (mapContainer.contains(errorElement)) {
      mapContainer.removeChild(errorElement);
    }
  }, 5000);
}
