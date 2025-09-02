const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Path to the parcel lookup file
const LOOKUP_PATH = path.join(__dirname, '..', 'data', 'lookups', 'num_parcel_lookup.json');
const COMMUNE_PATH = path.join(__dirname, '..', 'data', 'lookups', 'commune_lookup.json');

// Load lookups lazily when first requested
let parcelLookup = null;
let communeLookup = null;

// Fixed list of official commune names 
const OFFICIAL_COMMUNES = [
  'BALLOU',
  'GABOU',
  'MOUDERY',
  'BALA',
  'KOAR',
  'SINTHIOU MALEME',
  'NDOGA BABACAR',
  'NETTEBOULOU',
  'MISSIRAH',
  'BANDAFASSI',
  'DINDEFELO',
  'TOMBORONKOTO',
  'DIMBOLI',
  'FONGOLIMBI',
  'MEDINA BAFFE',
  'BEMBOU',
  'SABODALA'
];

// Mapping for alternate spellings to official names
const COMMUNE_SPELLING_VARIANTS = {
  'DINDEFELLO': 'DINDEFELO',
  'FONGOLEMBI': 'FONGOLIMBI'
};

/**
 * Helper to load the lookup data only when needed (lazy loading)
 */
const getParcelLookup = () => {
  if (parcelLookup === null) {
    try {
      console.log(`Loading parcel lookup data from ${LOOKUP_PATH}`);
      parcelLookup = JSON.parse(fs.readFileSync(LOOKUP_PATH, 'utf8'));
      console.log(`Loaded ${Object.keys(parcelLookup).length} parcels`);
    } catch (err) {
      console.error('Error loading parcel lookup:', err);
      parcelLookup = {};
    }
  }
  return parcelLookup;
};

/**
 * Helper to load the commune lookup data only when needed
 */
const getCommuneLookup = () => {
  if (communeLookup === null) {
    try {
      console.log(`Loading commune lookup data from ${COMMUNE_PATH}`);
      communeLookup = JSON.parse(fs.readFileSync(COMMUNE_PATH, 'utf8'));
      console.log(`Loaded ${Object.keys(communeLookup).length} communes`);
    } catch (err) {
      console.error('Error loading commune lookup:', err);
      communeLookup = {};
    }
  }
  return communeLookup;
};

// Root route to redirect to test page
app.get('/', (req, res) => {
  res.redirect('/api-test.html');
});

// API routes
app.get('/api/parcels/:num', (req, res) => {
  const parcelId = req.params.num;
  const lookup = getParcelLookup();
  
  if (lookup[parcelId]) {
    res.json({
      success: true,
      parcel: lookup[parcelId]
    });
  } else {
    res.status(404).json({
      success: false,
      error: `Parcel with ID ${parcelId} not found`
    });
  }
});

// Get commune info
app.get('/api/communes/:name', (req, res) => {
  let communeName = req.params.name.toUpperCase();
  const lookup = getCommuneLookup();
  
  // Check for spelling variants
  if (COMMUNE_SPELLING_VARIANTS[communeName]) {
    // If it's an alternate spelling, use the official spelling
    const officialSpelling = COMMUNE_SPELLING_VARIANTS[communeName];
    communeName = officialSpelling;
  }
  
  // Check if it's in the official list
  if (OFFICIAL_COMMUNES.includes(communeName)) {
    // If in lookup, return that data
    if (lookup[communeName]) {
      res.json({
        success: true,
        commune: lookup[communeName],
        official: true
      });
    } else {
      // If not in lookup but in official list, return a default structure
      res.json({
        success: true,
        commune: {
          name: communeName,
          count: 0,
          parcels: []
        },
        official: true,
        notice: "This is an official commune but no parcels were found in the current dataset"
      });
    }
  } else {
    // Check if this might be a misspelling
    const possibleMatches = OFFICIAL_COMMUNES.filter(name => 
      name.includes(communeName) || communeName.includes(name)
    );
    
    res.status(404).json({
      success: false,
      error: `Commune ${communeName} not found in official communes list`,
      officialCommunes: OFFICIAL_COMMUNES,
      possibleMatches: possibleMatches.length > 0 ? possibleMatches : undefined
    });
  }
});

// Get list of all commune names
app.get('/api/communes', (req, res) => {
  const lookup = getCommuneLookup();
  
  // Use the official communes list as the source of truth
  const communes = OFFICIAL_COMMUNES.map(name => {
    // Get count from lookup if available, otherwise set to 0
    const count = (lookup[name] && lookup[name].count) || 0;
    
    // Find any spelling variants for this commune
    const variants = Object.entries(COMMUNE_SPELLING_VARIANTS)
      .filter(([variant, official]) => official === name)
      .map(([variant]) => variant);
    
    return { 
      name, 
      count,
      alternateSpellings: variants.length > 0 ? variants : undefined
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  
  res.json({
    success: true,
    communes,
    spellingVariants: COMMUNE_SPELLING_VARIANTS
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`- API endpoints:`);
  console.log(`  GET /api/parcels/:num     - Get parcel details by Num_parcel`);
  console.log(`  GET /api/communes/:name   - Get commune details by name`);
  console.log(`  GET /api/communes         - Get list of all communes`);
});
