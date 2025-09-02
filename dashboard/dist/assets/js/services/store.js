/**
 * Simple store for state management
 */

class Store {
  constructor() {
    this._state = {};
    this._listeners = {};
  }
  
  /**
   * Register a value in the store
   * @param {string} key - Key to register
   * @param {any} value - Value to store
   */
  register(key, value) {
    this._state[key] = value;
    this._notifyListeners(key);
    return value;
  }
  
  /**
   * Get a value from the store
   * @param {string} key - Key to retrieve
   * @returns {any} Stored value or undefined if not found
   */
  get(key) {
    return this._state[key];
  }
  
  /**
   * Update a value in the store
   * @param {string} key - Key to update
   * @param {any} value - New value
   * @returns {boolean} True if the key existed and was updated
   */
  update(key, value) {
    if (key in this._state) {
      this._state[key] = value;
      this._notifyListeners(key);
      return true;
    }
    return false;
  }
  
  /**
   * Subscribe to changes for a specific key
   * @param {string} key - Key to subscribe to
   * @param {Function} callback - Callback function to invoke when the key changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this._listeners[key]) {
      this._listeners[key] = [];
    }
    
    this._listeners[key].push(callback);
    
    // Return unsubscribe function
    return () => {
      this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify all listeners for a specific key
   * @private
   * @param {string} key - Key that changed
   */
  _notifyListeners(key) {
    const listeners = this._listeners[key] || [];
    listeners.forEach(callback => {
      try {
        callback(this._state[key]);
      } catch (error) {
        console.error(`Error in store listener for key "${key}":`, error);
      }
    });
  }
}

// Export a singleton instance
export const store = new Store();
