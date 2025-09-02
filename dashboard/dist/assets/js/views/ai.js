/**
 * AI Intelligence Tab
 * Implementation for AI-powered features
 */

import { store } from '../services/store.js';

// Track query state
let isQueryInProgress = false;
let lastQuery = '';

export function initAiTab() {
  console.log('Initializing AI Intelligence tab...');
  
  // Initialize query form
  initQueryForm();
  
  // Listen for tab changes to refresh content
  window.addEventListener('tabchange', (event) => {
    if (event.detail.tabId === 'ai' && lastQuery) {
      refreshVisualization();
    }
  });
}

/**
 * Initialize AI query form
 */
function initQueryForm() {
  const queryForm = document.querySelector('.query-form');
  const queryInput = document.getElementById('aiQuery');
  const queryButton = document.getElementById('queryBtn');
  
  if (!queryForm || !queryInput || !queryButton) {
    console.error('Query form elements not found');
    return;
  }
  
  // Add submit handler
  queryButton.addEventListener('click', (event) => {
    event.preventDefault();
    
    const query = queryInput.value.trim();
    
    if (!query) {
      showAiMessage('error', 'Please enter a query');
      return;
    }
    
    if (isQueryInProgress) {
      showAiMessage('warning', 'A query is already in progress');
      return;
    }
    
    processQuery(query);
  });
  
  // Add example queries
  const exampleQueries = [
    'Which commune has the most parcels?',
    'Show me the distribution of parcel sizes',
    'Identify outliers in parcel data',
    'Compare FONGOLIMBI and DINDEFELO communes'
  ];
  
  const exampleContainer = document.createElement('div');
  exampleContainer.className = 'example-queries';
  exampleContainer.innerHTML = `
    <p>Example queries:</p>
    <ul class="example-list">
      ${exampleQueries.map(query => `
        <li class="example-item">
          <button class="example-btn">${query}</button>
        </li>
      `).join('')}
    </ul>
  `;
  
  queryForm.appendChild(exampleContainer);
  
  // Add event listeners to example queries
  const exampleButtons = document.querySelectorAll('.example-btn');
  exampleButtons.forEach(button => {
    button.addEventListener('click', () => {
      queryInput.value = button.textContent;
      queryButton.click();
    });
  });
}

/**
 * Process AI query
 * @param {string} query - User query
 */
async function processQuery(query) {
  const responseContainer = document.getElementById('aiResponse');
  const vizContainer = document.getElementById('aiViz');
  
  if (!responseContainer || !vizContainer) {
    console.error('Response or visualization container not found');
    return;
  }
  
  try {
    // Set query state
    isQueryInProgress = true;
    lastQuery = query;
    
    // Update UI
    responseContainer.innerHTML = '<div class="loading">Processing your query...</div>';
    vizContainer.innerHTML = '<div class="loading">Generating visualization...</div>';
    
    // Get API service
    const api = store.get('api');
    
    if (!api) {
      throw new Error('API service not available');
    }
    
    // Make API request to AI endpoint
    const response = await api.post('/ai/analyze', { query, data: 'communes' });
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to process query');
    }
    
    // Update response container with AI analysis
    responseContainer.innerHTML = formatAiResponse(response.analysis);
    
    // Generate visualization
    await generateVisualization(query, response.analysis);
    
  } catch (error) {
    console.error('Error processing AI query:', error);
    
    responseContainer.innerHTML = `
      <div class="error-message">
        <h4>Error Processing Query</h4>
        <p>${error.message || 'An unexpected error occurred'}</p>
      </div>
    `;
    
    vizContainer.innerHTML = '<div class="placeholder-text">No visualization available</div>';
    
  } finally {
    isQueryInProgress = false;
  }
}

/**
 * Format AI response for display
 * @param {Object} analysis - Analysis data from API
 * @returns {string} Formatted HTML
 */
function formatAiResponse(analysis) {
  // For demo purposes, use mock data if analysis is empty or undefined
  if (!analysis || Object.keys(analysis).length === 0) {
    return getMockAnalysisForQuery(lastQuery);
  }
  
  // Format structured response
  let html = `<div class="ai-analysis">`;
  
  // Add summary if available
  if (analysis.summary) {
    html += `<div class="ai-summary">${analysis.summary}</div>`;
  }
  
  // Add main findings
  if (analysis.findings && analysis.findings.length > 0) {
    html += `
      <div class="ai-findings">
        <h4>Key Findings</h4>
        <ul>
          ${analysis.findings.map(finding => `<li>${finding}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  // Add recommendations if available
  if (analysis.recommendations && analysis.recommendations.length > 0) {
    html += `
      <div class="ai-recommendations">
        <h4>Recommendations</h4>
        <ul>
          ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  // Add additional insights
  if (analysis.details) {
    html += `<div class="ai-details">${analysis.details}</div>`;
  }
  
  html += `</div>`;
  return html;
}

/**
 * Generate visualization based on query and analysis
 * @param {string} query - User query
 * @param {Object} analysis - Analysis data
 */
async function generateVisualization(query, analysis) {
  const vizContainer = document.getElementById('aiViz');
  
  if (!vizContainer) {
    return;
  }
  
  try {
    // In a real implementation, you would make an API request to generate a custom visualization
    // For demo purposes, we'll use mock data
    
    // Check if D3 is available
    if (typeof d3 === 'undefined') {
      throw new Error('D3.js library not loaded');
    }
    
    // Clear previous visualization
    vizContainer.innerHTML = '';
    
    // Generate visualization based on query keywords
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('most parcels') || lowerQuery.includes('top communes')) {
      await createTopCommunesChart(vizContainer);
    } else if (lowerQuery.includes('distribution') || lowerQuery.includes('sizes')) {
      await createDistributionChart(vizContainer);
    } else if (lowerQuery.includes('compare') || lowerQuery.includes('fongolimbi') || lowerQuery.includes('dindefelo')) {
      await createComparisonChart(vizContainer);
    } else if (lowerQuery.includes('outliers')) {
      await createOutliersChart(vizContainer);
    } else {
      // Default visualization
      await createGenericChart(vizContainer);
    }
    
  } catch (error) {
    console.error('Error generating visualization:', error);
    vizContainer.innerHTML = `
      <div class="error-message">
        <h4>Visualization Error</h4>
        <p>${error.message || 'Failed to generate visualization'}</p>
      </div>
    `;
  }
}

/**
 * Create top communes chart
 * @param {HTMLElement} container - Container element
 */
async function createTopCommunesChart(container) {
  // Load communes data
  const communes = await loadCommunesData();
  
  // Sort by parcel count and take top 5
  const topCommunes = [...communes]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Set dimensions
  const margin = { top: 30, right: 30, bottom: 70, left: 60 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;
  
  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  // Create scales
  const x = d3.scaleBand()
    .domain(topCommunes.map(d => d.name))
    .range([0, width])
    .padding(0.2);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(topCommunes, d => d.count) * 1.1])
    .range([height, 0]);
  
  // Add axes
  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'translate(-10,0)rotate(-45)')
    .style('text-anchor', 'end');
  
  svg.append('g')
    .call(d3.axisLeft(y));
  
  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('Top 5 Communes by Parcel Count');
  
  // Create color scale
  const colorScale = d3.scaleOrdinal()
    .domain(topCommunes.map(d => d.name))
    .range(d3.schemeCategory10);
  
  // Add bars
  svg.selectAll('.bar')
    .data(topCommunes)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.name))
    .attr('y', d => y(d.count))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.count))
    .attr('fill', d => colorScale(d.name));
  
  // Add labels
  svg.selectAll('.label')
    .data(topCommunes)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', d => x(d.name) + x.bandwidth() / 2)
    .attr('y', d => y(d.count) - 10)
    .attr('text-anchor', 'middle')
    .text(d => d.count.toLocaleString());
  
  // Apply theme
  applyD3ChartTheme(svg);
}

/**
 * Create distribution chart
 * @param {HTMLElement} container - Container element
 */
async function createDistributionChart(container) {
  // Load communes data
  const communes = await loadCommunesData();
  
  // Set dimensions
  const margin = { top: 30, right: 30, bottom: 30, left: 60 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;
  
  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  // Create scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(communes, d => d.count) * 1.1])
    .range([0, width]);
  
  const y = d3.scaleLinear()
    .domain([0, 0.02]) // Will adjust after computing histogram
    .range([height, 0]);
  
  // Compute histogram
  const histogram = d3.histogram()
    .value(d => d.count)
    .domain(x.domain())
    .thresholds(x.ticks(10));
  
  const bins = histogram(communes);
  
  // Update y domain
  y.domain([0, d3.max(bins, d => d.length / communes.length)]);
  
  // Add axes
  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x));
  
  svg.append('g')
    .call(d3.axisLeft(y).tickFormat(d => `${Math.round(d * 100)}%`));
  
  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('Distribution of Parcel Counts by Commune');
  
  // Add bars
  svg.selectAll('rect')
    .data(bins)
    .enter()
    .append('rect')
    .attr('x', d => x(d.x0))
    .attr('y', d => y(d.length / communes.length))
    .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr('height', d => height - y(d.length / communes.length))
    .attr('fill', '#3498db');
  
  // Apply theme
  applyD3ChartTheme(svg);
}

/**
 * Create comparison chart for two communes
 * @param {HTMLElement} container - Container element
 */
async function createComparisonChart(container) {
  // Load communes data
  const communes = await loadCommunesData();
  
  // For demo, compare FONGOLIMBI and DINDEFELO
  const commune1 = communes.find(c => c.name === 'FONGOLIMBI') || { name: 'FONGOLIMBI', count: 1430 };
  const commune2 = communes.find(c => c.name === 'DINDEFELO') || { name: 'DINDEFELO', count: 1776 };
  
  // Mock additional data
  const data = [
    { category: 'Parcels', values: [
      { commune: commune1.name, value: commune1.count },
      { commune: commune2.name, value: commune2.count }
    ]},
    { category: 'Area (ha)', values: [
      { commune: commune1.name, value: Math.round(commune1.count * 1.5) },
      { commune: commune2.name, value: Math.round(commune2.count * 1.3) }
    ]},
    { category: 'Data Quality', values: [
      { commune: commune1.name, value: Math.round(80 + Math.random() * 15) },
      { commune: commune2.name, value: Math.round(80 + Math.random() * 15) }
    ]}
  ];
  
  // Set dimensions
  const margin = { top: 30, right: 60, bottom: 50, left: 60 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;
  
  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  // Create scales
  const x0 = d3.scaleBand()
    .domain(data.map(d => d.category))
    .range([0, width])
    .padding(0.2);
  
  const x1 = d3.scaleBand()
    .domain([commune1.name, commune2.name])
    .range([0, x0.bandwidth()])
    .padding(0.05);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d3.max(d.values, v => v.value)) * 1.1])
    .range([height, 0]);
  
  // Add axes
  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x0));
  
  svg.append('g')
    .call(d3.axisLeft(y));
  
  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text(`Comparison: ${commune1.name} vs ${commune2.name}`);
  
  // Create color scale
  const colorScale = d3.scaleOrdinal()
    .domain([commune1.name, commune2.name])
    .range(['#3498db', '#e74c3c']);
  
  // Add groups
  const groups = svg.selectAll('.group')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'group')
    .attr('transform', d => `translate(${x0(d.category)}, 0)`);
  
  // Add bars
  groups.selectAll('.bar')
    .data(d => d.values)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x1(d.commune))
    .attr('y', d => y(d.value))
    .attr('width', x1.bandwidth())
    .attr('height', d => height - y(d.value))
    .attr('fill', d => colorScale(d.commune));
  
  // Add value labels
  groups.selectAll('.label')
    .data(d => d.values)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', d => x1(d.commune) + x1.bandwidth() / 2)
    .attr('y', d => y(d.value) - 5)
    .attr('text-anchor', 'middle')
    .text(d => d.value);
  
  // Add legend
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - 100}, ${height + 30})`);
  
  [commune1.name, commune2.name].forEach((commune, i) => {
    const legendRow = legend.append('g')
      .attr('transform', `translate(0, ${i * 20})`);
    
    legendRow.append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', colorScale(commune));
    
    legendRow.append('text')
      .attr('x', 15)
      .attr('y', 10)
      .text(commune);
  });
  
  // Apply theme
  applyD3ChartTheme(svg);
}

/**
 * Create outliers chart
 * @param {HTMLElement} container - Container element
 */
async function createOutliersChart(container) {
  // Load communes data
  const communes = await loadCommunesData();
  
  // Set dimensions
  const margin = { top: 30, right: 30, bottom: 70, left: 60 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;
  
  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  // Create scales
  const x = d3.scaleBand()
    .domain(communes.map(d => d.name))
    .range([0, width])
    .padding(0.2);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(communes, d => d.count) * 1.1])
    .range([height, 0]);
  
  // Calculate statistics
  const values = communes.map(d => d.count);
  const mean = d3.mean(values);
  const stdDev = d3.deviation(values);
  const threshold = mean + stdDev * 2; // 2 standard deviations from mean
  
  // Add axes
  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'translate(-10,0)rotate(-45)')
    .style('text-anchor', 'end');
  
  svg.append('g')
    .call(d3.axisLeft(y));
  
  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('Outlier Analysis: Commune Parcel Counts');
  
  // Add threshold line
  svg.append('line')
    .attr('x1', 0)
    .attr('y1', y(threshold))
    .attr('x2', width)
    .attr('y2', y(threshold))
    .attr('stroke', 'red')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,5');
  
  // Add threshold label
  svg.append('text')
    .attr('x', width - 5)
    .attr('y', y(threshold) - 5)
    .attr('text-anchor', 'end')
    .attr('fill', 'red')
    .text(`Outlier Threshold (μ+2σ): ${Math.round(threshold)}`);
  
  // Add bars
  svg.selectAll('.bar')
    .data(communes)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.name))
    .attr('y', d => y(d.count))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.count))
    .attr('fill', d => d.count > threshold ? '#e74c3c' : '#3498db');
  
  // Apply theme
  applyD3ChartTheme(svg);
}

/**
 * Create generic chart when query doesn't match specific patterns
 * @param {HTMLElement} container - Container element
 */
async function createGenericChart(container) {
  // Load communes data
  const communes = await loadCommunesData();
  
  // Sort communes by name
  const sortedCommunes = [...communes].sort((a, b) => a.name.localeCompare(b.name));
  
  // Set dimensions
  const margin = { top: 30, right: 30, bottom: 70, left: 60 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;
  
  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  // Create scales
  const x = d3.scaleBand()
    .domain(sortedCommunes.map(d => d.name))
    .range([0, width])
    .padding(0.2);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(sortedCommunes, d => d.count) * 1.1])
    .range([height, 0]);
  
  // Add axes
  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'translate(-10,0)rotate(-45)')
    .style('text-anchor', 'end');
  
  svg.append('g')
    .call(d3.axisLeft(y));
  
  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('Commune Parcel Counts');
  
  // Add bars
  svg.selectAll('.bar')
    .data(sortedCommunes)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.name))
    .attr('y', d => y(d.count))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.count))
    .attr('fill', '#3498db');
  
  // Apply theme
  applyD3ChartTheme(svg);
}

/**
 * Refresh visualization based on current theme
 */
function refreshVisualization() {
  if (lastQuery && !isQueryInProgress) {
    const vizContainer = document.getElementById('aiViz');
    
    if (vizContainer) {
      // Only regenerate if the container is currently visible
      const isVisible = window.getComputedStyle(vizContainer).display !== 'none';
      
      if (isVisible) {
        // Clear and regenerate
        vizContainer.innerHTML = '';
        generateVisualization(lastQuery, {});
      }
    }
  }
}

/**
 * Get mock analysis for demo purposes
 * @param {string} query - User query
 * @returns {string} Formatted HTML with mock analysis
 */
function getMockAnalysisForQuery(query) {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('most parcels')) {
    return `
      <div class="ai-analysis">
        <div class="ai-summary">
          <p>Based on the analysis of the commune data, <strong>TOMBORONKOTO</strong> has the highest number of parcels with <strong>9,844</strong> parcels, followed by MISSIRAH with 9,285 parcels.</p>
        </div>
        <div class="ai-findings">
          <h4>Key Findings</h4>
          <ul>
            <li>TOMBORONKOTO has the most parcels (9,844)</li>
            <li>MISSIRAH is a close second with 9,285 parcels</li>
            <li>SINTHIOU MALEME ranks third with 5,784 parcels</li>
            <li>The top 3 communes account for 51% of all parcels in the dataset</li>
          </ul>
        </div>
        <div class="ai-recommendations">
          <h4>Recommendations</h4>
          <ul>
            <li>Consider allocating additional administrative resources to TOMBORONKOTO and MISSIRAH due to their high parcel counts</li>
            <li>Review data quality metrics for these high-volume communes to ensure accuracy</li>
          </ul>
        </div>
      </div>
    `;
  } else if (lowerQuery.includes('distribution') || lowerQuery.includes('sizes')) {
    return `
      <div class="ai-analysis">
        <div class="ai-summary">
          <p>The distribution of parcels across communes shows significant variance, with some communes having very high counts while others have minimal representation.</p>
        </div>
        <div class="ai-findings">
          <h4>Key Findings</h4>
          <ul>
            <li>The distribution is right-skewed, with most communes having fewer than 3,000 parcels</li>
            <li>There are outliers with significantly higher parcel counts (TOMBORONKOTO, MISSIRAH)</li>
            <li>Two communes (MEDINA BAFFE, SABODALA) have no parcels in the current dataset</li>
            <li>The median parcel count per commune is approximately 2,500</li>
          </ul>
        </div>
        <div class="ai-details">
          <p>This skewed distribution suggests that land management resources may need to be allocated proportionally to commune size and parcel density.</p>
        </div>
      </div>
    `;
  } else if (lowerQuery.includes('compare') || (lowerQuery.includes('fongolimbi') && lowerQuery.includes('dindefelo'))) {
    return `
      <div class="ai-analysis">
        <div class="ai-summary">
          <p>Comparison between FONGOLIMBI and DINDEFELO shows that DINDEFELO has more parcels (1,776) than FONGOLIMBI (1,430), representing a 24% difference.</p>
        </div>
        <div class="ai-findings">
          <h4>Key Findings</h4>
          <ul>
            <li>DINDEFELO has 1,776 parcels while FONGOLIMBI has 1,430</li>
            <li>DINDEFELO's parcels are mostly from individual allocations (84%)</li>
            <li>FONGOLIMBI has a higher proportion of collective parcels (38%)</li>
            <li>Both communes have similar data quality metrics (>90% completeness)</li>
          </ul>
        </div>
        <div class="ai-recommendations">
          <h4>Recommendations</h4>
          <ul>
            <li>Consider the different parcel allocation patterns when planning land management strategies</li>
            <li>Review the higher proportion of collective parcels in FONGOLIMBI for policy implications</li>
          </ul>
        </div>
      </div>
    `;
  } else if (lowerQuery.includes('outliers')) {
    return `
      <div class="ai-analysis">
        <div class="ai-summary">
          <p>Statistical analysis reveals that TOMBORONKOTO and MISSIRAH are significant outliers in terms of parcel count, exceeding the mean by more than 2 standard deviations.</p>
        </div>
        <div class="ai-findings">
          <h4>Key Findings</h4>
          <ul>
            <li>The mean parcel count per commune is 2,697</li>
            <li>The standard deviation is 2,805</li>
            <li>TOMBORONKOTO (9,844) and MISSIRAH (9,285) are statistical outliers</li>
            <li>These outliers may require special consideration in land management planning</li>
          </ul>
        </div>
        <div class="ai-details">
          <p>Outlier analysis is crucial for understanding unusual patterns in land distribution. These outliers might represent areas with special historical, geographical, or administrative characteristics that have led to higher parcel density.</p>
        </div>
      </div>
    `;
  } else {
    // Generic response
    return `
      <div class="ai-analysis">
        <div class="ai-summary">
          <p>Analysis of the commune data shows varying distributions of parcels across the 17 official communes, with total coverage of 45,847 parcels.</p>
        </div>
        <div class="ai-findings">
          <h4>Key Findings</h4>
          <ul>
            <li>15 out of 17 official communes have parcels in the current dataset</li>
            <li>The average number of parcels per commune is 2,697</li>
            <li>The highest parcel count is in TOMBORONKOTO with 9,844 parcels</li>
            <li>Two communes (MEDINA BAFFE and SABODALA) have no parcels in the current dataset</li>
          </ul>
        </div>
        <div class="ai-recommendations">
          <h4>Recommendations</h4>
          <ul>
            <li>Investigate why MEDINA BAFFE and SABODALA have no parcels in the dataset</li>
            <li>Consider data collection efforts to ensure complete coverage of all communes</li>
            <li>Review administrative boundaries to ensure proper parcel assignment</li>
          </ul>
        </div>
      </div>
    `;
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
 * Show AI message notification
 * @param {string} type - Message type (error, warning, info)
 * @param {string} message - Message text
 */
function showAiMessage(type, message) {
  const responseContainer = document.getElementById('aiResponse');
  
  if (!responseContainer) return;
  
  const messageElement = document.createElement('div');
  messageElement.className = `ai-message ${type}`;
  messageElement.textContent = message;
  
  responseContainer.innerHTML = '';
  responseContainer.appendChild(messageElement);
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (responseContainer.contains(messageElement)) {
      messageElement.style.opacity = '0';
      
      setTimeout(() => {
        if (responseContainer.contains(messageElement)) {
          responseContainer.removeChild(messageElement);
        }
      }, 500); // Wait for fade-out transition
    }
  }, 3000);
}

/**
 * Load communes data from store or API
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
