/**
 * Theme toggle functionality
 */

export function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  
  if (!themeToggle) {
    console.error('Theme toggle button not found');
    return;
  }
  
  // Check for saved theme preference or system preference
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme) {
    // Apply saved theme
    document.body.className = savedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // Apply dark theme if system preference is dark
    document.body.className = 'theme-dark';
  }
  
  // Add click event listener
  themeToggle.addEventListener('click', toggleTheme);
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const currentTheme = document.body.className;
  
  if (currentTheme === 'theme-light') {
    document.body.className = 'theme-dark';
    localStorage.setItem('theme', 'theme-dark');
  } else {
    document.body.className = 'theme-light';
    localStorage.setItem('theme', 'theme-light');
  }
  
  // Dispatch custom event for components that need to adjust to theme change
  window.dispatchEvent(new CustomEvent('themechange', {
    detail: {
      theme: document.body.className
    }
  }));
}
