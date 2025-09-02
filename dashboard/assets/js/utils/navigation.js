/**
 * Tab navigation functionality
 */

export function initTabNavigation() {
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // First check if URL has a hash
  const hash = window.location.hash;
  
  if (hash) {
    // Try to activate tab based on hash
    const targetTabId = hash.substring(1);
    activateTab(targetTabId);
  }
  
  // Add click listeners to tab links
  tabLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const tabId = link.getAttribute('data-tab');
      activateTab(tabId);
      
      // Update URL hash without scrolling
      history.pushState(null, null, `#${tabId}`);
    });
  });
  
  // Listen for history changes (back/forward navigation)
  window.addEventListener('popstate', () => {
    const hash = window.location.hash;
    if (hash) {
      const tabId = hash.substring(1);
      activateTab(tabId);
    }
  });
}

/**
 * Activate a specific tab
 * @param {string} tabId - ID of the tab to activate
 */
function activateTab(tabId) {
  // Deactivate all tabs
  const allTabLinks = document.querySelectorAll('.tab-link');
  const allTabContents = document.querySelectorAll('.tab-content');
  
  allTabLinks.forEach(link => link.classList.remove('active'));
  allTabContents.forEach(content => content.classList.remove('active'));
  
  // Activate requested tab
  const activeLink = document.querySelector(`.tab-link[data-tab="${tabId}"]`);
  const activeContent = document.getElementById(tabId);
  
  if (activeLink && activeContent) {
    activeLink.classList.add('active');
    activeContent.classList.add('active');
    
    // Dispatch custom event for lazy loading of tab content
    window.dispatchEvent(new CustomEvent('tabchange', {
      detail: { tabId }
    }));
  }
}
