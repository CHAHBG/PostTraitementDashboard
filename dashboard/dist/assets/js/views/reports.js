/**
 * Administrative Reports Tab
 * Implementation for reports functionality
 */

import { store } from '../services/store.js';

// Track current report
let currentReport = null;

// Report file mappings
const REPORT_FILES = {
  'commune-extraction': 'data/commune_extraction_report.json',
  'commune-standardization': 'data/commune_standardization_report.json',
  'jointure': 'data/rapport_jointure.json',
  'post-traitement': 'data/Rapport_Post_traitement.json',
  'duplicate-removal': 'data/duplicate_removal_summary.json',
  'parcel-conflicts': 'data/parcel_join_conflicts.json'
};

// Report titles
const REPORT_TITLES = {
  'commune-extraction': 'Commune Extraction Report',
  'commune-standardization': 'Commune Standardization Report',
  'jointure': 'Rapport Jointure',
  'post-traitement': 'Rapport Post-traitement',
  'duplicate-removal': 'Duplicate Removal Summary',
  'parcel-conflicts': 'Parcel Join Conflicts'
};

export function initReportsTab() {
  console.log('Initializing Reports tab...');
  
  // Set up report list click handlers
  initReportList();
  
  // Set up export buttons
  initExportButtons();
}

/**
 * Initialize report list with click handlers
 */
function initReportList() {
  const reportItems = document.querySelectorAll('#reportList li');
  
  if (!reportItems || reportItems.length === 0) {
    console.error('Report list items not found');
    return;
  }
  
  reportItems.forEach(item => {
    item.addEventListener('click', () => {
      const reportId = item.getAttribute('data-report');
      
      if (!reportId) {
        return;
      }
      
      // Update active state
      reportItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // Load and display report
      loadReport(reportId);
    });
  });
  
  // Load first report by default
  if (reportItems[0]) {
    reportItems[0].click();
  }
}

/**
 * Initialize export buttons
 */
function initExportButtons() {
  const csvButton = document.getElementById('exportCsv');
  const pdfButton = document.getElementById('exportPdf');
  
  if (csvButton) {
    csvButton.addEventListener('click', () => {
      exportReportAsCSV();
    });
  }
  
  if (pdfButton) {
    pdfButton.addEventListener('click', () => {
      exportReportAsPDF();
    });
  }
}

/**
 * Load and display a report by ID
 * @param {string} reportId - Report identifier
 */
async function loadReport(reportId) {
  const reportTitle = document.getElementById('reportTitle');
  const reportContent = document.getElementById('reportContent');
  
  if (!reportTitle || !reportContent) {
    console.error('Report elements not found');
    return;
  }
  
  try {
    // Update title
    reportTitle.textContent = REPORT_TITLES[reportId] || 'Unknown Report';
    
    // Show loading state
    reportContent.innerHTML = '<div class="loading">Loading report data...</div>';
    
    // Get report file path
    const reportFile = REPORT_FILES[reportId];
    
    if (!reportFile) {
      throw new Error(`Report file not found for ID: ${reportId}`);
    }
    
    // Fetch report data
    const response = await fetch(reportFile);
    const reportData = await response.json();
    
    // Store current report data
    currentReport = {
      id: reportId,
      title: REPORT_TITLES[reportId],
      data: reportData
    };
    
    // Render report based on type
    renderReport(reportId, reportData, reportContent);
    
  } catch (error) {
    console.error('Error loading report:', error);
    reportContent.innerHTML = `
      <div class="error-message">
        <h4>Error Loading Report</h4>
        <p>${error.message || 'An unexpected error occurred'}</p>
      </div>
    `;
  }
}

/**
 * Render report content based on report type
 * @param {string} reportId - Report identifier
 * @param {Object} data - Report data
 * @param {HTMLElement} container - Container element
 */
function renderReport(reportId, data, container) {
  switch (reportId) {
    case 'commune-extraction':
      renderCommuneExtractionReport(data, container);
      break;
    case 'commune-standardization':
      renderCommuneStandardizationReport(data, container);
      break;
    case 'jointure':
      renderJointureReport(data, container);
      break;
    case 'post-traitement':
      renderPostTraitementReport(data, container);
      break;
    case 'duplicate-removal':
      renderDuplicateRemovalReport(data, container);
      break;
    case 'parcel-conflicts':
      renderParcelConflictsReport(data, container);
      break;
    default:
      renderGenericJsonReport(data, container);
  }
}

/**
 * Render commune extraction report
 * @param {Object} data - Report data
 * @param {HTMLElement} container - Container element
 */
function renderCommuneExtractionReport(data, container) {
  // Format HTML content
  let html = `<div class="report-content">`;
  
  // Add summary section
  html += `
    <section class="report-section">
      <h3>Summary</h3>
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-value">${data.totalCommunes || 0}</span>
          <span class="stat-label">Total Communes</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.extractedCommunes || 0}</span>
          <span class="stat-label">Extracted</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.problemCases || 0}</span>
          <span class="stat-label">Issues</span>
        </div>
      </div>
    </section>
  `;
  
  // Add details table if available
  if (data.details && data.details.length > 0) {
    html += `
      <section class="report-section">
        <h3>Details</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Commune</th>
              <th>Source</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${data.details.map(item => `
              <tr>
                <td>${item.commune || ''}</td>
                <td>${item.source || ''}</td>
                <td>${getStatusBadge(item.status)}</td>
                <td>${item.notes || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }
  
  html += `</div>`;
  container.innerHTML = html;
}

/**
 * Render commune standardization report
 * @param {Object} data - Report data
 * @param {HTMLElement} container - Container element
 */
function renderCommuneStandardizationReport(data, container) {
  // Format HTML content
  let html = `<div class="report-content">`;
  
  // Add summary section
  html += `
    <section class="report-section">
      <h3>Standardization Summary</h3>
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-value">${data.totalProcessed || 0}</span>
          <span class="stat-label">Processed</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.standardized || 0}</span>
          <span class="stat-label">Standardized</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.unchanged || 0}</span>
          <span class="stat-label">Unchanged</span>
        </div>
      </div>
    </section>
  `;
  
  // Add mapping table if available
  if (data.mappings && Object.keys(data.mappings).length > 0) {
    html += `
      <section class="report-section">
        <h3>Name Mappings</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Original Name</th>
              <th>Standardized Name</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(data.mappings).map(([original, standardized]) => `
              <tr>
                <td>${original || ''}</td>
                <td>${standardized || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }
  
  html += `</div>`;
  container.innerHTML = html;
}

/**
 * Render jointure report
 * @param {Object} data - Report data
 * @param {HTMLElement} container - Container element
 */
function renderJointureReport(data, container) {
  // Format HTML content
  let html = `<div class="report-content">`;
  
  // Add summary section
  html += `
    <section class="report-section">
      <h3>Jointure Summary</h3>
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-value">${data.totalParcels || 0}</span>
          <span class="stat-label">Total Parcels</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.joinedParcels || 0}</span>
          <span class="stat-label">Joined</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.conflicts || 0}</span>
          <span class="stat-label">Conflicts</span>
        </div>
      </div>
    </section>
  `;
  
  // Add commune stats if available
  if (data.communeStats && Object.keys(data.communeStats).length > 0) {
    html += `
      <section class="report-section">
        <h3>Commune Statistics</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Commune</th>
              <th>Total</th>
              <th>Joined</th>
              <th>Failed</th>
              <th>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(data.communeStats).map(([commune, stats]) => `
              <tr>
                <td>${commune || ''}</td>
                <td>${stats.total || 0}</td>
                <td>${stats.joined || 0}</td>
                <td>${stats.failed || 0}</td>
                <td>${calculateSuccessRate(stats.joined, stats.total)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }
  
  html += `</div>`;
  container.innerHTML = html;
}

/**
 * Render post-traitement report
 * @param {Object} data - Report data
 * @param {HTMLElement} container - Container element
 */
function renderPostTraitementReport(data, container) {
  // Format HTML content
  let html = `<div class="report-content">`;
  
  // Add summary section
  html += `
    <section class="report-section">
      <h3>Post-Processing Summary</h3>
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-value">${data.totalProcessed || 0}</span>
          <span class="stat-label">Processed</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.modified || 0}</span>
          <span class="stat-label">Modified</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.errors || 0}</span>
          <span class="stat-label">Errors</span>
        </div>
      </div>
    </section>
  `;
  
  // Add operations table if available
  if (data.operations && data.operations.length > 0) {
    html += `
      <section class="report-section">
        <h3>Operations</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Operation</th>
              <th>Count</th>
              <th>Success</th>
              <th>Duration (ms)</th>
            </tr>
          </thead>
          <tbody>
            ${data.operations.map(op => `
              <tr>
                <td>${op.name || ''}</td>
                <td>${op.count || 0}</td>
                <td>${getStatusBadge(op.success ? 'success' : 'failed')}</td>
                <td>${op.duration || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }
  
  html += `</div>`;
  container.innerHTML = html;
}

/**
 * Render duplicate removal report
 * @param {Object} data - Report data
 * @param {HTMLElement} container - Container element
 */
function renderDuplicateRemovalReport(data, container) {
  // Format HTML content
  let html = `<div class="report-content">`;
  
  // Add summary section
  html += `
    <section class="report-section">
      <h3>Duplicate Removal Summary</h3>
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-value">${data.totalParcels || 0}</span>
          <span class="stat-label">Total Parcels</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.duplicatesFound || 0}</span>
          <span class="stat-label">Duplicates</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.removed || 0}</span>
          <span class="stat-label">Removed</span>
        </div>
      </div>
    </section>
  `;
  
  // Add duplicate groups if available
  if (data.duplicateGroups && data.duplicateGroups.length > 0) {
    html += `
      <section class="report-section">
        <h3>Duplicate Groups</h3>
        <div class="accordion">
          ${data.duplicateGroups.map((group, index) => `
            <div class="accordion-item">
              <h4 class="accordion-header">Group ${index + 1}: ${group.key || 'Unknown'} (${group.count} items)</h4>
              <div class="accordion-content">
                <ul class="duplicate-list">
                  ${group.items.map(item => `
                    <li>
                      <div>ID: ${item.id || ''}</div>
                      <div>Source: ${item.source || ''}</div>
                      <div>Action: ${item.action || 'None'}</div>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
    
    // Add accordion functionality
    setTimeout(() => {
      const accordionHeaders = document.querySelectorAll('.accordion-header');
      accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
          header.classList.toggle('active');
          const content = header.nextElementSibling;
          if (content.style.maxHeight) {
            content.style.maxHeight = null;
          } else {
            content.style.maxHeight = content.scrollHeight + 'px';
          }
        });
      });
    }, 0);
  }
  
  html += `</div>`;
  container.innerHTML = html;
}

/**
 * Render parcel conflicts report
 * @param {Object} data - Report data
 * @param {HTMLElement} container - Container element
 */
function renderParcelConflictsReport(data, container) {
  // Format HTML content
  let html = `<div class="report-content">`;
  
  // Add summary section
  html += `
    <section class="report-section">
      <h3>Parcel Conflicts Summary</h3>
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-value">${data.totalConflicts || 0}</span>
          <span class="stat-label">Total Conflicts</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.resolved || 0}</span>
          <span class="stat-label">Resolved</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${data.unresolved || 0}</span>
          <span class="stat-label">Unresolved</span>
        </div>
      </div>
    </section>
  `;
  
  // Add conflicts table if available
  if (data.conflicts && data.conflicts.length > 0) {
    html += `
      <section class="report-section">
        <h3>Conflicts</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>Parcel ID</th>
              <th>Conflict Type</th>
              <th>Status</th>
              <th>Resolution</th>
            </tr>
          </thead>
          <tbody>
            ${data.conflicts.map(conflict => `
              <tr>
                <td>${conflict.parcelId || ''}</td>
                <td>${conflict.type || ''}</td>
                <td>${getStatusBadge(conflict.status)}</td>
                <td>${conflict.resolution || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `;
  }
  
  html += `</div>`;
  container.innerHTML = html;
}

/**
 * Render generic JSON report
 * @param {Object} data - Report data
 * @param {HTMLElement} container - Container element
 */
function renderGenericJsonReport(data, container) {
  // Format HTML content
  let html = `<div class="report-content">`;
  
  // Add JSON viewer
  html += `
    <section class="report-section">
      <div class="json-viewer">
        ${formatJsonHtml(data)}
      </div>
    </section>
  `;
  
  html += `</div>`;
  container.innerHTML = html;
}

/**
 * Export current report as CSV
 */
function exportReportAsCSV() {
  if (!currentReport || !currentReport.data) {
    showExportMessage('error', 'No report data to export');
    return;
  }
  
  try {
    // Convert report data to CSV
    const csv = convertJsonToCSV(currentReport.data);
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentReport.id}_report.csv`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showExportMessage('success', 'Report exported as CSV');
    
  } catch (error) {
    console.error('Error exporting as CSV:', error);
    showExportMessage('error', `Export failed: ${error.message}`);
  }
}

/**
 * Export current report as PDF
 */
function exportReportAsPDF() {
  if (!currentReport || !currentReport.data) {
    showExportMessage('error', 'No report data to export');
    return;
  }
  
  // In a real implementation, this would use a library like jsPDF or pdfmake
  // For this demo, we'll just show a message
  showExportMessage('info', 'PDF export would be implemented with jsPDF or server-side generation');
}

/**
 * Show export message notification
 * @param {string} type - Message type (error, success, info)
 * @param {string} message - Message text
 */
function showExportMessage(type, message) {
  // Create notification
  const notification = document.createElement('div');
  notification.className = `export-notification ${type}`;
  notification.textContent = message;
  
  // Add to document
  document.body.appendChild(notification);
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 500); // Wait for fade-out transition
  }, 3000);
}

/**
 * Convert JSON to CSV
 * @param {Object} json - JSON data
 * @returns {string} CSV string
 */
function convertJsonToCSV(json) {
  // Handle simple objects
  if (typeof json !== 'object' || json === null) {
    return '';
  }
  
  // Handle arrays
  if (Array.isArray(json)) {
    // If array of objects, convert to CSV
    if (json.length > 0 && typeof json[0] === 'object' && json[0] !== null) {
      // Get headers from first object
      const headers = Object.keys(json[0]);
      
      // Create CSV rows
      const csvRows = [
        headers.join(','), // Header row
        ...json.map(row => 
          headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? 
              `"${value.replace(/"/g, '""')}"` : 
              value;
          }).join(',')
        )
      ];
      
      return csvRows.join('\n');
    }
    
    // Simple array
    return json.join(',');
  }
  
  // Handle object (convert to rows)
  const rows = [];
  
  for (const [key, value] of Object.entries(json)) {
    rows.push(`${key},${typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value}`);
  }
  
  return rows.join('\n');
}

/**
 * Format JSON as HTML
 * @param {Object} json - JSON data
 * @param {number} level - Indentation level
 * @returns {string} HTML representation of JSON
 */
function formatJsonHtml(json, level = 0) {
  const indent = '  '.repeat(level);
  
  if (typeof json !== 'object' || json === null) {
    // Handle primitive values
    return `<span class="json-${typeof json}">${
      json === null ? 'null' : json === undefined ? 'undefined' : String(json)
    }</span>`;
  }
  
  if (Array.isArray(json)) {
    // Handle arrays
    if (json.length === 0) {
      return '<span class="json-array">[]</span>';
    }
    
    return `
      <span class="json-array-bracket">[</span>
      <div class="json-array-items">
        ${json.map(item => 
          `<div class="json-array-item">${indent}  ${formatJsonHtml(item, level + 1)}</div>`
        ).join(',\n')}
      </div>
      ${indent}<span class="json-array-bracket">]</span>
    `;
  }
  
  // Handle objects
  const keys = Object.keys(json);
  
  if (keys.length === 0) {
    return '<span class="json-object">{}</span>';
  }
  
  return `
    <span class="json-object-bracket">{</span>
    <div class="json-object-items">
      ${keys.map(key => 
        `<div class="json-object-item">
          ${indent}  <span class="json-key">"${key}"</span>: ${formatJsonHtml(json[key], level + 1)}
        </div>`
      ).join(',\n')}
    </div>
    ${indent}<span class="json-object-bracket">}</span>
  `;
}

/**
 * Get status badge HTML
 * @param {string} status - Status value
 * @returns {string} HTML for status badge
 */
function getStatusBadge(status) {
  if (!status) return '<span class="status-badge">Unknown</span>';
  
  const statusMap = {
    'success': 'success',
    'error': 'error',
    'warning': 'warning',
    'failed': 'error',
    'resolved': 'success',
    'unresolved': 'warning',
    'pending': 'pending'
  };
  
  const statusClass = statusMap[status.toLowerCase()] || 'default';
  
  return `<span class="status-badge status-${statusClass}">${status}</span>`;
}

/**
 * Calculate success rate
 * @param {number} success - Success count
 * @param {number} total - Total count
 * @returns {string} Formatted percentage
 */
function calculateSuccessRate(success, total) {
  if (!total) return '0';
  const rate = (success / total) * 100;
  return rate.toFixed(1);
}
