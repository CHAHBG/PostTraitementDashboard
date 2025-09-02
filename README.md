# Next-Generation Interactive Land Management Dashboard

A sophisticated, modern web-based dashboard for land management and administrative analysis using vanilla HTML, CSS, and JavaScript, featuring interactive maps, AI-powered insights, and comprehensive data visualization.

## Project Structure

The project consists of two main components:

1. **Express API Server**: Serves parcel and commune data with proper standardization
2. **Vanilla JS Dashboard**: Interactive web interface built with HTML5, CSS3, and ES2020+ JavaScript

## Technology Stack

### Core Technologies
- HTML5 with semantic markup
- Modern CSS3 (CSS Variables, Grid, Flexbox)
- Vanilla JavaScript (ES2020+)
- Progressive enhancement approach

### Libraries (Minimal Usage)
- **Leaflet**: For interactive mapping
- **D3.js**: For advanced data visualizations
- **Chart.js**: For charts and graphs
- Optional lightweight utilities:
  - Choices.js or Selectize for enhanced select controls
  - Fuse.js for fuzzy search

### Build Tools (Optional)
- Vite/Webpack/Rollup for development convenience
- Final deliverable will be static assets (HTML, CSS, JS)

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- For development:
  - Node.js (v14 or higher)
  - npm (v6 or higher)

### Installation

1. Clone this repository
2. Install API server dependencies:
   ```powershell
   cd server
   npm install
   ```
3. Run the API server:
   ```powershell
   cd server
   node index.js
   ```
4. Serve the dashboard files:
   ```powershell
   cd dashboard
   npx http-server -p 8080
   ```
5. Open http://localhost:8080 in your browser

### Deployment

To deploy to Netlify:

1. Build the static distribution:
   ```powershell
   cd dashboard
   node scripts/build-netlify.js
   ```
2. Upload the `dist` directory to GitHub
3. Connect your GitHub repository to Netlify
4. Set the publish directory to `dist` in Netlify settings
   cd dashboard
   npm install
   ```

### Running the Application

1. Start the API server:
   ```powershell
   cd server
   node index.js
   ```
2. Open the dashboard:
   - Development mode (with live reload):
     ```powershell
     cd dashboard
     npm run dev
     ```
   - Production mode: Simply open `index.html` in your browser or serve the files with any web server

## Dashboard Structure

The dashboard is organized into five main tabs, each providing specialized functionality:

### Tab 1: Executive Overview
- KPI cards using semantic HTML
- Animated counters implemented in vanilla JavaScript
- Mini Leaflet map showing commune boundaries
- Alerts panel driven by data quality checks

### Tab 2: Interactive Mapping
- Leaflet-based interactive map with multiple layers
- Layer toggles implemented with custom JavaScript controls
- Choropleth visualization using D3 color scales
- Parcel information panel on click events
- Fast search functionality using Fuse.js for fuzzy matching

### Tab 3: Data Analytics & Insights
- Dynamic charts using D3.js or Chart.js
- Interactive data tables with virtual scrolling
- Side-by-side comparison views using CSS Grid
- Filter and aggregation tools

### Tab 4: AI-Powered Intelligence
- Natural language query interface
- Server-proxied AI integrations (GPT-5 Mini / Claude)
- Structured recommendations display
- Dynamic visualization of AI insights

### Tab 5: Administrative Reports
- JSON to HTML report rendering
- Client-side export functionality (CSV, Excel, PDF)
- Dynamic report builder interface
- Processing pipeline visualization

## Implementation Details

### State Management
- ES modules for code organization
- Custom events for component communication
- Small store pattern for shared state
- localStorage/IndexedDB for persistence

### UI/UX Features
- Dark/Light mode toggle with CSS variables
- Responsive design using CSS Grid and Flexbox
- Accessibility-first approach with semantic HTML and ARIA
- Progressive enhancement for core functionality

### Performance Optimization
- Virtual scrolling for large datasets
- Dynamic module imports for code splitting
- IndexedDB/Cache API for offline capabilities
- GeoJSON optimization techniques

## API Endpoints

### Commune Data
- `GET /api/communes` - List all communes with counts
- `GET /api/communes/:name` - Get details for specific commune

### Parcel Data
- `GET /api/parcels/:num` - Get parcel details by ID

### AI Integration (Server-Proxied)
- `POST /api/ai/analyze` - Send natural language query for AI analysis
- `POST /api/ai/visualize` - Generate AI-powered visualizations
## Project Directory Structure

```
dashboard/
├── index.html             # Main entry point
├── assets/                # Static assets
│   ├── css/               # CSS files
│   │   ├── main.css       # Main stylesheet
│   │   ├── components/    # Component-specific styles
│   │   └── themes/        # Light/dark theme variables
│   ├── js/                # JavaScript modules
│   │   ├── app.js         # Application entry point
│   │   ├── components/    # UI components
│   │   ├── services/      # API and data services
│   │   ├── utils/         # Utility functions
│   │   └── views/         # Tab-specific code
│   └── images/            # Icons and images
├── data/                  # Local data files
│   └── lookups/           # Generated lookup files
└── lib/                   # Third-party libraries
    
server/
├── index.js               # Express server entry point
├── routes/                # API route definitions
├── controllers/           # Request handlers
├── services/              # Business logic
└── middleware/            # Express middleware

geojson/
├── communes/              # Commune boundary data
└── parcels/               # Parcel data files
```

## Data Sources

The application uses GeoJSON and JSON data from:
- `geojson/communes/communes.geojson` - Commune boundaries
- `geojson/parcels/*.geojson` - Parcel data collections
- `data/dashboard_data_complete.json` - Dashboard core data
- `data/dashboard_kpis.json` - Key performance indicators
- `data/lookups/` - Generated lookup files

## Development Guidelines

### Code Organization
- Use ES modules for better code organization
- Follow BEM methodology for CSS
- Implement components as independent modules with clear interfaces
- Use custom events for component communication

### Testing
- Unit tests for JavaScript modules with Jest
- Integration tests for UI interactions with jsdom or Cypress
- End-to-end tests for critical user flows

### Performance Considerations
- Minimize main thread blocking operations
- Use efficient data structures for large datasets
- Implement pagination or virtual scrolling for tables
- Use requestAnimationFrame for smooth animations

### Security Best Practices
- Sanitize all user inputs
- Use content security policies
- Store sensitive operations on server-side
- Validate data on both client and server sides

### Deliverables
- Static HTML, CSS, and JavaScript files
- Documentation and examples
- Server-side code for API and AI integration
- Test suite and performance benchmarks
