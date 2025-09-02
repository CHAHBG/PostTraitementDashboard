/**
 * Data Analytics Tab
 * Implementation for the analytics and data visualization
 */

import { store } from '../services/store.js';

// Chart instances
let parcelsByCommuneChart = null;
let dataDistributionChart = null;

// Virtual table data
let tableData = [];
let currentPage = 1;
const rowsPerPage = 15;
let sortColumn = 'name';
let sortDirection = 'asc';

export function initAnalyticsTab() {
  console.log('Initializing Analytics tab...');
  
  // Listen for tab changes
  window.addEventListener('tabchange', (event) => {
    if (event.detail.tabId === 'analytics') {
      // Initialize charts if not already done
      initCharts();
      
      // Initialize data table
      initDataTable();
    }
  });
  
  // Listen for theme changes to update charts
  window.addEventListener('themechange', () => {
    if (parcelsByCommuneChart) {
      updateChartTheme(parcelsByCommuneChart);
    }
  });
}

/**
 * Initialize charts
 */
function initCharts() {
  // Check if required libraries are loaded
  const hasChartJs = typeof Chart !== 'undefined';
  const hasD3 = typeof d3 !== 'undefined';
  
  if (!hasChartJs || !hasD3) {
    console.error('Required chart libraries not loaded:', {
      'Chart.js': hasChartJs,
      'D3.js': hasD3
    });
    return;
  }
  
  // Initialize Chart.js chart
  initParcelsByCommuneChart();
  
  // Initialize D3.js chart
  initDataDistributionChart();
}

/**
 * Initialize Parcels by Commune Chart (using Chart.js)
 */
async function initParcelsByCommuneChart() {
  try {
    const chartCanvas = document.getElementById('parcelsByCommuneChart');
    
    if (!chartCanvas) {
      console.error('Chart canvas element not found');
      return;
    }
    
    // Load data
    const communes = await loadCommunesData();
    
    if (!communes || communes.length === 0) {
      throw new Error('No commune data available');
    }
    
    // Sort communes by parcel count (descending)
    const sortedCommunes = [...communes]
      .sort((a, b) => b.count - a.count)
      .slice(0, 15); // Only show top 15 communes
    
    // Create chart config
    const isDarkTheme = document.body.className === 'theme-dark';
    const textColor = isDarkTheme ? '#e0e0e0' : '#333333';
    
    const chartConfig = {
      type: 'bar',
      data: {
        labels: sortedCommunes.map(c => c.name),
        datasets: [{
          label: 'Parcel Count',
          data: sortedCommunes.map(c => c.count),
          backgroundColor: isDarkTheme ? 'rgba(52, 152, 219, 0.7)' : 'rgba(52, 152, 219, 0.7)',
          borderColor: isDarkTheme ? 'rgba(41, 128, 185, 1)' : 'rgba(41, 128, 185, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              title: function(tooltipItems) {
                return tooltipItems[0].label;
              },
              label: function(context) {
                return `Parcels: ${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor
            },
            grid: {
              color: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }
          },
          x: {
            ticks: {
              color: textColor
            },
            grid: {
              display: false
            }
          }
        }
      }
    };
    
    // Destroy existing chart if it exists
    if (parcelsByCommuneChart) {
      parcelsByCommuneChart.destroy();
    }
    
    // Create new chart
    parcelsByCommuneChart = new Chart(chartCanvas, chartConfig);
    
  } catch (error) {
    console.error('Error initializing parcels by commune chart:', error);
    showChartError('parcelsByCommuneChart', error.message);
  }
}

/**
 * Initialize Data Distribution Chart (using D3.js)
 */
async function initDataDistributionChart() {
  try {
    const chartContainer = document.getElementById('dataDistributionChart');
    
    if (!chartContainer) {
      console.error('Chart container element not found');
      return;
    }
    
    // Clear previous chart
    chartContainer.innerHTML = '';
    
    // Load data
    const communes = await loadCommunesData();
    
    if (!communes || communes.length === 0) {
      throw new Error('No commune data available');
    }
    
    // Define dimensions and margins
    const margin = { top: 40, right: 30, bottom: 50, left: 50 };
    const width = chartContainer.clientWidth - margin.left - margin.right;
    const height = chartContainer.clientHeight - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(chartContainer)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Create scales
    const x = d3.scalePoint()
      .domain(communes.map(d => d.name))
      .range([0, width]);
    
    const y = d3.scaleLinear()
      .domain([0, d3.max(communes, d => d.count)])
      .nice()
      .range([height, 0]);
    
    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');
    
    // Add y-axis
    svg.append('g')
      .call(d3.axisLeft(y));
    
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('Commune Data Distribution');
    
    // Create a curved line generator
    const line = d3.line()
      .x(d => x(d.name))
      .y(d => y(d.count))
      .curve(d3.curveCardinal);
    
    // Add the line path
    svg.append('path')
      .datum(communes)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', line);
    
    // Add circles for each data point
    svg.selectAll('.dot')
      .data(communes)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.name))
      .attr('cy', d => y(d.count))
      .attr('r', 5)
      .attr('fill', 'steelblue')
      .on('mouseover', function(event, d) {
        // Show tooltip on hover
        d3.select(this).attr('r', 8).attr('fill', 'orange');
        
        const tooltip = svg.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${x(d.name)}, ${y(d.count) - 15})`);
        
        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .text(`${d.name}: ${d.count} parcels`);
      })
      .on('mouseout', function() {
        // Hide tooltip
        d3.select(this).attr('r', 5).attr('fill', 'steelblue');
        svg.select('.tooltip').remove();
      });
    
    // Apply theme
    applyD3ChartTheme(svg);
    
    // Add theme change listener
    window.addEventListener('themechange', () => {
      applyD3ChartTheme(svg);
    });
    
    // Add window resize listener
    window.addEventListener('resize', debounce(() => {
      if (document.getElementById('analytics').classList.contains('active')) {
        initDataDistributionChart();
      }
    }, 250));
    
  } catch (error) {
    console.error('Error initializing data distribution chart:', error);
    showChartError('dataDistributionChart', error.message);
  }
}

/**
 * Apply D3 chart theme based on current theme
 * @param {d3.Selection} svg - D3 SVG selection
 */
function applyD3ChartTheme(svg) {
  const isDarkTheme = document.body.className === 'theme-dark';
  const textColor = isDarkTheme ? '#e0e0e0' : '#333333';
  const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  svg.selectAll('text')
    .attr('fill', textColor);
    
  svg.selectAll('.domain, .tick line')
    .attr('stroke', textColor);
    
  svg.selectAll('.tick line')
    .attr('stroke', gridColor);
}

/**
 * Update Chart.js theme based on current theme
 * @param {Chart} chart - Chart.js instance
 */
function updateChartTheme(chart) {
  const isDarkTheme = document.body.className === 'theme-dark';
  const textColor = isDarkTheme ? '#e0e0e0' : '#333333';
  const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  // Update scales
  if (chart.options.scales && chart.options.scales.y) {
    chart.options.scales.y.ticks.color = textColor;
    chart.options.scales.y.grid.color = gridColor;
  }
  
  if (chart.options.scales && chart.options.scales.x) {
    chart.options.scales.x.ticks.color = textColor;
  }
  
  // Update and render
  chart.update();
}

/**
 * Initialize the data table with virtual scrolling
 */
async function initDataTable() {
  try {
    // Get table elements
    const tableBody = document.querySelector('#communeTable tbody');
    
    if (!tableBody) {
      console.error('Table body element not found');
      return;
    }
    
    // Load data
    tableData = await loadCommunesDataExtended();
    
    if (!tableData || tableData.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4">No data available</td></tr>';
      return;
    }
    
    // Set up header sorting
    setupTableSorting();
    
    // Render initial data
    renderTableData();
    
    // Add scroll event listener for virtual scrolling
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.addEventListener('scroll', debounce(() => {
        // Get scroll position
        const scrollTop = tableContainer.scrollTop;
        const scrollHeight = tableContainer.scrollHeight;
        const clientHeight = tableContainer.clientHeight;
        
        // Check if we're near the bottom
        if (scrollTop + clientHeight >= scrollHeight - 50) {
          // Load more data
          loadMoreTableData();
        }
      }, 100));
    }
    
  } catch (error) {
    console.error('Error initializing data table:', error);
    const tableBody = document.querySelector('#communeTable tbody');
    
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="4">Error loading data: ${error.message}</td></tr>`;
    }
  }
}

/**
 * Set up table header sorting
 */
function setupTableSorting() {
  const tableHeaders = document.querySelectorAll('#communeTable thead th');
  
  tableHeaders.forEach(header => {
    const column = header.getAttribute('data-column');
    
    if (!column) return;
    
    header.addEventListener('click', () => {
      // Toggle sort direction if already sorting by this column
      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = 'asc';
      }
      
      // Update header classes
      tableHeaders.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
      header.classList.add(`sort-${sortDirection}`);
      
      // Reset page and render
      currentPage = 1;
      renderTableData();
    });
  });
}

/**
 * Sort table data based on current column and direction
 */
function sortTableData() {
  tableData.sort((a, b) => {
    let valueA = a[sortColumn];
    let valueB = b[sortColumn];
    
    // Handle null values
    if (valueA === null) return 1;
    if (valueB === null) return -1;
    
    // Convert to numbers for numeric columns
    if (sortColumn === 'count' || sortColumn === 'quality') {
      valueA = Number(valueA);
      valueB = Number(valueB);
    }
    
    // Compare values
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Render table data based on current page
 */
function renderTableData() {
  const tableBody = document.querySelector('#communeTable tbody');
  
  if (!tableBody) return;
  
  // Sort data
  sortTableData();
  
  // Calculate start and end indices
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const pageData = tableData.slice(startIndex, endIndex);
  
  // Generate rows
  const rows = pageData.map(commune => `
    <tr>
      <td>${commune.name}</td>
      <td>${commune.count.toLocaleString()}</td>
      <td>
        <div class="quality-bar">
          <div class="quality-fill" style="width: ${commune.quality}%"></div>
          <span>${commune.quality}%</span>
        </div>
      </td>
      <td>${formatDate(commune.lastUpdated)}</td>
    </tr>
  `).join('');
  
  tableBody.innerHTML = rows;
}

/**
 * Load more table data (for virtual scrolling)
 */
function loadMoreTableData() {
  if ((currentPage * rowsPerPage) >= tableData.length) {
    return; // No more data
  }
  
  currentPage++;
  renderTableData();
}

/**
 * Load communes data from API or local storage
 * @returns {Promise<Array>} Array of commune data
 */
async function loadCommunesData() {
  try {
    // Check store first
    let communes = store.get('communes');
    
    if (!communes) {
      // Fetch from API
      const api = store.get('api');
      
      if (!api) {
        throw new Error('API service not available');
      }
      
      const response = await api.get('/communes');
      
      if (!response.success || !response.communes) {
        throw new Error('Failed to load communes data');
      }
      
      communes = response.communes;
      
      // Store for reuse
      store.register('communes', communes);
    }
    
    return communes;
    
  } catch (error) {
    console.error('Error loading communes data:', error);
    throw error;
  }
}

/**
 * Load extended communes data with quality and last updated fields
 * @returns {Promise<Array>} Array of extended commune data
 */
async function loadCommunesDataExtended() {
  try {
    // Get base data
    const communes = await loadCommunesData();
    
    // Enhance with extended data
    return communes.map(commune => ({
      ...commune,
      quality: Math.round(85 + Math.random() * 15), // Mock quality score between 85-100%
      lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random date within last 30 days
    }));
    
  } catch (error) {
    console.error('Error loading extended communes data:', error);
    throw error;
  }
}

/**
 * Show error message for chart
 * @param {string} chartId - ID of chart container
 * @param {string} message - Error message
 */
function showChartError(chartId, message) {
  const container = document.getElementById(chartId);
  
  if (!container) return;
  
  // Clear container
  container.innerHTML = '';
  
  // Add error message
  const errorElement = document.createElement('div');
  errorElement.className = 'chart-error';
  errorElement.textContent = message;
  
  container.appendChild(errorElement);
}

/**
 * Format date as locale string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
  return date.toLocaleDateString();
}

/**
 * Debounce function to limit frequency of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
