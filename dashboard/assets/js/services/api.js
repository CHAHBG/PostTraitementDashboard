/**
 * API Service for making requests to the backend
 */
import { config } from '../config.js';

export class ApiService {
  /**
   * Initialize API service
   * @param {Object} customConfig - Custom configuration object (optional)
   * @param {string} customConfig.baseUrl - Base URL for API requests
   */
  constructor(customConfig = {}) {
    this.baseUrl = customConfig.baseUrl || config.api.baseUrl || 'http://localhost:3001/api';
    this.useDirectFileAccess = customConfig.useDirectFileAccess ?? config.api.useDirectFileAccess ?? false;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }
  
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, queryParams = {}) {
    try {
      // If using direct file access (for static hosting without API server)
      if (this.useDirectFileAccess) {
        return await this._handleStaticFileRequest(endpoint, queryParams);
      }
      
      // Otherwise use normal API request
      // Build URL with query parameters
      let url = `${this.baseUrl}${endpoint}`;
      const queryString = this._buildQueryString(queryParams);
      
      if (queryString) {
        url += `?${queryString}`;
      }
      
      // Make request
      const response = await fetch(url, {
        method: 'GET',
        headers: this.defaultHeaders
      });
      
      return this._handleResponse(response);
    } catch (error) {
      console.error(`API GET error (${endpoint}):`, error);
      throw error;
    }
  }
  
  /**
   * Handle static file requests when API server isn't available
   * @private
   * @param {string} endpoint - API endpoint
   * @param {Object} queryParams - Query parameters
   * @returns {Promise<any>} Response data
   */
  async _handleStaticFileRequest(endpoint, queryParams = {}) {
    // Map API endpoints to local files for static hosting
    const fileMap = {
      // Communes endpoints
      '/communes': {
        file: 'data/communes_data.json',
        transform: (data) => {
          // Transform raw JSON to match API response format
          const communes = Object.keys(data).map(name => ({
            name,
            count: data[name].parcels?.length || 0
          }));
          return { success: true, communes };
        }
      },
      
      // Regex for dynamic endpoints
      'communes/(.+)': {
        filePattern: 'data/communes_data.json',
        transform: (data, match) => {
          const communeName = match[1].toUpperCase();
          const commune = data[communeName];
          if (commune) {
            return { success: true, commune };
          }
          return { success: false, error: `Commune ${communeName} not found` };
        }
      },
      
      // Add more endpoint mappings as needed
    };
    
    // Try to find a matching file mapping
    let fileConfig = fileMap[endpoint];
    
    // If no direct match, try regex patterns
    if (!fileConfig) {
      for (const [pattern, config] of Object.entries(fileMap)) {
        if (pattern.includes('(')) {
          const regex = new RegExp(pattern);
          const match = endpoint.match(regex);
          if (match) {
            fileConfig = { ...config, match };
            break;
          }
        }
      }
    }
    
    if (fileConfig) {
      const filePath = fileConfig.file || fileConfig.filePattern;
      const response = await fetch(filePath);
      const data = await response.json();
      
      // Transform the data if a transform function is provided
      if (fileConfig.transform) {
        return fileConfig.transform(data, fileConfig.match);
      }
      
      return data;
    }
    
    throw new Error(`No static file mapping for endpoint: ${endpoint}`);
  }
  
  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(data)
      });
      
      return this._handleResponse(response);
    } catch (error) {
      console.error(`API POST error (${endpoint}):`, error);
      throw error;
    }
  }
  
  /**
   * Process the API response
   * @private
   * @param {Response} response - Fetch API response
   * @returns {Promise<any>} Processed response data
   */
  async _handleResponse(response) {
    // Check if the response is OK (status in the range 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Parse JSON response
    try {
      return await response.json();
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Invalid JSON response from API');
    }
  }
  
  /**
   * Build a query string from an object
   * @private
   * @param {Object} params - Query parameters
   * @returns {string} Query string
   */
  _buildQueryString(params) {
    return Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }
}
