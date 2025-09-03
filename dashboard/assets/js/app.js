/**
 * Land Management Dashboard
 * Main application entry point
 */

// Import modules
import { initThemeToggle } from './utils/theme.js';
import { initTabNavigation } from './utils/navigation.js';
import { initOverviewTab } from './views/overview.js';
import { initMappingTab } from './views/mapping.js';
import { initAnalyticsTab } from './views/analytics.js';
import { initAiTab } from './views/ai.js';
import { initReportsTab } from './views/reports.js';
import { initModalSystem } from './components/modal.js';

// API service
import { ApiService } from './services/api.js';
import { config } from './config.js';

// Store for global state management
import { store } from './services/store.js';

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing Land Management Dashboard...');
  
  try {
    // Initialize global components
    initThemeToggle();
    initTabNavigation();
    initModalSystem();
    
    // Initialize API service using environment-aware config
    const api = new ApiService({
      baseUrl: config.api.baseUrl || undefined,
      useDirectFileAccess: config.api.useDirectFileAccess
    });
    
    // Register API in store for global access
    store.register('api', api);
    
    // Load initial data
    await loadInitialData(api);
    
    // Initialize tab-specific components
    initOverviewTab();
    initMappingTab();
    initAnalyticsTab();
    initAiTab();
    initReportsTab();
    
    console.log('Dashboard initialization complete');
  } catch (error) {
    console.error('Error initializing application:', error);
    showErrorMessage('Failed to initialize the dashboard. Please check the console for details.');
  }
});

/**
 * Load initial data needed across tabs
 * @param {ApiService} api - API service instance
 */
async function loadInitialData(api) {
  try {
    console.log('Loading initial data...');
    
    // Load communes list
    const communesResponse = await api.get('/communes');
    if (communesResponse.success) {
      store.register('communes', communesResponse.communes);
      console.log(`Loaded ${communesResponse.communes.length} communes`);
    } else {
      throw new Error('Failed to load communes data');
    }
    
    // Additional initial data loading can go here
    
  } catch (error) {
    console.error('Error loading initial data:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Display an error message to the user
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
  // Create error notification
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.textContent = message;
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.className = 'close-notification';
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(notification);
  });
  
  notification.appendChild(closeBtn);
  document.body.appendChild(notification);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  }, 10000);
}
